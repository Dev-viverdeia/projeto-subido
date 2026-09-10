import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('material: revisão compacta, edição preservada e confirmação explícita', async ({ page }) => {
  await page.goto('/preview/consultor-conversa?material=1');
  await page.getByRole('button', { name: 'Revisar resumo' }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(page.getByLabel('Ficha do cliente')).toHaveValue(
    '11111111-1111-4111-8111-111111111111',
  );
  await expect(page.getByRole('button', { name: 'Salvar na ficha' })).toBeDisabled();
  await expect(page.getByLabel('Escopo', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Decisões', { exact: true })).not.toBeVisible();
  await page.getByLabel('Escopo', { exact: true }).fill('Piloto de triagem com revisão humana.');
  await page.getByRole('button', { name: 'Voltar à conversa' }).click();
  await page.getByRole('button', { name: 'Revisar resumo' }).click();
  await expect(page.getByLabel('Escopo', { exact: true })).toHaveValue(
    'Piloto de triagem com revisão humana.',
  );
  await modal
    .locator('summary')
    .filter({ hasText: /^Decisões/ })
    .click();
  await expect(page.getByLabel('Decisões', { exact: true })).toBeVisible();
  await page.getByRole('checkbox').check();
  await expect(page.getByRole('button', { name: 'Salvar na ficha' })).toBeEnabled();
  await page.getByLabel('Título do registro').fill('Escopo aprovado para revisão');
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await page.getByRole('checkbox').check();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Salvar na ficha' }).click();
  await expect(page.getByText('Resumo registrado.')).toBeVisible();
  await expect(modal.getByRole('link', { name: 'Ver na ficha' })).toHaveAttribute(
    'href',
    /\?resumo=.+#resumo-material/,
  );
  await page.getByRole('button', { name: 'Fechar', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Revisar resumo' })).toHaveCount(0);
});

test('material: modal fica dentro da viewport, teclado e Escape funcionam', async ({ page }) => {
  await page.goto('/preview/consultor-conversa?material=1');
  const gatilho = page.getByRole('button', { name: 'Revisar resumo' });
  await gatilho.click();
  const dialog = page.getByRole('dialog');
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await page.keyboard.press('Tab');
  expect(
    await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(gatilho).toBeFocused();
});
