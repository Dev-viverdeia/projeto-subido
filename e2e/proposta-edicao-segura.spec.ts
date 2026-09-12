import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { EdicaoPropostaSchema, type EdicaoProposta } from '../src/lib/propostas/edicao';

async function abrir(page: Page) {
  let atual!: EdicaoProposta;
  let codigo = 200;
  let leituras = 0;
  const escritas: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') escritas.push(r.url());
  });
  await page.route('**/api/propostas/*/edicao', async (route) => {
    leituras += 1;
    await route.fulfill({ status: codigo, json: atual });
  });
  await page.route('**/api/propostas/*/acompanhamento', async (route) => {
    await route.fulfill({
      json: {
        id: atual.id,
        versao: atual.versao,
        status: atual.status,
        execucaoId: null,
        compartilhamento: {
          codigo: null,
          ativo: false,
          compartilhadaEm: null,
          primeiraVisualizacaoEm: null,
          ultimaVisualizacaoEm: null,
          visualizacoes: 0,
          decisaoNome: null,
          decisaoEmail: null,
          decisaoComentario: null,
          decididaEm: null,
        },
      },
    });
  });
  await page.clock.install();
  await page.goto('/preview/proposta-editor?estado=rascunho&sincronizar=sim');
  await expect(page.getByLabel('Nome da proposta')).toBeEditable();
  atual = EdicaoPropostaSchema.parse({
    id: '11111111-1111-4111-8111-111111111111',
    titulo: await page.getByLabel('Nome da proposta').inputValue(),
    documento: JSON.parse(await page.locator('input[name="documento"]').first().inputValue()),
    versao: 2,
    status: 'rascunho',
  });
  return {
    get: () => atual,
    mudar: (edicao: EdicaoProposta) => {
      atual = edicao;
    },
    falhar: (status: number) => {
      codigo = status;
    },
    leituras: () => leituras,
    escritas,
  };
}

test('mudança remota preserva digitação e foco; comparação mostra somente diferenças e permite voltar', async ({
  page,
  isMobile,
}, testInfo) => {
  const servidor = await abrir(page);
  const campo = page.getByLabel('Nome da proposta');
  await campo.fill('Minha revisão com atendimento e agendamento');
  const antes = (await campo.boundingBox())!.y;
  const remota = structuredClone(servidor.get());
  remota.versao = 3;
  remota.titulo = 'Proposta revista em outro dispositivo';
  remota.documento.investimento.valorCentavos = 2350000;
  servidor.mudar(remota);
  await page.clock.fastForward(30_000);
  await expect(page.getByRole('button', { name: 'Revisar alteração' })).toBeVisible();
  await expect(campo).toBeFocused();
  await expect(campo).toHaveValue('Minha revisão com atendimento e agendamento');
  expect(Math.abs((await campo.boundingBox())!.y - antes)).toBeLessThan(5);
  await expect(
    page.getByRole('button', { name: isMobile ? 'Salvar' : 'Salvar alterações', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Revisar alteração' }).click();
  const modal = page.getByRole('dialog', { name: 'Revisar alteração' });
  await expect(modal).toBeVisible();
  await expect(modal.locator('details')).toHaveCount(2);
  await expect(modal.getByText(remota.titulo, { exact: true })).toBeVisible();
  await modal.locator('summary').filter({ hasText: 'Valor e condições' }).click();
  await expect(modal.getByText('23.500,00', { exact: false })).toBeVisible();
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('comparacao.png') });
  await modal.getByRole('button', { name: 'Voltar à edição' }).click();
  await expect(page.getByRole('button', { name: 'Revisar alteração' })).toBeFocused();
  await expect(campo).toHaveValue('Minha revisão com atendimento e agendamento');
  expect(servidor.escritas).toEqual([]);
});

test('mudança apenas no status não abre comparação nem perde o rascunho local', async ({
  page,
}) => {
  const servidor = await abrir(page);
  await page.getByLabel('Nome da proposta').fill('Edição local em andamento');
  servidor.mudar({ ...servidor.get(), status: 'pronta', versao: 3 });
  await page.clock.fastForward(30_000);
  await expect(page.locator('input[name="versao"]').first()).toHaveValue('3');
  await expect(page.getByRole('region', { name: 'Atualização do documento' })).toHaveCount(0);
  await expect(page.getByLabel('Nome da proposta')).toHaveValue('Edição local em andamento');
  expect(servidor.leituras()).toBe(1);
  expect(servidor.escritas).toEqual([]);
});

test('carrega a versão salva apenas por escolha; formulário seguinte usa essa versão', async ({
  page,
}) => {
  const servidor = await abrir(page);
  await page.getByLabel('Nome da proposta').fill('Edição a descartar por decisão explícita');
  servidor.mudar({ ...servidor.get(), titulo: 'Edição escolhida do servidor', versao: 3 });
  await page.clock.fastForward(30_000);
  await page.getByRole('button', { name: 'Revisar alteração' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Usar versão salva' }).click();
  await expect(page.getByLabel('Nome da proposta')).toHaveValue('Edição escolhida do servidor');
  await expect(page.getByLabel('Nome da proposta')).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('input[name="versao"]').first()).toHaveValue('3');
  expect(servidor.escritas).toEqual([]);
});

test('comparação aberta não muda silenciosamente; ao reabrir, lê a revisão mais recente', async ({
  page,
}) => {
  const servidor = await abrir(page);
  servidor.mudar({ ...servidor.get(), titulo: 'Revisão três', versao: 3 });
  await page.clock.fastForward(30_000);
  await page.getByRole('button', { name: 'Revisar alteração' }).click();
  const modal = page.getByRole('dialog');
  servidor.mudar({ ...servidor.get(), titulo: 'Revisão quatro', versao: 4 });
  await page.clock.fastForward(30_000);
  await expect(modal.locator('input[name="versao"]')).toHaveValue('3');
  await expect(modal.getByText('Revisão três', { exact: true })).toBeVisible();
  await modal.getByRole('button', { name: 'Voltar à edição' }).click();
  await expect.poll(() => servidor.leituras()).toBe(2);
  await page.getByRole('button', { name: 'Revisar alteração' }).click();
  await expect(modal.locator('input[name="versao"]')).toHaveValue('4');
  expect(servidor.escritas).toEqual([]);
});

test('falha de leitura e sessão expirada têm recuperação sem apagar conteúdo em 320 px', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize(isMobile ? { width: 320, height: 740 } : { width: 820, height: 1100 });
  const servidor = await abrir(page);
  await page.getByLabel('Nome da proposta').fill('Texto preservado durante a falha');
  servidor.mudar({ ...servidor.get(), titulo: 'Revisão do servidor', versao: 3 });
  servidor.falhar(503);
  await page.clock.fastForward(30_000);
  const aviso = page.getByRole('region', { name: 'Atualização do documento' });
  await expect(
    aviso.getByText('Não foi possível conferir a versão salva. Tente novamente.'),
  ).toBeVisible();
  servidor.falhar(401);
  await aviso.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(aviso.getByRole('link', { name: 'Entrar em outra aba' })).toHaveAttribute(
    'target',
    '_blank',
  );
  servidor.falhar(200);
  await aviso.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(aviso.getByRole('button', { name: 'Revisar alteração' })).toBeVisible();
  await expect(page.getByLabel('Nome da proposta')).toHaveValue('Texto preservado durante a falha');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
