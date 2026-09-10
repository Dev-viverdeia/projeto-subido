import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const resposta = '55555555-5555-4555-8555-555555555555';
const usuario = '66666666-6666-4666-8666-666666666666';
const mensagens = Array.from({ length: 25 }, (_, i) => ({
  id:
    i === 0
      ? resposta
      : i === 1
        ? usuario
        : `99999999-9999-4999-8999-${String(i).padStart(12, '0')}`,
  papel: i % 2 ? 'usuario' : 'consultor',
  trecho:
    i === 0
      ? 'Revise o escopo final e combine quando o cliente decide.'
      : i === 1
        ? 'O que eu preciso fazer agora para avançar a Clínica Aurora?'
        : `O escopo da reunião ${i} inclui o limite de 20%_ sem alterações.`,
  criadoEm: '2026-09-10T12:00:00.000Z',
}));
test.beforeEach(async ({ page }) => {
  await page.route('**/api/consultor/**', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/*.supabase.co/**', (route) => route.abort());
  await page.route('**/api/consultor/mensagens/busca?**', async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const termo = params.get('busca')?.toLowerCase() ?? '';
    const pagina = Number(params.get('pagina') ?? 0);
    const filtradas = mensagens.filter((m) => m.trecho.toLowerCase().includes(termo));
    await route.fulfill({
      json: {
        mensagens: filtradas.slice(pagina * 20, (pagina + 1) * 20),
        total: filtradas.length,
        mais: (pagina + 1) * 20 < filtradas.length,
      },
    });
  });
  await page.goto('/preview/consultor-conversa?arquivos=1');
  await page.getByRole('textbox').fill('Meu rascunho deve continuar aqui.');
});

test('busca sob demanda, destaque, paginação e salto preservam texto e anexo', async ({
  page,
}, info) => {
  const pedidos: string[] = [];
  page.on('request', (r) => pedidos.push(r.url()));
  await page.locator('input[type=file]').setInputFiles({
    name: 'rascunho.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Contexto não enviado'),
  });
  const gatilho = page.getByRole('button', { name: 'Buscar nesta conversa' });
  await gatilho.focus();
  await page.keyboard.press('Enter');
  const modal = page.getByRole('dialog', { name: 'Buscar nesta conversa' });
  await expect(modal.getByText('Encontre o que já conversaram')).toBeVisible();
  await modal.getByRole('searchbox').fill('e');
  await expect(modal.getByText('Digite pelo menos 2 caracteres.')).toBeVisible();
  expect(pedidos.some((p) => p.includes('/mensagens/busca'))).toBe(false);
  await modal.getByRole('searchbox').fill('ESCOPO');
  await expect(modal.getByText('24 mensagens encontradas')).toBeVisible();
  await expect(modal.getByRole('listitem')).toHaveCount(20);
  await expect(modal.locator('mark').first()).toHaveText('escopo');
  expect(
    (
      await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('busca-mensagens.png') });
  await modal.getByRole('button', { name: 'Carregar mais resultados' }).click();
  await expect(modal.getByRole('listitem')).toHaveCount(24);
  await expect(modal.getByRole('button', { name: 'Carregar mais resultados' })).toBeHidden();
  await modal.getByRole('searchbox').fill('20%_');
  await expect(modal.getByText('23 mensagens encontradas')).toBeVisible();
  await expect(modal.locator('mark').first()).toHaveText('20%_');
  await modal.getByRole('searchbox').fill('escopo final');
  await expect(modal.getByRole('listitem')).toHaveCount(1);
  const scroll = await page.evaluate(() => scrollY);
  await modal.getByRole('listitem').getByRole('button').click();
  await expect(modal).toBeHidden();
  await expect(page.locator(`#sobral-mensagem-${resposta}`)).toBeFocused();
  await expect(page.locator('[data-trecho-encontrado]')).toContainText('escopo final');
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await expect(page.getByRole('textbox')).toHaveValue('Meu rascunho deve continuar aqui.');
  await expect(page.getByText('rascunho.txt', { exact: true })).toBeVisible();
  expect(pedidos.some((p) => /\/api\/consultor\/(responder|gerar)/.test(p))).toBe(false);
  await gatilho.click();
  await expect(modal.getByRole('searchbox')).toHaveValue('escopo final');
  await modal.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(modal.getByRole('searchbox')).toBeFocused();
  await modal.getByRole('searchbox').fill('Clínica Aurora');
  await modal.getByRole('listitem').getByRole('button').click();
  const origemUsuario = page.locator(`#sobral-mensagem-${usuario}`);
  await expect(origemUsuario).toBeFocused();
  expect(
    (
      await new AxeBuilder({ page })
        .include(`#sobral-mensagem-${usuario}`)
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await gatilho.click();
  await page.keyboard.press('Escape');
  await expect(gatilho).toBeFocused();
});

test('resposta recolhida abre no parágrafo encontrado', async ({ page }) => {
  await page.goto('/preview/consultor-conversa?arquivos=1&leitura=longa');
  const texto = await page.locator('[data-texto-resposta] details p').last().textContent();
  expect(texto).toBeTruthy();
  const termo = texto!.slice(0, 30);
  await page.route('**/api/consultor/mensagens/busca?**', (route) =>
    route.fulfill({
      json: { mensagens: [{ ...mensagens[0], trecho: texto }], total: 1, mais: false },
    }),
  );
  await page.getByRole('textbox').fill('Rascunho intacto.');
  await page.getByRole('button', { name: 'Buscar nesta conversa' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('searchbox').fill(termo);
  await modal.getByRole('listitem').getByRole('button').click();
  await expect(page.locator('[data-texto-resposta] details')).toHaveAttribute('open', '');
  const alvo = page.locator('[data-trecho-encontrado]');
  await expect(alvo).toHaveText(texto!);
  const rect = await alvo.boundingBox();
  const leitura = await page.locator('[data-leitura-conversa]').boundingBox();
  expect(rect!.y).toBeGreaterThanOrEqual(leitura!.y);
  expect(rect!.y).toBeLessThan(leitura!.y + leitura!.height);
  await expect(page.getByRole('textbox')).toHaveValue('Rascunho intacto.');
});

test('falha, tentativa, resultado vazio, troca de conta e resposta atrasada', async ({ page }) => {
  let estado = 503;
  await page.route('**/api/consultor/mensagens/busca?**', async (route) => {
    const busca = new URL(route.request().url()).searchParams.get('busca');
    if (busca === 'lento') await new Promise((r) => setTimeout(r, 700));
    await route
      .fulfill({
        status: estado,
        json:
          estado === 200
            ? {
                mensagens: busca === 'rápido' ? [mensagens[0]] : [],
                total: busca === 'rápido' ? 1 : 0,
                mais: false,
              }
            : {},
      })
      .catch(() => {});
  });
  await page.getByRole('button', { name: 'Buscar nesta conversa' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('searchbox').fill('escopo');
  await expect(modal.getByRole('alert')).toContainText('Não foi possível buscar');
  estado = 200;
  await modal.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(modal.getByText('Nenhuma mensagem encontrada')).toBeVisible();
  await modal.getByRole('searchbox').fill('lento');
  await page.waitForRequest((r) => r.url().includes('busca=lento'));
  await modal.getByRole('searchbox').fill('rápido');
  await expect(modal.getByRole('listitem')).toHaveCount(1);
  await page.waitForTimeout(750);
  await expect(modal.getByRole('listitem')).toHaveCount(1);
  estado = 401;
  await modal.getByRole('searchbox').fill('sessão');
  await expect(modal.getByRole('alert')).toContainText('Entre novamente na mesma conta.');
  await expect(modal.getByRole('listitem')).toHaveCount(0);
  await modal.getByRole('button', { name: 'Fechar diálogo' }).click();
  await expect(page.getByRole('textbox')).toHaveValue('Meu rascunho deve continuar aqui.');
});

test('controles e busca cabem de 320px ao desktop, com texto e focos legíveis', async ({
  page,
}, info) => {
  for (const width of [320, 390, 600, 768, 1080, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    for (const nome of ['Buscar nesta conversa', 'Arquivos da conversa']) {
      const controle = page.getByRole('button', { name: nome });
      const rect = await controle.boundingBox();
      expect(rect!.width).toBeGreaterThanOrEqual(44);
      expect(rect!.height).toBeGreaterThanOrEqual(44);
      expect(rect!.x).toBeGreaterThanOrEqual(0);
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(width);
    }
    const nova = await page.getByRole('link', { name: 'Nova conversa' }).boundingBox();
    expect(nova!.width).toBeGreaterThanOrEqual(44);
    expect(nova!.height).toBeGreaterThanOrEqual(44);
    await page.getByRole('button', { name: 'Buscar nesta conversa' }).click();
    const modal = page.getByRole('dialog');
    await modal.getByRole('searchbox').fill('escopo final');
    await expect(modal.getByRole('listitem')).toHaveCount(1);
    expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    if (width === 320 || width === 1440)
      await page.screenshot({ path: info.outputPath(`busca-${width}.png`) });
    await page.keyboard.press('Escape');
  }
});
