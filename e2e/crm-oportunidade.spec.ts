import { expect, test } from '@playwright/test';

test.describe('Ficha do cliente no CRM', () => {
  test('mantém as ações disponíveis, orienta o próximo passo e preserva o histórico', async ({
    page,
  }) => {
    await page.goto('/preview/crm-dossie');

    await expect(page.getByText('Ficha do cliente', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Clínica Aurora' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Venda guiada.' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar call' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar proposta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Atualizar enriquecimento' })).toBeVisible();
    await expect(page.getByText('Preparar', { exact: true })).toBeVisible();
    await expect(page.getByText('Descobrir', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Propor', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Apresentar o diagnóstico do piloto para a diretoria.'),
    ).toBeVisible();

    await page.getByText('Ver histórico da oportunidade', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Atividade recente' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Calls' })).toBeVisible();

    await page.getByRole('tab', { name: 'Preparar call' }).click();
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

  test('a entrada de uma nova oportunidade abre a ficha sem bloquear as ações', async ({
    page,
  }) => {
    await page.goto('/preview/crm-dossie?entrada=1');

    await expect(page.getByText('Ficha do cliente', { exact: true })).toBeVisible();
    await expect(page.getByText(/Oportunidade adicionada\. A ficha do cliente/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar call' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar proposta' })).toBeVisible();
    await page.getByRole('button', { name: 'Enriquecer oportunidade' }).click();

    const dialogo = page.getByRole('dialog', { name: 'Enriquecer esta oportunidade?' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText(/usa tudo que já está salvo na ficha/)).toBeVisible();
    await expect(dialogo.getByText('3 créditos', { exact: true })).toBeVisible();
    await expect(dialogo.getByText('17')).toBeVisible();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });

  test('mantém o enriquecimento no viewport sem esconder as outras ações', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/preview/crm-dossie?pesquisa=pendente');

    await expect(page.getByRole('link', { name: 'Agendar call' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar proposta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enriquecer oportunidade' })).toBeVisible();

    await page.getByRole('button', { name: 'Enriquecer oportunidade' }).click();
    const scrim = page.getByTestId('enriquecimento-scrim');
    const dialogo = page.getByRole('dialog', { name: 'Enriquecer esta oportunidade?' });
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

    await dialogo
      .getByRole('button', { name: 'Confirmar por 3 créditos' })
      .scrollIntoViewIfNeeded();
    await expect(dialogo.getByRole('button', { name: 'Confirmar por 3 créditos' })).toBeVisible();
  });
});
