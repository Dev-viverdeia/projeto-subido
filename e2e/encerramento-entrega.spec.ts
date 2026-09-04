import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('encerramento e continuidade da entrega', () => {
  test('registra resultado e próxima ação em um único fluxo', async ({ page }) => {
    await page.goto('/preview/sala-entrega');

    await expect(page.getByRole('heading', { name: 'Confirme o resultado.' })).toBeVisible();
    await expect(page.getByText('Qual resultado o cliente confirmou?')).toBeVisible();
    await expect(page.getByRole('group', { name: 'O que acontece agora?' })).toBeVisible();
    await expect(page.getByLabel('Próxima ação combinada')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar resultado' })).toBeVisible();
    await expect(page.getByText('Objetivo da conversa')).toHaveCount(0);

    const medidas = await page.evaluate(() => ({
      documento: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(medidas.documento).toBeLessThanOrEqual(medidas.viewport);

    const resultado = await new AxeBuilder({ page }).analyze();
    const graves = resultado.violations.filter(
      (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
    );
    expect(graves).toEqual([]);
  });

  test('transforma expansão confirmada em oportunidade sem reabrir a entrega', async ({ page }) => {
    await page.goto('/preview/sala-entrega?estado=resultado');

    await expect(page.getByRole('heading', { name: 'Resultado confirmado' })).toBeVisible();
    await expect(
      page.getByText(
        'A equipe passou a responder novos contatos em menos de um minuto durante o piloto.',
      ),
    ).toBeVisible();
    await expect(page.getByText('Expandir este projeto')).toBeVisible();
    await page.getByRole('button', { name: 'Criar oportunidade' }).click();

    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByRole('heading', { name: 'Criar uma nova venda?' })).toBeVisible();
    await expect(dialogo.getByText('Esta entrega continua concluída.')).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Criar oportunidade' })).toBeVisible();

    const caixa = await dialogo.boundingBox();
    const viewport = page.viewportSize();
    expect(caixa).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(caixa!.x).toBeGreaterThanOrEqual(0);
    expect(caixa!.y).toBeGreaterThanOrEqual(0);
    expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(viewport!.height + 1);

    const medidas = await page.evaluate(() => ({
      documento: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(medidas.documento).toBeLessThanOrEqual(medidas.viewport);

    const resultado = await new AxeBuilder({ page }).analyze();
    const graves = resultado.violations.filter(
      (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
    );
    expect(graves).toEqual([]);
  });
});
