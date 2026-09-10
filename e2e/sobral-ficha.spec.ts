import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('ficha consultada discreta, legível, com teclado e destino certo', async ({ page }, info) => {
  await page.route('**/api/consultor/**', (r) => r.fulfill({ status: 401, json: {} }));
  await page.route('**/*.supabase.co/**', (r) => r.abort());
  await page.goto('/preview/consultor-conversa?leitura=ficha');
  const resumo = page.locator('summary').filter({ hasText: 'Ficha consultada' });
  await expect(resumo).toHaveCount(1);
  const ficha = resumo.locator('..');
  await expect(ficha).not.toHaveAttribute('open');
  const campo = page.getByRole('textbox');
  await campo.fill('Minha próxima pergunta');
  await resumo.focus();
  await resumo.press('Enter');
  await expect(ficha).toHaveAttribute('open');
  await expect(ficha.getByRole('link', { name: 'Conferir ficha' })).toHaveAttribute(
    'href',
    '/vendas/11111111-1111-4111-8111-111111111111',
  );
  await expect(ficha.getByText('Pesquisa', { exact: true })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-leitura-conversa]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(await ficha.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await resumo.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(
    44,
  );
  await page.screenshot({ path: info.outputPath('ficha-consultada.png') });
  await resumo.press('Space');
  await expect(ficha).not.toHaveAttribute('open');
  await expect(campo).toHaveValue('Minha próxima pergunta');
});
