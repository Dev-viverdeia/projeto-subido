import { expect, test } from '@playwright/test';

test.describe('componentes transacionais', () => {
  test('o cadastro de oportunidade usa campos legíveis e mantém as ações visíveis', async ({
    page,
  }) => {
    await page.goto('/preview/crm?modal=1');

    const dialogo = page.getByRole('dialog', { name: 'Adicionar oportunidade' });
    await expect(dialogo).toBeVisible();
    await expect(page.locator('[data-app-modal]')).toHaveAttribute('data-label', 'Vendas');
    await expect(dialogo.getByRole('button', { name: 'Criar oportunidade' })).toBeVisible();

    const campos = await dialogo.locator('input:not([type="hidden"])').evaluateAll((elementos) =>
      elementos.map((elemento) => {
        const caixa = elemento.parentElement?.getBoundingClientRect();
        return {
          altura: caixa?.height ?? 0,
          fonte: Number.parseFloat(getComputedStyle(elemento).fontSize),
        };
      }),
    );

    expect(campos).toHaveLength(4);
    for (const campo of campos) {
      expect(campo.altura).toBeGreaterThanOrEqual(44);
      expect(campo.fonte).toBeGreaterThanOrEqual(15);
    }

    const medidas = await page.evaluate(() => ({
      largura: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(medidas.largura).toBeLessThanOrEqual(medidas.viewport + 1);
  });

  test('o agendamento mantém contexto, conteúdo rolável e ação final visível', async ({ page }) => {
    await page.goto(
      '/preview/calls?calendar=1&modal=1&oportunidade=22222222-2222-4222-8222-222222222222&tipo=kickoff',
    );

    const dialogo = page.getByRole('dialog', { name: 'Agendar kickoff' });
    await expect(dialogo).toBeVisible();
    await expect(page.locator('[data-app-modal]')).toHaveAttribute('data-label', 'Reuniões');
    await expect(dialogo.getByText('Projeto vinculado')).toBeVisible();

    const coach = dialogo.getByText('Live Coach', { exact: true });
    await coach.scrollIntoViewIfNeeded();
    await expect(coach).toBeVisible();
    await expect(
      dialogo.getByRole('button', { name: 'Agendar kickoff e enviar convite' }),
    ).toBeVisible();

    const caixa = await dialogo.boundingBox();
    const viewport = page.viewportSize();
    expect(caixa).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(caixa!.x).toBeGreaterThanOrEqual(0);
    expect(caixa!.y).toBeGreaterThanOrEqual(0);
    expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(viewport!.height + 1);
  });
});
