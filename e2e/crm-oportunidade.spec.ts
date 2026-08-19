import { expect, test } from '@playwright/test';

test.describe('Oportunidade do CRM', () => {
  test('prioriza método, próxima ação e pesquisa sem perder o histórico', async ({ page }) => {
    await page.goto('/preview/crm-dossie');

    await expect(page.getByRole('heading', { name: 'Clínica Aurora' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Um passo por vez.' })).toBeVisible();
    await expect(page.getByText('Preparar', { exact: true })).toBeVisible();
    await expect(page.getByText('Descobrir', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Propor', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Apresentar o diagnóstico do piloto para a diretoria.'),
    ).toBeVisible();

    await page.getByText('Ver histórico da oportunidade', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Atividade recente' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Calls' })).toBeVisible();

    await page.getByRole('tab', { name: 'Preparar conversa' }).click();
    await expect(
      page.getByText('Quantas conversas novas chegam pelo WhatsApp por dia?'),
    ).toBeVisible();
    await page.getByRole('tab', { name: 'Dados e fontes' }).click();
    await expect(page.getByText('Site da Clínica Aurora')).toBeVisible();

    const semOverflowHorizontal = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(semOverflowHorizontal).toBe(true);
  });

  test('a entrada de uma nova oportunidade explica a sequência e abre a pesquisa', async ({
    page,
  }) => {
    await page.goto('/preview/crm-dossie?entrada=1');

    await expect(page.getByText('Oportunidade adicionada')).toBeVisible();
    await expect(page.getByText('Oportunidade no pipeline')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar primeira call' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Pesquisar empresa' }).click();

    const dialogo = page.getByRole('dialog', { name: 'Pesquisar esta empresa' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText('Fatos e hipóteses aparecem separados.')).toBeVisible();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });

  test('mantém a pesquisa no viewport e mostra uma única ação principal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/preview/crm-dossie?pesquisa=pendente');

    await expect(
      page.getByText('Pesquise a empresa antes de agendar a primeira conversa.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar call' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Criar proposta' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Pesquisar empresa' }).click();
    const scrim = page.getByTestId('enriquecimento-scrim');
    const dialogo = page.getByRole('dialog', { name: 'Pesquisar esta empresa' });
    await expect(scrim).toBeVisible();
    await expect(dialogo).toBeVisible();

    const geometria = await scrim.evaluate((elemento) => {
      const caixa = elemento.getBoundingClientRect();
      return {
        top: Math.round(caixa.top),
        left: Math.round(caixa.left),
        width: Math.round(caixa.width),
        height: Math.round(caixa.height),
      };
    });
    expect(geometria).toEqual({ top: 0, left: 0, width: 1280, height: 720 });

    await dialogo.getByRole('button', { name: 'Começar pesquisa' }).scrollIntoViewIfNeeded();
    await expect(dialogo.getByRole('button', { name: 'Começar pesquisa' })).toBeVisible();
  });
});
