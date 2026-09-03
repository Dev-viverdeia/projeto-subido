import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('portal de validação do cliente', () => {
  test('leva o cliente direto à entrega que precisa de resposta', async ({ page }) => {
    await page.goto('/preview/portal-cliente?estado=aprovacao');

    const titulo = page.getByRole('heading', { name: 'Revise esta entrega.' });
    const entrega = page.getByRole('heading', { name: 'Montar a base aprovada' });

    await expect(titulo).toBeVisible();
    await expect(entrega).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aprovar entrega' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pedir ajuste' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'O que precisa mudar?' })).toHaveCount(0);

    const posicaoEntrega = await entrega.boundingBox();
    expect(posicaoEntrega?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(900);

    const medidas = await page.evaluate(() => ({
      largura: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      altura: document.documentElement.scrollHeight,
    }));
    expect(medidas.largura).toBeLessThanOrEqual(medidas.viewport);
    expect(medidas.altura).toBeLessThan(1900);

    const resultado = await new AxeBuilder({ page }).analyze();
    const graves = resultado.violations.filter(
      (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
    );
    expect(graves).toEqual([]);
  });

  test('abre o pedido de ajuste somente depois da escolha do cliente', async ({ page }) => {
    await page.goto('/preview/portal-cliente?estado=aprovacao');

    await page.getByRole('button', { name: 'Pedir ajuste' }).click();

    const comentario = page.getByRole('textbox', { name: 'O que precisa mudar?' });
    await expect(comentario).toBeVisible();
    await expect(comentario).toBeFocused();
    await expect(page.getByRole('button', { name: 'Enviar ajuste' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voltar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aprovar entrega' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(comentario).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Aprovar entrega' })).toBeVisible();
  });

  test('mantém resultados disponíveis sem alongar o estado concluído', async ({ page }) => {
    await page.goto('/preview/portal-cliente');

    await expect(page.getByRole('heading', { name: 'Projeto concluído.' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Resultado, garantia e continuidade.' }),
    ).toHaveCount(0);

    await page.getByText('Resultados', { exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Resultado, garantia e continuidade.' }),
    ).toBeVisible();
  });
});
