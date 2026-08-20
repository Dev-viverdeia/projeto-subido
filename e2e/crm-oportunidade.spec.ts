import { expect, test } from '@playwright/test';

test.describe('Ficha do cliente em Vendas', () => {
  test('mantém as ações disponíveis, orienta o próximo passo e preserva o histórico', async ({
    page,
  }) => {
    await page.goto('/preview/crm-dossie');

    await expect(page.getByText('Ficha do cliente', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Clínica Aurora' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Próximo passo da venda' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar reunião' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar proposta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Atualizar dados' })).toBeVisible();
    await expect(page.getByText('Preparar', { exact: true })).toBeVisible();
    await expect(page.getByText('Descobrir', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Propor', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Apresentar o diagnóstico do piloto para a diretoria.'),
    ).toBeVisible();

    await page.getByText('Ver histórico da venda', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Atividade recente' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reuniões' })).toBeVisible();

    await page.getByRole('tab', { name: 'Preparar reunião' }).click();
    await expect(
      page.getByText(
        'Confirmar se o volume e a demora no WhatsApp justificam um SDR de Atendimento e Qualificação, com um piloto pequeno e mensurável.',
      ),
    ).toBeVisible();
    await expect(page.getByText('Perguntas na ordem da conversa')).toBeVisible();
    await expect(
      page.getByText(
        'Em uma semana comum, quantas conversas chegam e quantas deixam de virar agendamento?',
      ),
    ).toBeVisible();
    await expect(page.getByText('Dimensionar', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Saia com um próximo passo combinado')).toBeVisible();
    await page.getByRole('tab', { name: 'Dados e fontes' }).click();
    await expect(page.getByText('Site da Clínica Aurora')).toBeVisible();

    const semOverflowHorizontal = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(semOverflowHorizontal).toBe(true);
  });

  test('a entrada de uma nova venda abre a ficha sem bloquear as ações', async ({ page }) => {
    await page.goto('/preview/crm-dossie?entrada=1');

    await expect(page.getByText('Ficha do cliente', { exact: true })).toBeVisible();
    await expect(page.getByText(/Venda adicionada\. A ficha do cliente/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar reunião' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar proposta' })).toBeVisible();
    await page.getByRole('button', { name: 'Enriquecer dados' }).click();

    const dialogo = page.getByRole('dialog', { name: 'Enriquecer os dados deste cliente?' });
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

    await expect(page.getByRole('link', { name: 'Agendar reunião' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar proposta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enriquecer dados' })).toBeVisible();

    await page.getByRole('button', { name: 'Enriquecer dados' }).click();
    const scrim = page.getByTestId('enriquecimento-scrim');
    const dialogo = page.getByRole('dialog', { name: 'Enriquecer os dados deste cliente?' });
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

  test('diferencia etapas concluídas, futuras e o ponto em que uma venda foi encerrada', async ({
    page,
  }) => {
    await page.goto('/preview/crm-dossie?resultado=ganho');

    await expect(page.getByRole('heading', { name: 'Venda concluída' })).toBeVisible();
    const etapasDaVenda = page.getByRole('list', { name: 'Etapas da venda' });
    await expect(etapasDaVenda.getByText('Concluída', { exact: true })).toHaveCount(3);
    await expect(page.getByText('Ciclo concluído', { exact: true })).toBeVisible();
    await expect(page.getByText('Pesquisa arquivada')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar reunião' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Usar como próxima ação' })).toHaveCount(0);

    await page.goto('/preview/crm-dossie?resultado=perdido');

    await expect(page.getByRole('heading', { name: 'Venda encerrada' })).toBeVisible();
    await expect(etapasDaVenda.getByText('Concluída', { exact: true })).toHaveCount(1);
    await expect(page.getByText('Encerrada aqui', { exact: true })).toBeVisible();
    await expect(page.getByText('Próxima etapa', { exact: true })).toBeVisible();
    await expect(page.getByText('Pesquisa arquivada')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar reunião' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Usar como próxima ação' })).toHaveCount(0);
  });
});
