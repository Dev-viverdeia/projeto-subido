import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Editar venda na ficha', () => {
  test('salva título e centavos, preserva foco e permite valor indefinido', async ({ page }) => {
    const erros: string[] = [];
    page.on('console', (mensagem) => {
      if (mensagem.type() === 'error') erros.push(mensagem.text());
    });
    page.on('pageerror', (erro) => erros.push(erro.message));
    await page.goto('/preview/crm-dossie?venda=1');
    const abrir = page.getByRole('button', { name: 'Editar venda' });
    await abrir.click();
    const modal = page.getByRole('dialog', { name: 'Editar venda', exact: true });
    await expect(modal.getByLabel('Nome do projeto')).toBeFocused();
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
        .getByLabel('Nome do projeto')
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await modal.getByLabel('Nome do projeto').fill('Atendimento com IA');
    await modal.getByLabel('Valor previsto (R$)').fill('R$ 12.500,50');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(modal).toBeVisible();
    await expect(modal).toBeHidden();
    await expect(abrir).toBeFocused();
    const ficha = page.locator('section[aria-labelledby="dossie-titulo"]');
    await expect(ficha.getByText('Atendimento com IA', { exact: true })).toBeVisible();
    await expect(ficha.getByText('R$ 12.500,50', { exact: true })).toBeVisible();
    // O mesmo objeto atualizado alimenta o card usado pelo kanban.
    await expect(
      page
        .getByRole('region', { name: 'Prévia do card no kanban' })
        .getByText('Atendimento com IA'),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Prévia do card no kanban' }).getByText(/R\$\s12\.500,50/),
    ).toBeVisible();
    await abrir.click();
    await expect(modal.getByLabel('Valor previsto (R$)')).toHaveValue('12.500,50');
    await modal.getByLabel('Valor previsto (R$)').clear();
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal).toBeHidden();
    await expect(ficha.getByText('A definir', { exact: true })).toBeVisible();
    await abrir.click();
    await modal.getByLabel('Nome do projeto').fill('Não salvar');
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await abrir.click();
    await expect(modal.getByLabel('Nome do projeto')).toHaveValue('Atendimento com IA');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await expect
      .poll(
        async () =>
          (await modal.getByRole('button', { name: 'Salvar alterações' }).boundingBox())?.height ??
          0,
      )
      .toBeGreaterThanOrEqual(44);
    const botao = await modal.getByRole('button', { name: 'Salvar alterações' }).boundingBox();
    expect(botao!.y + botao!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await page.keyboard.press('Escape');
    await expect(abrir).toBeFocused();
    expect(erros).toEqual([]);
  });
  test('valida BRL, preserva rascunho em erro e bloqueia sobrescrita em conflito', async ({
    page,
  }) => {
    await page.goto('/preview/crm-dossie?venda=erro');
    await page.getByRole('button', { name: 'Editar venda' }).click();
    const modal = page.getByRole('dialog', { name: 'Editar venda', exact: true });
    await modal.getByLabel('Valor previsto (R$)').fill('12.50');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal.getByLabel('Valor previsto (R$)')).toBeFocused();
    await expect(modal.getByText(/Digite um valor em reais/)).toBeVisible();
    await modal.getByLabel('Valor previsto (R$)').fill('0');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal.getByRole('alert')).toContainText('Não foi possível salvar');
    await expect(modal.getByLabel('Valor previsto (R$)')).toHaveValue('0');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal).toBeHidden();
    await expect(
      page
        .locator('section[aria-labelledby="dossie-titulo"]')
        .getByText('R$ 0,00', { exact: true }),
    ).toBeVisible();
    await page.goto('/preview/crm-dossie?venda=conflito');
    await page.getByRole('button', { name: 'Editar venda' }).click();
    await modal.getByLabel('Nome do projeto').fill('Nome corrigido');
    await modal.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(modal.getByRole('alert')).toContainText('mudou em outra edição');
    await expect(modal.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
    await expect(modal.getByLabel('Nome do projeto')).toHaveValue('Nome corrigido');
  });
});
