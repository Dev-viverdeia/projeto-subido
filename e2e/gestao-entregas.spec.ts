import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('gestão simples das entregas', () => {
  test('concluir exige ciência das pendências em um modal na viewport', async ({ page }) => {
    await page.goto('/preview/sala-entrega?estado=execucao');
    await page.getByRole('button', { name: 'Concluir entrega', exact: true }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByRole('heading', { name: 'Concluir esta entrega?' })).toBeVisible();
    await expect(dialogo.getByRole('checkbox')).not.toBeChecked();
    await expect(dialogo.getByRole('checkbox')).toHaveAttribute('required');
    await expect(dialogo.getByText(/aceite do cliente continua separado/)).toBeVisible();
    const caixa = await dialogo.boundingBox();
    const viewport = page.viewportSize()!;
    expect(caixa!.x).toBeGreaterThanOrEqual(0);
    expect(caixa!.y).toBeGreaterThanOrEqual(0);
    expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(viewport.height + 1);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
      [],
    );
    await page.keyboard.press('Escape');
    await expect(dialogo).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Concluir entrega', exact: true })).toBeFocused();
  });
  test('recorrente entregue abre nas próximas ações, não em um formulário de aceite', async ({
    page,
  }) => {
    await page.goto('/preview/sala-entrega?estado=recorrente');
    await expect(page.getByRole('heading', { name: 'Próximas ações', exact: true })).toBeVisible();
    await expect(page.getByText('Em acompanhamento', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Agendar ação', exact: true }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByLabel('O que você vai fazer?')).toBeVisible();
    await expect(dialogo.getByLabel('Quando')).toBeVisible();
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
      [],
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Agendar ação', exact: true })).toBeFocused();
    const largura = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(largura.scroll).toBeLessThanOrEqual(largura.viewport);
  });
  test('pontual concluído não bloqueia os arquivos atrás do aceite formal', async ({ page }) => {
    await page.goto('/preview/sala-entrega?estado=pontual-concluido');
    await expect(page.getByText('Concluído', { exact: true })).toBeVisible();
    await expect(page.getByText('A revisão aparece depois do aceite final.')).toHaveCount(0);
    await page.getByRole('button', { name: 'Gerenciar', exact: true }).click();
    await expect(page.getByRole('radio', { name: /Pontual/ })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Reabrir execução', exact: true })).toBeVisible();
  });
  test('painel separa recorrentes das entregas concluídas', async ({ page }) => {
    await page.goto('/preview/entregas');
    await expect(
      page.getByRole('heading', { name: 'Em acompanhamento', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Acompanhar Almeida Contabilidade' }),
    ).toBeVisible();
    const largura = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(largura.scroll).toBeLessThanOrEqual(largura.viewport);
  });
});
