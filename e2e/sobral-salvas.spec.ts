import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const respostas = Array.from({ length: 25 }, (_, i) => ({
  id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`,
  conversa: '44444444-4444-4444-8444-444444444444',
  titulo: i === 0 ? 'Plano de atendimento' : `Projeto ${i}`,
  trecho:
    i === 0
      ? 'Comece pelo escopo de 20%_ para a primeira entrega.'
      : `Orientação guardada para o projeto ${i}.`,
  salvaEm: '2026-09-10T12:00:00Z',
}));
test.beforeEach(async ({ page }) => {
  await page.route('**/*.supabase.co/**', (route) => route.abort());
  await page.route('**/api/consultor/**', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/consultor/salvas?**', (route) => {
    const p = new URL(route.request().url()).searchParams;
    const filtradas = respostas.filter((r) =>
      r.trecho.toLowerCase().includes((p.get('busca') ?? '').toLowerCase()),
    );
    const pagina = Number(p.get('pagina') ?? 0);
    return route.fulfill({
      json: {
        respostas: filtradas.slice(pagina * 20, (pagina + 1) * 20),
        total: filtradas.length,
        mais: (pagina + 1) * 20 < filtradas.length,
      },
    });
  });
});
test('salvas sob demanda, busca e paginação, sem tirar espaço nem perder o rascunho', async ({
  page,
}, info) => {
  const pedidos: string[] = [];
  page.on('request', (r) => pedidos.push(r.url()));
  await page.goto('/preview/consultor-conversa?arquivos=1');
  await expect(page.getByRole('button', { name: 'Salvar resposta', exact: true })).toHaveCount(1);
  await expect(
    page.locator('[data-texto-usuario]').getByRole('button', { name: 'Salvar resposta' }),
  ).toHaveCount(0);
  await page.getByRole('textbox').fill('Continuar esta pergunta depois.');
  await page.locator('input[type=file]').setInputFiles({
    name: 'contexto.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Rascunho, não enviar'),
  });
  await page.getByRole('button', { name: /Conversas/ }).click();
  expect(pedidos.some((p) => p.includes('/api/consultor/salvas'))).toBe(false);
  await page.getByRole('tab', { name: 'Salvas' }).click();
  const painel = page.getByRole('region', { name: 'Respostas salvas', exact: true });
  await expect(painel.getByRole('listitem')).toHaveCount(20);
  await painel.getByRole('button', { name: 'Carregar mais' }).click();
  await expect(painel.getByRole('listitem')).toHaveCount(25);
  await painel.getByRole('searchbox').fill('20%_');
  await expect(painel.getByRole('listitem')).toHaveCount(1);
  const link = painel.getByRole('link', {
    name: 'Abrir resposta de Plano de atendimento em nova aba',
  });
  await expect(link).toHaveAttribute(
    'href',
    `/consultor/${respostas[0]!.conversa}?mensagem=${respostas[0]!.id}`,
  );
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAccessibleDescription(respostas[0]!.trecho);
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-painel-historico]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('respostas-salvas.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Conversas/ })).toBeFocused();
  await expect(page.getByRole('textbox')).toHaveValue('Continuar esta pergunta depois.');
  await expect(page.getByText('contexto.txt', { exact: true })).toBeVisible();
  expect(pedidos.some((p) => /\/api\/consultor\/(responder|gerar)/.test(p))).toBe(false);
});
test('vazia, falha, retry e sessão alterada não mostram uma falsa lista vazia', async ({
  page,
}) => {
  let estado = 503;
  await page.route('**/api/consultor/salvas?**', (r) =>
    r.fulfill({
      status: estado,
      json: estado === 200 ? { respostas: [], total: 0, mais: false } : {},
    }),
  );
  await page.goto('/preview/consultor');
  await page.getByRole('button', { name: /Conversas/ }).click();
  await page.getByRole('tab', { name: 'Salvas' }).click();
  const painel = page.getByRole('region', { name: 'Respostas salvas', exact: true });
  await expect(painel.getByRole('alert')).toContainText('Não foi possível carregar');
  estado = 200;
  await painel.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(painel.getByText('Guarde o que vale retomar.')).toBeVisible();
  await painel.getByRole('searchbox').fill('vazio');
  await expect(painel.getByText('Nenhuma resposta encontrada.')).toBeVisible();
  estado = 401;
  await painel.getByRole('searchbox').fill('sessão');
  await expect(painel.getByRole('alert')).toHaveText('Entre novamente na mesma conta.');
});
test('abas por teclado, respostas tardias ignoradas e painel cabe em telas pequenas', async ({
  page,
}, info) => {
  await page.goto('/preview/consultor?historico=1');
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('button', { name: /Conversas/ }).click();
  await page.getByRole('tab', { name: 'Recentes' }).focus();
  await page.keyboard.press('ArrowRight');
  const salvas = page.getByRole('tab', { name: 'Salvas' });
  await expect(salvas).toBeFocused();
  await expect(salvas).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Recentes' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(salvas).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(page.getByRole('tabpanel').getByRole('listitem')).toHaveCount(20);
  const painel = page.locator('[data-painel-historico]');
  const rect = await painel.boundingBox();
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(await painel.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await expect(page.getByRole('button', { name: 'Carregar mais' })).toBeInViewport();
  await page.route('**/api/consultor/salvas?**', async (route) => {
    const lento = new URL(route.request().url()).searchParams.get('busca') === 'lento';
    if (lento) await new Promise((r) => setTimeout(r, 750));
    await route
      .fulfill({
        json: { respostas: lento ? [] : [respostas[0]], total: lento ? 0 : 1, mais: false },
      })
      .catch(() => {});
  });
  await page.getByRole('searchbox').fill('lento');
  await page.waitForRequest((r) => r.url().includes('busca=lento'));
  await page.getByRole('searchbox').fill('rápido');
  await expect(page.getByRole('tabpanel').getByRole('listitem')).toHaveCount(1);
  await page.waitForTimeout(800);
  await expect(page.getByRole('tabpanel').getByRole('listitem')).toHaveCount(1);
});
