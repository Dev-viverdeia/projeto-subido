import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('convidado entra por uma tela clara e só avança com consentimento', async ({ page }, info) => {
  await page.goto('/preview/sala-call?convidado=1');
  const nome = page.getByLabel('Seu nome');
  const entrar = page.getByRole('button', { name: 'Entrar na reunião' });
  await expect(entrar).toBeDisabled();
  await nome.fill('Cliente de teste');
  await page.getByRole('checkbox').check();
  await expect(entrar).toBeEnabled();
  await expect(entrar).toBeInViewport();
  await expect(page.getByText('Durante a reunião')).toHaveCount(0);
  expect(
    await nome.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('entrada-cliente.png'), fullPage: true });
});

test('coach mantém falha e orientação acessíveis no celular', async ({ page }, info) => {
  await page.goto('/preview/live-coach?falha=1');
  const painel = page.getByRole('complementary', { name: 'Live Coach privado' });
  const alerta = painel.getByRole('alert');
  await expect(alerta).toBeVisible();
  await expect(alerta).toContainText('Sua internet caiu');
  await painel.getByText('Gravação indisponível', { exact: true }).scrollIntoViewIfNeeded();
  await expect(painel.getByText('Gravação indisponível', { exact: true })).toBeInViewport();
  await alerta.scrollIntoViewIfNeeded();
  await expect(alerta).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('coach-falha.png') });
});

test('sala encerrada não pede novamente nome e consentimento', async ({ page }) => {
  await page.goto('/preview/sala-call?convidado=1&estado=concluida');
  await expect(page.getByRole('heading', { name: 'Reunião encerrada' })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});
