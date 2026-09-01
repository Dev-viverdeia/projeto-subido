import { expect, test } from '@playwright/test';

test.describe('Estação de Prospecção', () => {
  test('abre os canais e mantém o envio a Vendas como uma ação explícita', async ({
    page,
  }, testInfo) => {
    await page.goto('/preview/prospeccao');
    const empresa = page.getByRole('button', { name: 'Ver detalhes' }).first();

    await empresa.click();
    const dialogo = page.getByRole('dialog', { name: 'Clínica Aurora' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText('Canais para começar a abordagem')).toBeVisible();
    await expect(dialogo.getByRole('link', { name: 'WhatsApp' }).first()).toBeVisible();
    await expect(dialogo.getByRole('link', { name: 'Escrever' })).toBeVisible();
    await expect(dialogo.getByText('@clinicaaurora', { exact: true }).first()).toBeVisible();
    await expect(dialogo.getByText('Quer trabalhar esta empresa?')).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Criar oportunidade' })).toBeVisible();

    const decisores = dialogo.getByText('Possíveis decisores');
    await decisores.scrollIntoViewIfNeeded();
    await expect(decisores).toBeVisible();
    await expect(dialogo.getByText('Ana Aurora')).toBeVisible();

    const estourou = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(estourou).toBe(false);

    if (testInfo.project.name === 'desktop') {
      const rolagemNoModal = await dialogo.evaluate((elemento) =>
        [elemento, ...elemento.querySelectorAll<HTMLElement>('*')].some((item) => {
          const overflow = getComputedStyle(item).overflowY;
          return (
            (overflow === 'auto' || overflow === 'scroll') &&
            item.scrollHeight > item.clientHeight + 2
          );
        }),
      );
      expect(rolagemNoModal).toBe(false);
    }

    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();
    await expect(empresa).toBeFocused();
  });
});
