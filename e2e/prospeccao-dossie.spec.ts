import { expect, test } from '@playwright/test';

test.describe('Estação de Prospecção', () => {
  test('abre canais qualificados sem levar um contato frio direto ao CRM', async ({ page }) => {
    await page.goto('/preview/prospeccao');
    const empresa = page.getByRole('button', { name: /Clínica Aurora/ });

    await empresa.click();
    const dialogo = page.getByRole('dialog', { name: 'Clínica Aurora' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText('Como entrar em contato')).toBeVisible();
    await expect(dialogo.getByRole('link', { name: /Abrir WhatsApp/ }).first()).toBeVisible();
    await expect(dialogo.getByRole('link', { name: /Escrever e-mail/ })).toBeVisible();
    await expect(dialogo.getByText('@clinicaaurora', { exact: true }).first()).toBeVisible();
    await expect(dialogo.getByText('Andamento', { exact: true })).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Alguém respondeu' })).toBeDisabled();
    await expect(dialogo.getByRole('button', { name: 'Criar oportunidade no CRM' })).toHaveCount(0);

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
