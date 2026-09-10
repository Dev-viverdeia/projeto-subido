import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
const antiga = {
  id: '44444444-4444-4444-8444-444444444444',
  titulo: 'Proposta antiga da clínica',
  criadoEm: '2026-08-01T12:00:00Z',
  atualizadoEm: '2026-08-01T12:00:00Z',
};
test.beforeEach(async ({ page }) => {
  await page.route(`https://${host}/**`, (route) => route.abort('failed'));
  await page.route('**/api/consultor/responder**', (route) =>
    route.fulfill({ status: 401, json: { erro: 'IA bloqueada no teste' } }),
  );
});
test('busca conversa antiga e limpar recupera as recentes', async ({ page }) => {
  await page.route('**/api/consultor/conversas?**', (route) =>
    route.fulfill({ json: { threads: [antiga], total: 1, mais: false } }),
  );
  await page.goto('/preview/consultor?historico=1');
  await page.getByRole('button', { name: /Conversas/ }).click();
  const busca = page.getByRole('searchbox');
  await expect(busca).toBeFocused();
  await busca.fill('antiga');
  await expect(page.getByRole('link', { name: /Proposta antiga da clínica/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Plano de entrega/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(page.getByRole('link', { name: /Plano de entrega/ })).toBeVisible();
  await expect(busca).toBeFocused();
});
test('carrega além das 40 recentes sem duplicar a lista', async ({ page }) => {
  await page.route('**/api/consultor/conversas?**', (route) => {
    expect(new URL(route.request().url()).searchParams.get('pagina')).toBe('1');
    return route.fulfill({ json: { threads: [antiga], total: 41, mais: false } });
  });
  await page.goto('/preview/consultor?historico=1');
  await page.getByRole('button', { name: /Conversas/ }).click();
  const painel = page.getByRole('region', { name: 'Histórico de conversas' });
  await expect(painel.getByRole('link')).toHaveCount(40);
  await painel.getByRole('button', { name: 'Carregar mais' }).click();
  await expect(painel.getByRole('link')).toHaveCount(41);
  await expect(painel.getByRole('button', { name: 'Carregar mais' })).toHaveCount(0);
});
test('edição por teclado não fecha o histórico nem perde a pergunta', async ({ page }) => {
  await page.goto('/preview/consultor?historico=1');
  await page.getByRole('textbox').fill('Minha pergunta ainda não enviada');
  const abrir = page.getByRole('button', { name: /Conversas/ });
  await abrir.click();
  await page.getByRole('button', { name: 'Renomear Proposta para Clínica Horizonte' }).click();
  const nome = page.getByRole('textbox', { name: 'Nome da conversa' });
  await expect(nome).toBeFocused();
  await nome.fill('Outro nome, ainda sem salvar');
  await nome.press('Escape');
  await expect(page.getByRole('region', { name: 'Histórico de conversas' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Renomear Proposta para Clínica Horizonte' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(abrir).toBeFocused();
  await expect(page.getByRole('textbox')).toHaveValue('Minha pergunta ainda não enviada');
});
test('painel e edição legíveis, acessíveis e dentro da tela', async ({ page }, info) => {
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/preview/consultor?historico=1');
  await page.getByRole('button', { name: /Conversas/ }).click();
  const painel = page.locator('[data-painel-historico]');
  expect(await painel.evaluate((el) => el.parentElement?.tagName)).toBe('BODY');
  if (info.project.name === 'mobile') {
    expect(await painel.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      'rgb(255, 255, 255)',
    );
  }
  const caixa = await painel.boundingBox();
  const view = page.viewportSize()!;
  expect(caixa!.x).toBeGreaterThanOrEqual(0);
  expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(view.height);
  expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(view.width);
  await expect(page.getByRole('button', { name: 'Carregar mais' })).toBeInViewport();
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-painel-historico]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('historico.png') });
  await page.getByRole('button', { name: 'Renomear Proposta para Clínica Horizonte' }).click();
  await page
    .getByRole('textbox', { name: 'Nome da conversa' })
    .fill('Um título de conversa mais longo para conferir o formulário em uma tela pequena');
  await expect(page.getByRole('button', { name: 'Salvar nome' })).toBeInViewport();
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-painel-historico]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('renomear.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    view.width,
  );
});
test('erro de busca tem recuperação no próprio menu', async ({ page }) => {
  let falhar = true;
  await page.route('**/api/consultor/conversas?**', (route) =>
    falhar
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: { threads: [], total: 0, mais: false } }),
  );
  await page.goto('/preview/consultor?historico=1');
  await page.getByRole('button', { name: /Conversas/ }).click();
  await page.getByRole('searchbox').fill('Sem resultado');
  await expect(
    page.getByRole('region', { name: 'Histórico de conversas' }).getByRole('alert'),
  ).toContainText('Não foi possível buscar');
  falhar = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('Nenhuma conversa encontrada.')).toBeVisible();
});
