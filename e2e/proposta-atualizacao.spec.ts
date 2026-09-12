import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type { AcompanhamentoProposta } from '../src/lib/propostas/acompanhamento';

const BASE: AcompanhamentoProposta = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'apresentada',
  versao: 2,
  execucaoId: null,
  compartilhamento: {
    codigo: '44444444-4444-4444-8444-444444444444',
    ativo: true,
    compartilhadaEm: '2026-09-12T12:00:00Z',
    primeiraVisualizacaoEm: '2026-09-12T12:15:00Z',
    ultimaVisualizacaoEm: '2026-09-12T12:20:00Z',
    visualizacoes: 4,
    decisaoNome: null,
    decisaoEmail: null,
    decisaoComentario: null,
    decididaEm: null,
  },
};

async function abrir(
  page: Page,
  resposta: () => { status?: number; dados?: AcompanhamentoProposta },
) {
  const escritas: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') escritas.push(request.url());
  });
  await page.route('**/api/propostas/*/acompanhamento', async (route) => {
    const { status = 200, dados = BASE } = resposta();
    await route.fulfill({ status, json: dados });
  });
  await page.clock.install();
  await page.goto('/preview/proposta-editor?estado=sem-visualizacoes&sincronizar=sim');
  await expect(page.getByLabel('Nome da proposta')).toBeEditable();
  return escritas;
}

test('visualizações chegam sem recarregar, deslocar foco ou apagar o que está sendo digitado', async ({
  page,
}) => {
  let consultas = 0;
  const escritas = await abrir(page, () => {
    consultas += 1;
    return { dados: BASE };
  });
  const campo = page.getByLabel('Nome da proposta');
  const titulo = 'Atendimento e agendamento com IA — revisão ainda não salva';
  await campo.fill(titulo);
  const antes = (await campo.boundingBox())!.y;
  await page.clock.fastForward(30_000);
  await expect(page.getByText('4 visualizações', { exact: true })).toBeVisible();
  await expect(campo).toBeFocused();
  await expect(campo).toHaveValue(titulo);
  expect(Math.abs((await campo.boundingBox())!.y - antes)).toBeLessThan(5);
  await expect(page.getByRole('button', { name: 'Copiar link' })).toBeDisabled();
  expect(consultas).toBe(1);
  expect(escritas).toEqual([]);
});

test('aceite mostra o próximo passo, mantém a resposta recolhida e não navega sozinho', async ({
  page,
}, testInfo) => {
  const escritas = await abrir(page, () => ({
    dados: {
      ...BASE,
      status: 'aceita',
      versao: 3,
      execucaoId: '55555555-5555-4555-8555-555555555555',
      compartilhamento: {
        ...BASE.compartilhamento,
        decisaoNome: 'Camila Rios',
        decisaoEmail: 'camila@example.test',
        decisaoComentario: 'Projeto aprovado. Vamos alinhar os acessos e o início do trabalho.',
        decididaEm: '2026-09-12T12:30:00Z',
      },
    },
  }));
  await page.clock.fastForward(30_000);
  const painel = page.getByRole('region', { name: 'Acompanhar proposta' });
  await expect(painel.getByRole('heading', { name: 'Proposta aceita' })).toBeVisible();
  await expect(painel.getByRole('link', { name: /Abrir entrega/ })).toBeVisible();
  await expect(painel.getByText('Projeto aprovado.', { exact: false })).not.toBeVisible();
  await expect(page).toHaveURL(/preview\/proposta-editor/);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('aceite-automatico.png') });
  await painel.getByRole('button', { name: 'Dispensar aviso de atualização' }).click();
  await page.clock.fastForward(30_000);
  await expect(painel.getByRole('button', { name: 'Dispensar aviso de atualização' })).toHaveCount(
    0,
  );
  expect(escritas).toEqual([]);
});

test('recusa durante edição não perde campos ou a seção aberta', async ({ page }) => {
  await abrir(page, () => ({ dados: { ...BASE, status: 'recusada', versao: 3 } }));
  await page.getByRole('heading', { name: 'Valor e condições', exact: true }).click();
  const campo = page.getByRole('textbox', { name: 'Condições de pagamento', exact: true });
  await campo.click();
  await campo.fill('Condição em discussão com o cliente.');
  await expect(campo).toBeInViewport();
  const topo = (await campo.boundingBox())!.y;
  await page.clock.fastForward(30_000);
  await expect(page.getByRole('heading', { name: 'Proposta não aprovada' })).toBeVisible();
  await expect(campo).toHaveValue('Condição em discussão com o cliente.');
  await expect(campo).toBeFocused();
  await expect(campo).toBeInViewport();
  expect(Math.abs((await campo.boundingBox())!.y - topo)).toBeLessThan(5);
  await expect(
    page.getByRole('region', { name: 'Editar proposta', exact: true }).locator('details[open]'),
  ).toHaveCount(1);
});

test('falhas e sessão expirada mantêm a edição, com retomada sem sair da página', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.setViewportSize(isMobile ? { width: 320, height: 740 } : { width: 820, height: 1100 });
  let status = 503;
  await abrir(page, () => ({ status }));
  const campo = page.getByLabel('Nome da proposta');
  await campo.fill('Minha proposta ainda em edição');
  await page.clock.fastForward(30_000);
  await expect(
    page.getByText('Não foi possível atualizar. Exibindo a última informação.'),
  ).toBeVisible();
  await expect(campo).toHaveValue('Minha proposta ainda em edição');
  status = 401;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  const aviso = page.getByText('Entre novamente para atualizar. Sua edição continua aqui.');
  await expect(aviso).toBeVisible();
  await expect(page.getByRole('link', { name: 'Entrar em outra aba' })).toHaveAttribute(
    'target',
    '_blank',
  );
  await expect(
    page.getByRole('button', { name: isMobile ? 'Salvar' : 'Salvar alterações', exact: true }),
  ).toBeDisabled();
  await aviso.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('sessao-preservada.png') });
  status = 200;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(aviso).toHaveCount(0);
  await expect(campo).toHaveValue('Minha proposta ainda em edição');
  await expect(
    page.getByRole('button', { name: isMobile ? 'Salvar' : 'Salvar alterações', exact: true }),
  ).toBeEnabled();
});

test('link alterado em outra aba não fecha o modal nem permite desativar um endereço diferente', async ({
  page,
}) => {
  let dados = BASE;
  const escritas = await abrir(page, () => ({ dados }));
  await page.getByText('Gerenciar acesso', { exact: true }).click();
  await page.getByRole('button', { name: 'Desativar link', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Desativar acesso do cliente?' });
  await modal.getByRole('button', { name: 'Cancelar' }).focus();
  const codigo = '66666666-6666-4666-8666-666666666666';
  dados = { ...BASE, compartilhamento: { ...BASE.compartilhamento, codigo } };
  await page.clock.fastForward(30_000);
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await expect(modal.getByRole('button', { name: 'Desativar link' })).toBeDisabled();
  await expect(modal.getByRole('alert')).toContainText('O link mudou em outra aba');
  await modal.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByLabel('Link da proposta')).toHaveValue(
    `https://subido.viverdeia.ai/proposta/${codigo}`,
  );
  dados = { ...dados, compartilhamento: { ...dados.compartilhamento, ativo: false } };
  await page.clock.fastForward(30_000);
  await expect(page.getByText('Link desativado', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copiar link' })).toHaveCount(0);
  expect(escritas).toEqual([]);
});
