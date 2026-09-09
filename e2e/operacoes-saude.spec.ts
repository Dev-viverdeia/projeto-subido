import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('estado legível, diagnóstico recolhido e acesso por teclado', async ({ page }) => {
  await page.goto('/preview/operacoes');
  await expect(page.getByRole('heading', { name: 'Saúde do sistema' })).toBeVisible();
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
  const sumario = page.locator('summary').filter({ hasText: 'Ver diagnóstico' });
  await expect(sumario.locator('..')).not.toHaveAttribute('open');
  await sumario.focus();
  await page.keyboard.press('Enter');
  await expect(sumario.locator('..')).toHaveAttribute('open', '');
  await expect(page.getByText('Paradas solicitadas pelo usuário', { exact: false })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('saude.png'), fullPage: true });
});
test('falhas e ausência de confirmação nunca aparecem como sucesso', async ({ page }) => {
  await page.goto('/preview/operacoes?estado=falha');
  await expect(page.getByText('2 sem conclusão após o prazo.')).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Verificações automáticas' }).click();
  await expect(
    page.getByText('3 falha(s) seguida(s). Confira os logs desta rotina.'),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.goto('/preview/operacoes?estado=indisponivel');
  await expect(page.getByRole('status')).toContainText('status ainda não foi confirmado');
  await expect(page.getByText('Sem alertas', { exact: true })).toHaveCount(0);
  await expect(page.getByText('0', { exact: true })).toHaveCount(0);
});
test('mobile, tablet, desktop e ampliação sem corte de conteúdo', async ({ page }) => {
  for (const width of [375, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/preview/operacoes?estado=sem-pulso');
    await page.locator('summary').filter({ hasText: 'Ver entregas' }).click();
    await page.locator('summary').filter({ hasText: 'Verificações automáticas' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByText('Aguardando a primeira confirmação.', { exact: true })).toHaveCount(
      3,
    );
  }
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
