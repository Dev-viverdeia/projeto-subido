import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const origem = '77777777-7777-4777-8777-777777777777';
const imagem =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXxkAAAAASUVORK5CYII=';
const arquivos = Array.from({ length: 25 }, (_, i) => ({
  id: `88888888-8888-4888-8888-${String(i).padStart(12, '0')}`,
  nome:
    i === 0
      ? 'Referência do atendimento.png'
      : i === 1
        ? 'Briefing da reunião.webm'
        : i === 2
          ? 'Escopo 20%_final.pdf'
          : `Anotações do projeto ${i}.txt`,
  categoria: i === 0 ? 'imagem' : i === 1 ? 'audio' : 'documento',
  tipoMime:
    i === 0 ? 'image/png' : i === 1 ? 'audio/webm' : i === 2 ? 'application/pdf' : 'text/plain',
  tamanhoBytes: 12000 + i * 1000,
  mensagemId: origem,
  criadoEm: '2026-09-10T12:00:00.000Z',
}));
test.beforeEach(async ({ page }) => {
  await page.route('**/api/consultor/**', (route) =>
    route.fulfill({ status: 401, json: { erro: 'IA bloqueada no teste' } }),
  );
  await page.route('**/*.supabase.co/**', (route) => route.abort());
  await page.route('**/api/consultor/arquivos?**', async (route) => {
    const query = new URL(route.request().url()).searchParams;
    const busca = query.get('busca')?.toLowerCase() ?? '';
    const pagina = Number(query.get('pagina') ?? 0);
    const filtrados = arquivos.filter((a) => a.nome.toLowerCase().includes(busca));
    await route.fulfill({
      json: {
        arquivos: filtrados.slice(pagina * 20, (pagina + 1) * 20),
        total: filtrados.length,
        mais: (pagina + 1) * 20 < filtrados.length,
      },
    });
  });
  await page.goto('/preview/consultor-conversa?arquivos=1');
  await page.getByRole('textbox').fill('Rascunho para enviar depois.');
});

test('lista discreta, busca, paginação, mensagem original e rascunho', async ({ page }, info) => {
  const pedidos: string[] = [];
  page.on('request', (r) => pedidos.push(r.url()));
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  const gatilho = page.getByRole('button', { name: 'Arquivos da conversa' });
  await expect(gatilho).toBeVisible();
  expect(pedidos.some((p) => p.includes('/api/consultor/arquivos'))).toBe(false);
  await gatilho.focus();
  await page.keyboard.press('Enter');
  const modal = page.getByRole('dialog', { name: 'Arquivos da conversa' });
  await expect(modal.getByText('25 arquivos nesta conversa')).toBeVisible();
  await expect(modal.getByRole('listitem')).toHaveCount(20);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath('arquivos.png') });
  await modal.getByRole('button', { name: 'Carregar mais arquivos' }).click();
  await expect(modal.getByRole('listitem')).toHaveCount(25);
  await expect(modal.getByRole('button', { name: 'Carregar mais arquivos' })).toBeHidden();
  await modal.getByRole('searchbox').fill('20%_');
  await expect(modal.getByRole('listitem')).toHaveCount(1);
  await expect(modal.getByText('Escopo 20%_final.pdf', { exact: true })).toBeVisible();
  await modal.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(modal.getByRole('listitem')).toHaveCount(20);
  await modal.getByRole('searchbox').fill('referência');
  await expect(modal.getByRole('listitem')).toHaveCount(1);
  const antes = await page.evaluate(() => window.scrollY);
  await modal
    .getByRole('button', { name: 'Ver mensagem de Referência do atendimento.png' })
    .click();
  await expect(modal).toBeHidden();
  await expect(page.locator(`#sobral-mensagem-${origem}`)).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(antes);
  await expect(page.getByRole('textbox')).toHaveValue('Rascunho para enviar depois.');
  expect(pedidos.some((p) => /\/api\/consultor\/(responder|gerar)/.test(p))).toBe(false);
});

test('prévia não empilha modais e volta à mesma busca e foco', async ({ page }) => {
  await page.route(`**/api/consultor/anexos/${arquivos[0].id}`, (route) =>
    route.fulfill({ contentType: 'image/png', body: Buffer.from(imagem.split(',')[1], 'base64') }),
  );
  const gatilho = page.getByRole('button', { name: 'Arquivos da conversa' });
  await gatilho.click();
  const modal = page.getByRole('dialog', { name: 'Arquivos da conversa' });
  await modal.getByRole('searchbox').fill('Referência');
  const abrir = modal.getByRole('button', { name: 'Abrir Referência do atendimento.png' });
  await abrir.click();
  const previa = page.getByRole('dialog', { name: 'Ver imagem' });
  await expect(previa.getByRole('img')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await previa.getByRole('button', { name: 'Voltar aos arquivos' }).click();
  await expect(modal.getByRole('searchbox')).toHaveValue('Referência');
  await expect(abrir).toBeFocused();
  await abrir.click();
  await expect(previa.getByRole('img')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(gatilho).toBeFocused();
  await expect(page.getByRole('textbox')).toHaveValue('Rascunho para enviar depois.');
});

test('erro, repetição, estado vazio e mudança de sessão têm saída clara', async ({ page }) => {
  let estado = 503;
  await page.route('**/api/consultor/arquivos?**', (route) =>
    route.fulfill({
      status: estado,
      json: estado === 200 ? { arquivos: [], total: 0, mais: false } : {},
    }),
  );
  await page.getByRole('button', { name: 'Arquivos da conversa' }).click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('alert')).toContainText('Não foi possível buscar');
  estado = 200;
  await modal.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(modal.getByText('Seus arquivos ficam aqui')).toBeVisible();
  await modal.getByRole('searchbox').fill('ausente');
  await expect(modal.getByText('Nenhum arquivo com esse nome')).toBeVisible();
  estado = 401;
  await modal.getByRole('searchbox').fill('sessão');
  await expect(modal.getByRole('alert')).toContainText('Entre novamente na mesma conta.');
  await expect(modal.getByRole('listitem')).toHaveCount(0);
  await modal.getByRole('button', { name: 'Fechar diálogo' }).click();
  await expect(page.getByRole('textbox')).toHaveValue('Rascunho para enviar depois.');
});

test('busca nova vence resposta atrasada e áudio tem player na própria conversa', async ({
  page,
}) => {
  await page.route('**/api/consultor/arquivos?**', async (route) => {
    const busca = new URL(route.request().url()).searchParams.get('busca') ?? '';
    if (busca === 'lento') await new Promise((resolve) => setTimeout(resolve, 700));
    await route
      .fulfill({
        json: {
          arquivos: busca === 'áudio' ? [arquivos[1]] : [arquivos[0]],
          total: 1,
          mais: false,
        },
      })
      .catch(() => {});
  });
  await page.getByRole('button', { name: 'Arquivos da conversa' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('searchbox').fill('lento');
  await page.waitForRequest((r) => r.url().includes('busca=lento'));
  await modal.getByRole('searchbox').fill('áudio');
  await expect(modal.getByRole('button', { name: 'Abrir Briefing da reunião.webm' })).toBeVisible();
  await page.waitForTimeout(750);
  await expect(
    modal.getByRole('button', { name: 'Abrir Referência do atendimento.png' }),
  ).toBeHidden();
  await modal.getByRole('button', { name: 'Abrir Briefing da reunião.webm' }).click();
  await expect(page.getByRole('dialog', { name: 'Ouvir áudio' }).locator('audio')).toHaveCount(1);
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Baixar áudio' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar aos arquivos' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('áudio');
});

test('cabeçalho e controles cabem em celular, tablet e desktop', async ({ page }, info) => {
  for (const width of [320, 600, 768, 1080, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const abrir = page.getByRole('button', { name: 'Arquivos da conversa' });
    await expect(abrir).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    const caixa = await abrir.boundingBox();
    expect(caixa?.width).toBeGreaterThanOrEqual(44);
    expect(caixa?.height).toBeGreaterThanOrEqual(44);
    expect((caixa?.x ?? 0) + (caixa?.width ?? 0)).toBeLessThanOrEqual(width);
    if (width === 768) await page.screenshot({ path: info.outputPath('cabecalho-tablet.png') });
  }
});
