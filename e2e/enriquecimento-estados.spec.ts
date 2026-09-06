import { expect, test } from '@playwright/test';

test('progresso permite sair pelo teclado e reabrir sem perder a ficha', async ({ page }, info) => {
  await page.goto('/preview/crm-dossie?enriquecimento=processando');
  const dialogo = page.getByRole('dialog', { name: 'Atualizando a ficha do cliente' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.locator('[data-estado="concluida"]')).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(dialogo.getByRole('button', { name: 'Continuar usando a ficha' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();
  await page.getByRole('button', { name: 'Ver andamento' }).click();
  await expect(dialogo).toBeVisible();
  await expect
    .poll(async () => {
      const caixa = await dialogo.boundingBox();
      return caixa!.y + caixa!.height;
    })
    .toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  const caixa = await dialogo.boundingBox();
  expect(caixa!.x).toBeGreaterThanOrEqual(0);
  expect(caixa!.y).toBeGreaterThanOrEqual(0);
  expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await page.screenshot({ path: info.outputPath('enriquecimento-progresso.png') });
});

test('falha aparece no modal e continua visível na ficha após fechar', async ({ page }, info) => {
  await page.goto('/preview/crm-dossie?enriquecimento=falhou');
  const dialogo = page.getByRole('dialog', { name: 'A ficha não foi atualizada.' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText(/3 créditos foram devolvidos/)).toBeVisible();
  await page.screenshot({ path: info.outputPath('enriquecimento-falha.png') });
  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();
  await expect(
    page.getByRole('alert', { name: 'Não foi possível atualizar a ficha.' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
