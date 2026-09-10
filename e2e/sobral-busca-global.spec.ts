import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const mensagens = Array.from({ length: 25 }, (_, i) => ({
  id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`,
  conversa: i % 2 ? '44444444-4444-4444-8444-444444444444' : '11111111-1111-4111-8111-111111111111',
  titulo: i % 2 ? 'Reunião com o cliente' : 'Plano de atendimento',
  papel: i % 2 ? 'usuario' : 'consultor',
  trecho:
    i === 0
      ? 'A primeira entrega tem escopo de 20%_ para testar.'
      : `Escopo do projeto ${i}, pronto para validar.`,
  criadoEm: '2026-09-10T12:00:00Z',
}));
test.beforeEach(async ({ page }) => {
  await page.route('**/*.supabase.co/**', (route) => route.abort());
  await page.route('**/api/consultor/**', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/consultor/historico/busca?**', (route) => {
    const p = new URL(route.request().url()).searchParams;
    const filtradas = mensagens.filter((m) =>
      m.trecho.toLowerCase().includes((p.get('busca') ?? '').toLowerCase()),
    );
    const pagina = Number(p.get('pagina') ?? 0);
    return route.fulfill({
      json: {
        mensagens: filtradas.slice(pagina * 20, (pagina + 1) * 20),
        mais: (pagina + 1) * 20 < filtradas.length,
      },
    });
  });
});
test('busca só quando solicitada, pagina ambas as vozes e preserva pergunta e arquivo', async ({
  page,
}, info) => {
  const pedidos: string[] = [];
  page.on('request', (r) => pedidos.push(r.url()));
  await page.goto('/preview/consultor-conversa?arquivos=1');
  await page.getByRole('textbox').fill('Ainda estou preparando a pergunta.');
  await page.locator('input[type=file]').setInputFiles({
    name: 'contexto.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Não enviar'),
  });
  await page.getByRole('button', { name: /Conversas/ }).click();
  await page.getByRole('tab', { name: 'Buscar', exact: true }).click();
  const painel = page.getByRole('region', { name: 'Busca em todas as conversas' });
  expect(pedidos.some((p) => p.includes('/historico/busca'))).toBe(false);
  await painel.getByRole('searchbox').fill('a');
  await expect(painel.getByRole('status')).toHaveText('Digite pelo menos 2 caracteres.');
  expect(pedidos.some((p) => p.includes('/historico/busca'))).toBe(false);
  await painel.getByRole('searchbox').fill('escopo');
  await expect(painel.getByRole('listitem')).toHaveCount(20);
  await expect(painel.getByText('Você', { exact: true }).first()).toBeVisible();
  await expect(painel.getByText('Sobral AI', { exact: true }).first()).toBeVisible();
  await painel.getByRole('button', { name: 'Carregar mais' }).click();
  await expect(painel.getByRole('listitem')).toHaveCount(25);
  await painel.getByRole('searchbox').fill('20%_');
  await expect(painel.getByRole('listitem')).toHaveCount(1);
  await expect(painel.locator('mark')).toHaveText('20%_');
  const link = painel.getByRole('link');
  await expect(link).toHaveAttribute(
    'href',
    `/consultor/${mensagens[0]!.conversa}?mensagem=${mensagens[0]!.id}`,
  );
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAccessibleDescription(mensagens[0]!.trecho);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-painel-historico]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('busca-global.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Conversas/ })).toBeFocused();
  await expect(page.getByRole('textbox')).toHaveValue('Ainda estou preparando a pergunta.');
  await expect(page.getByText('contexto.txt', { exact: true })).toBeVisible();
  expect(pedidos.some((p) => /\/api\/consultor\/(responder|gerar)/.test(p))).toBe(false);
});
test('erro, retry, vazio e troca de conta têm estados distintos', async ({ page }) => {
  let status = 503;
  await page.route('**/api/consultor/historico/busca?**', (r) =>
    r.fulfill({ status, json: status === 200 ? { mensagens: [], mais: false } : {} }),
  );
  await page.goto('/preview/consultor');
  await page.getByRole('button', { name: /Conversas/ }).click();
  await page.getByRole('tab', { name: 'Buscar', exact: true }).click();
  const painel = page.getByRole('region', { name: 'Busca em todas as conversas' });
  await painel.getByRole('searchbox').fill('escopo');
  await expect(painel.getByRole('alert')).toContainText('Não foi possível buscar');
  status = 200;
  await painel.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(painel.getByText('Nenhuma mensagem encontrada.')).toBeVisible();
  status = 401;
  await painel.getByRole('searchbox').fill('outra');
  await expect(painel.getByRole('alert')).toHaveText('Entre novamente na mesma conta.');
  await painel.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(painel.getByRole('searchbox')).toBeFocused();
  await expect(painel.getByText('Encontre uma conversa pelo conteúdo.')).toBeVisible();
});
test('teclado, 320px, zoom 200% e movimento reduzido sem corte lateral', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/consultor?historico=1');
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 700 });
  else
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
  await page.getByRole('button', { name: /Conversas/ }).click();
  await page.getByRole('tab', { name: 'Recentes' }).focus();
  await page.keyboard.press('ArrowRight');
  const buscar = page.getByRole('tab', { name: 'Buscar', exact: true });
  await expect(buscar).toBeFocused();
  await expect(buscar).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByRole('searchbox').fill('20%_');
  await expect(page.getByRole('tabpanel').getByRole('listitem')).toHaveCount(1);
  const painel = page.locator('[data-painel-historico]');
  expect(await painel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const rect = await painel.boundingBox();
  expect(rect!.x).toBeGreaterThanOrEqual(0);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  await expect(buscar).toBeInViewport();
  await page.screenshot({ path: info.outputPath('busca-acessivel.png') });
});
test('ignora busca anterior tardia e não restaura consulta após fechar', async ({ page }) => {
  await page.route('**/api/consultor/historico/busca?**', async (route) => {
    const lento = new URL(route.request().url()).searchParams.get('busca') === 'lento';
    if (lento) await new Promise((r) => setTimeout(r, 750));
    await route
      .fulfill({ json: { mensagens: lento ? [] : [mensagens[0]], mais: false } })
      .catch(() => {});
  });
  await page.goto('/preview/consultor');
  await page.getByRole('button', { name: /Conversas/ }).click();
  await page.getByRole('tab', { name: 'Buscar', exact: true }).click();
  await page.getByRole('searchbox').fill('lento');
  await page.waitForRequest((r) => r.url().includes('busca=lento'));
  await page.getByRole('searchbox').fill('rápido');
  await expect(page.getByRole('tabpanel').getByRole('listitem')).toHaveCount(1);
  await page.waitForTimeout(800);
  await expect(page.getByRole('tabpanel').getByRole('listitem')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Conversas/ }).click();
  await expect(page.getByRole('tab', { name: 'Recentes' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('tab', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
});
