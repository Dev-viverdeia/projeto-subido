import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('proposta aprovada até a primeira tarefa', () => {
  test('abre uma preparação curta, acessível e sem vazamento horizontal', async ({ page }) => {
    await page.goto('/preview/sala-entrega?estado=inicio');

    await expect(page.getByRole('heading', { name: 'Prepare o projeto' })).toBeVisible();
    await expect(page.getByText('Proposta V03 aceita')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Completar acordo' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Fases da entrega' })).toHaveCount(0);

    const largura = await page.evaluate(() => ({
      documento: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(largura.documento).toBeLessThanOrEqual(largura.viewport);

    const resultado = await new AxeBuilder({ page }).analyze();
    const graves = resultado.violations.filter(
      (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
    );
    expect(graves).toEqual([]);
  });
});
