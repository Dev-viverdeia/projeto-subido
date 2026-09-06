import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('pagamento pendente tem ação clara, sem falso sucesso ou overflow', async ({ page }) => {
  await page.goto('/preview/cobranca?estado=past_due');
  await expect(page.getByText('Pagamento pendente')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Regularizar pagamento' })).toBeVisible();
  await expect(page.getByText('Tudo em dia')).toHaveCount(0);
  const problemas = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze())
    .violations;
  expect(problemas).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('créditos indisponíveis não são apresentados como saldo zero ou extrato vazio', async ({
  page,
}) => {
  await page.goto('/preview/cobranca?tela=creditos&estado=erro');
  await expect(page.getByText('Saldo indisponível no momento.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Tentar novamente/ })).toBeVisible();
  await expect(page.getByText('Nenhuma movimentação por aqui ainda.')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('retorno de compra acompanha confirmação e não depende de recarregar manualmente', async ({
  page,
}) => {
  let confirmado = false;
  await page.route('**/api/billing/checkout?*', (route) =>
    route.fulfill({ json: { estado: confirmado ? 'confirmado' : 'atualizando' } }),
  );
  await page.goto('/preview/cobranca?tela=creditos&checkout=sucesso&session_id=cs_test_segura');
  await expect(page.getByText('Atualizando seus créditos.')).toBeVisible();
  confirmado = true;
  await expect(page.getByText('Créditos adicionados.')).toBeVisible({ timeout: 12_000 });
});

test('URL com sucesso sem uma sessão válida não confirma compra', async ({ page }) => {
  await page.goto('/preview/cobranca?checkout=sucesso');
  await expect(page.getByText('Não foi possível identificar este pagamento.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Falar com suporte' })).toBeVisible();
  await expect(page.getByText('Pagamento recebido.')).toHaveCount(0);
});
