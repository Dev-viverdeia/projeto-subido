import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('falha de conexão preserva a revisão da reunião para tentar novamente', async ({ page }) => {
  await page.goto('/preview/pos-call');
  const acao = page.getByLabel('Próxima ação da venda');
  await acao.fill('Apresentar o fluxo aprovado na quinta-feira.');
  await page.getByLabel('Data combinada').fill('2026-12-10');
  await page.getByLabel('Próxima etapa da venda').selectOption('manter');
  const compromissos = page.getByRole('checkbox');
  await compromissos.first().uncheck();
  await page.route('**/preview/pos-call', async (route) => {
    if (route.request().method() === 'POST') await route.abort('failed');
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Confirmar e atualizar a venda' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Salvamento não confirmado' }),
  ).toContainText('Sua revisão continua aqui');
  await expect(acao).toHaveValue('Apresentar o fluxo aprovado na quinta-feira.');
  await expect(page.getByLabel('Data combinada')).toHaveValue('2026-12-10');
  await expect(page.getByLabel('Próxima etapa da venda')).toHaveValue('manter');
  await expect(compromissos.first()).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Confirmar e atualizar a venda' })).toBeEnabled();
  expect(new URL(page.url()).search).toBe('');
});

test('proposta aceita mostra a entrega antes do editor, inclusive no celular', async ({
  page,
}, testInfo) => {
  await page.goto('/preview/proposta-editor?estado=aceita');
  const continuidade = page.getByRole('region', { name: 'Próximo passo da proposta aceita' });
  const abrir = continuidade.getByRole('link', { name: /Abrir entrega/ });
  await expect(abrir).toBeInViewport();
  await expect(abrir).toHaveAttribute('href', '/entregas/55555555-5555-4555-8555-555555555555');
  await expect(page.getByRole('link', { name: /Abrir entrega/ })).toHaveCount(1);
  const superficie = await continuidade.boundingBox();
  const editor = await page.getByLabel('Título interno da proposta').boundingBox();
  expect(superficie!.y).toBeLessThan(editor!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('proposta-aceita.png') });
});

test('recuperar a entrega mantém o erro visível na superfície clara', async ({ page }) => {
  await page.goto('/preview/proposta-editor?estado=recuperar');
  const continuidade = page.getByRole('region', { name: 'Próximo passo da proposta aceita' });
  await expect(continuidade.getByRole('button', { name: 'Preparar entrega' })).toBeInViewport();
  await continuidade.getByRole('button', { name: 'Preparar entrega' }).click();
  await expect(continuidade.getByRole('alert')).toContainText('Sua sessão expirou');
  const auditoria = await new AxeBuilder({ page })
    .include('[aria-label="Próximo passo da proposta aceita"]')
    .analyze();
  expect(
    auditoria.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')),
  ).toEqual([]);
});
