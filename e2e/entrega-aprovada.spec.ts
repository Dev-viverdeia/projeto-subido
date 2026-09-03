import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('proposta aprovada até a primeira tarefa', () => {
  test('abre uma preparação curta, acessível e sem vazamento horizontal', async ({ page }) => {
    await page.goto('/preview/sala-entrega?estado=inicio');

    await expect(page.getByRole('heading', { name: 'Prepare o projeto' })).toBeVisible();
    await expect(page.getByText('Proposta V03 aceita')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Completar acordo' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Fases da entrega' })).toHaveCount(0);

    const largura = await page.evaluate(() => ({
      documento: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(largura.documento).toBeLessThanOrEqual(largura.viewport);

    const resultado = await new AxeBuilder({ page }).analyze();
    const graves = resultado.violations.filter(
      (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
    );
    expect(graves).toEqual([]);
  });

  test('mantém a execução focada na tarefa, evidência e próxima decisão', async ({ page }) => {
    await page.goto('/preview/sala-entrega?estado=execucao');

    const tarefa = page.getByRole('heading', { name: 'Montar a base aprovada', level: 2 });
    await expect(tarefa).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Comprove e conclua' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Concluir tarefa' })).toBeVisible();
    await expect(page.getByText('Dúvidas clínicas seguem para a recepção')).not.toBeVisible();

    const posicaoTarefa = await tarefa.boundingBox();
    expect(posicaoTarefa?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(900);

    const medidas = await page.evaluate(() => ({
      larguraDocumento: document.documentElement.scrollWidth,
      larguraViewport: window.innerWidth,
      alturaDocumento: document.documentElement.scrollHeight,
    }));
    expect(medidas.larguraDocumento).toBeLessThanOrEqual(medidas.larguraViewport);
    expect(medidas.alturaDocumento).toBeLessThan(2200);

    await page.getByText('Contexto de Clínica Aurora').click();
    await expect(page.getByText('Dúvidas clínicas seguem para a recepção')).toBeVisible();

    const resultado = await new AxeBuilder({ page }).analyze();
    const graves = resultado.violations.filter(
      (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
    );
    expect(graves).toEqual([]);
  });

  test('mostra o pedido de ajuste junto do trabalho que precisa ser corrigido', async ({
    page,
  }) => {
    await page.goto('/preview/sala-entrega?estado=ajustes');

    const pedido = page.getByText(
      'Inclua também os horários de feriado e deixe a transferência para a recepção mais evidente.',
    );
    const evidencia = page.getByRole('heading', { name: 'Comprove e conclua' });

    await expect(page.getByText('Pedido do cliente')).toBeVisible();
    await expect(pedido).toBeVisible();
    await expect(pedido).toHaveCount(1);
    await expect(evidencia).toBeVisible();

    const posicaoPedido = await pedido.boundingBox();
    const posicaoEvidencia = await evidencia.boundingBox();
    expect(posicaoPedido?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(
      posicaoEvidencia?.y ?? Number.NEGATIVE_INFINITY,
    );

    const largura = await page.evaluate(() => ({
      documento: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(largura.documento).toBeLessThanOrEqual(largura.viewport);
  });
});
