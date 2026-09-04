import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('proposta com contexto do cliente', () => {
  test('abre o resumo sob demanda e mantém a ação sem rolagem lateral', async ({ page }) => {
    await page.goto('/preview/proposta-nova');
    await expect(page.getByRole('heading', { name: 'Clínica Aurora' })).toBeVisible();
    await expect(page.getByText(/A recepção confirmou perda de contexto/)).toBeHidden();
    await page.getByText('Dados da reunião incluídos').click();
    await expect(page.getByText(/A recepção confirmou perda de contexto/)).toBeVisible();
    await page.getByText('Dados da reunião incluídos').click();
    await page.getByRole('combobox', { name: /Projeto-base/ }).selectOption('sem-base');
    const criar = page.getByRole('button', { name: 'Criar rascunho' });
    await expect(criar).toBeEnabled();
    await criar.scrollIntoViewIfNeeded();
    await expect(criar).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const auditoria = await new AxeBuilder({ page }).analyze();
    expect(
      auditoria.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
  });

  test('trocar cliente limpa os dados anteriores, sem misturar reuniões', async ({ page }) => {
    await page.goto('/preview/proposta-nova');
    await page.getByRole('combobox', { name: /Projeto-base/ }).selectOption('sem-base');
    await page.getByRole('button', { name: 'Trocar cliente' }).click();
    await page
      .getByRole('combobox', { name: /Cliente em negociação/ })
      .selectOption('22222222-2222-4222-8222-222222222222');
    await expect(page.locator('input[name="reuniao"]')).toHaveValue('');
    await expect(page.getByText('Dados da reunião incluídos')).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: /Projeto-base/ })).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Criar rascunho' })).toBeDisabled();
  });

  test('na biblioteca, cliente e projeto ficam na mesma tela', async ({ page }) => {
    await page.goto('/preview/proposta-nova?estado=lista');
    await expect(page.getByRole('combobox', { name: /Projeto-base/ })).toBeDisabled();
    await page
      .getByRole('combobox', { name: /Cliente em negociação/ })
      .selectOption('22222222-2222-4222-8222-222222222222');
    await page.getByRole('combobox', { name: /Projeto-base/ }).selectOption('sem-base');
    await expect(page.getByRole('button', { name: 'Criar rascunho' })).toBeEnabled();
  });

  test('a falha mantém escolhas e o vazio leva à descoberta', async ({ page }) => {
    await page.goto('/preview/proposta-nova?estado=erro');
    await expect(
      page.getByRole('alert').filter({ hasText: 'Suas escolhas foram mantidas' }),
    ).toBeVisible();
    await expect(page.getByRole('combobox', { name: /Projeto-base/ })).toHaveValue('sem-base');
    await expect(page.getByRole('button', { name: 'Criar rascunho' })).toBeEnabled();
    await page.goto('/preview/proposta-nova?estado=vazio');
    await expect(page.getByRole('heading', { name: 'Comece pela descoberta' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Ver reuniões/ })).toHaveAttribute(
      'href',
      '/reunioes',
    );
    await expect(page.getByRole('button', { name: 'Criar rascunho' })).toHaveCount(0);
  });
});
