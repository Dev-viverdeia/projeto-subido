import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Empresa na ficha', () => {
  test('edita sem cobrar ou pesquisar, mantém foco e aceita remover o site', async ({ page }) => {
    await page.goto('/preview/crm-dossie?empresa=1');
    const abrir = page.getByRole('button', { name: 'Editar empresa' });
    await abrir.click();
    const modal = page.getByRole('dialog', { name: 'Empresa', exact: true });
    await expect(modal.getByLabel('Nome da empresa', { exact: true })).toBeFocused();
    expect(
      (
        await new AxeBuilder({ page })
          .include('[role="dialog"]')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await modal
        .getByLabel('Nome da empresa')
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await modal.getByLabel('Nome da empresa').fill('Clínica Horizonte');
    await modal
      .getByLabel('Site (opcional)')
      .fill('https://www.horizonte.com.br/contato?ref=apresentacao');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(modal).toBeVisible();
    await expect(modal).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Clínica Horizonte');
    await expect(page.getByRole('link', { name: 'horizonte.com.br', exact: true })).toHaveAttribute(
      'href',
      'https://horizonte.com.br/',
    );
    await expect(abrir).toBeFocused();
    await abrir.click();
    await expect(modal.getByLabel('Nome da empresa')).toHaveValue('Clínica Horizonte');
    await modal.getByLabel('Site (opcional)').clear();
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal).toBeHidden();
    await expect(page.getByRole('link', { name: 'horizonte.com.br', exact: true })).toHaveCount(0);
    await abrir.click();
    await modal.getByLabel('Nome da empresa').fill('Não salvar');
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await abrir.click();
    await expect(modal.getByLabel('Nome da empresa')).toHaveValue('Clínica Horizonte');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    // A abertura usa scale: medir depois que a área de toque assentou, não no frame inicial.
    await expect
      .poll(
        async () =>
          (await modal.getByRole('button', { name: 'Salvar alterações' }).boundingBox())?.height ??
          0,
      )
      .toBeGreaterThanOrEqual(44);
    const salvar = await modal.getByRole('button', { name: 'Salvar alterações' }).boundingBox();
    expect(salvar!.y + salvar!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  });
  test('erro preserva campos, conflito não sobrescreve', async ({ page }) => {
    await page.goto('/preview/crm-dossie?empresa=erro');
    await page.getByRole('button', { name: 'Editar empresa' }).click();
    const modal = page.getByRole('dialog', { name: 'Empresa', exact: true });
    await modal.getByLabel('Site (opcional)').fill('127.0.0.1');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal.getByLabel('Site (opcional)')).toBeFocused();
    await expect(modal.getByText('Digite um site público, como empresa.com.br.')).toBeVisible();
    await modal.getByLabel('Site (opcional)').fill('novo.com.br');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal.getByRole('alert')).toContainText('Não foi possível salvar');
    await expect(modal.getByLabel('Site (opcional)')).toHaveValue('novo.com.br');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal).toBeHidden();
    await page.goto('/preview/crm-dossie?empresa=conflito');
    await page.getByRole('button', { name: 'Editar empresa' }).click();
    await modal.getByLabel('Nome da empresa').fill('Nome corrigido');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal.getByRole('alert')).toContainText('mudou em outra edição');
    await expect(modal.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
    await expect(modal.getByLabel('Nome da empresa')).toHaveValue('Nome corrigido');
  });
});
