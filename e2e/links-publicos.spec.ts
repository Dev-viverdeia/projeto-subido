import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('links do cliente', () => {
  for (const [rota, titulo] of [
    ['proposta', 'Proposta indisponível'],
    ['portal', 'Link do projeto indisponível'],
    ['sala', 'Convite indisponível'],
  ]) {
    test(`${rota}: acesso inválido é claro, legível e sem formulário de login`, async ({
      page,
    }) => {
      const erros: string[] = [];
      page.on('pageerror', (erro) => erros.push(erro.message));
      const resposta = await page.goto(`/${rota}/indisponivel`);
      expect(resposta?.headers()['referrer-policy']).toBe('no-referrer');
      expect(resposta?.headers()['x-robots-tag']).toContain('noindex');
      await expect(page.getByRole('heading', { name: titulo })).toBeVisible();
      await expect(
        page.getByText('Peça um novo link à pessoa que enviou o convite.'),
      ).toBeVisible();
      await expect(page.getByRole('textbox')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const auditoria = await new AxeBuilder({ page }).analyze();
      expect(
        auditoria.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
      ).toEqual([]);
      expect(erros).toEqual([]);
    });
  }
  test('desativar link pede confirmação em modal ancorado à tela', async ({ page }) => {
    await page.goto('/preview/proposta-editor');
    await page.getByText('Gerenciar acesso', { exact: true }).click();
    const abrir = page.getByRole('button', { name: 'Desativar link', exact: true });
    await abrir.click();
    const modal = page.getByRole('dialog');
    await expect(
      modal.getByRole('heading', { name: 'Desativar acesso do cliente?' }),
    ).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Desativar link' })).toBeInViewport();
    await expect(modal.getByRole('button', { name: 'Cancelar', exact: true })).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(abrir).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
});
