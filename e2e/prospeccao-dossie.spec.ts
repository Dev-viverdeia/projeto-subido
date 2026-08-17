import { expect, test } from '@playwright/test';

test.describe('Dossiê da Prospecção', () => {
  test('abre a empresa como lista qualificada sem estouro horizontal', async ({ page }) => {
    await page.goto('/preview/prospeccao');
    const empresa = page.getByRole('button', { name: /Clínica Aurora/ });

    await empresa.click();
    const dialogo = page.getByRole('dialog', { name: 'Clínica Aurora' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText('Canais encontrados')).toBeVisible();
    await expect(dialogo.getByRole('link', { name: 'contato@clinicaaurora.com.br' })).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Enviar para o CRM' })).toBeVisible();

    const decisores = dialogo.getByText('Possíveis decisores');
    await decisores.scrollIntoViewIfNeeded();
    await expect(decisores).toBeVisible();
    await expect(dialogo.getByText('Ana Aurora')).toBeVisible();

    const estourou = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(estourou).toBe(false);

    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();
    await expect(empresa).toBeFocused();
  });
});
