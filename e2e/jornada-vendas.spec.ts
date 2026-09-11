import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('uma etapa, o mesmo próximo passo', () => {
  test('enriquecimento não avança etapa; ação definida e proposta offline ficam acessíveis', async ({
    page,
  }) => {
    await page.goto('/preview/crm-dossie?cenario=acao-definida');
    const ficha = page.getByRole('region', { name: 'Clínica Aurora', exact: true });
    const etapas = page.getByRole('list', { name: 'Etapas da venda', exact: true });
    await expect(ficha.getByRole('strong').filter({ hasText: /^Preparar$/ })).toBeVisible();
    await expect(etapas.locator('[aria-current="step"]')).toHaveAttribute(
      'aria-label',
      'Preparar: Em andamento',
    );
    await expect(etapas.getByRole('listitem')).toHaveCount(4);
    await expect(
      page.getByRole('heading', { name: 'Enviar o escopo pelo WhatsApp' }),
    ).toBeVisible();
    await expect(ficha.getByRole('link', { name: 'Criar proposta' })).toHaveAttribute(
      'href',
      /\/propostas\/nova\?oportunidade=/,
    );
    await page.getByRole('button', { name: 'Editar próxima ação', exact: true }).click();
    const modal = page.getByRole('dialog');
    await expect(
      modal.getByRole('textbox', { name: 'O que precisa acontecer agora?' }),
    ).toHaveValue('Enviar o escopo pelo WhatsApp');
    await expect(modal.getByRole('button', { name: 'Salvar próxima ação' })).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Editar próxima ação', exact: true }),
    ).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const acessibilidade = await new AxeBuilder({ page })
      .include('[aria-labelledby="dossie-titulo"]')
      .include('[aria-labelledby="operacao-titulo"]')
      .analyze();
    expect(acessibilidade.violations).toEqual([]);
  });

  for (const [cenario, acao, destino] of [
    ['proposta-offline', 'Continuar proposta', '/propostas/55555555-5555-4555-8555-555555555555'],
    ['aceita', 'Preparar entrega', '/propostas/55555555-5555-4555-8555-555555555555'],
    ['entrega', 'Abrir entrega', '/entregas/66666666-6666-4666-8666-666666666666'],
    ['concluida', 'Revisar entrega', '/entregas/66666666-6666-4666-8666-666666666666'],
  ]) {
    test(`${cenario}: retoma o documento existente`, async ({ page }, testInfo) => {
      const erros: string[] = [];
      page.on('pageerror', (e) => erros.push(e.message));
      await page.goto(`/preview/crm-dossie?cenario=${cenario}`);
      const operacao = page.getByRole('region', { name: 'Etapas da venda', exact: true });
      await expect(operacao.getByRole('link', { name: acao, exact: true })).toHaveAttribute(
        'href',
        destino,
      );
      await expect(page.getByRole('link', { name: 'Criar proposta', exact: true })).toHaveCount(0);
      if (cenario !== 'proposta-offline') {
        await expect(operacao.locator('[aria-current="step"]')).toHaveCount(0);
        await expect(operacao.getByRole('listitem', { name: 'Ganho: Concluída' })).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(erros).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`${cenario}.png`), fullPage: false });
    });
  }

  test('arquivada preserva histórico sem convite para continuar vendendo', async ({ page }) => {
    await page.goto('/preview/crm-dossie?cenario=arquivada');
    const operacao = page.getByRole('region', { name: 'Etapas da venda', exact: true });
    await expect(operacao.locator('[aria-current="step"]')).toHaveCount(0);
    await expect(operacao.getByRole('button', { name: /próxima ação/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Usar como próxima ação' })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Ações da ficha do cliente' })).toHaveCount(
      0,
    );
  });

  test('quadro mostra todas as fases no desktop e permite trocar no celular', async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.goto('/preview/crm');
    const quadro = page.getByLabel('Quadro de vendas', { exact: true });
    if (isMobile) {
      await quadro.getByRole('tab', { name: /Ganho/ }).click();
      await expect(quadro.getByRole('heading', { name: 'Ganho', exact: true })).toBeVisible();
      await expect(quadro.getByRole('heading', { name: 'Preparar', exact: true })).toBeHidden();
      await quadro.getByRole('tab', { name: /Ganho/ }).focus();
      await page.keyboard.press('Home');
      await expect(quadro.getByRole('tab', { name: /Preparar/ })).toBeFocused();
      await expect(quadro.getByRole('heading', { name: 'Preparar', exact: true })).toBeVisible();
    } else {
      const positions = [];
      for (const fase of ['Preparar', 'Descobrir', 'Propor', 'Ganho']) {
        const titulo = quadro.getByRole('heading', { name: fase, exact: true });
        await expect(titulo).toBeVisible();
        positions.push((await titulo.boundingBox())!);
      }
      expect(
        Math.max(...positions.map((p) => p.y)) - Math.min(...positions.map((p) => p.y)),
      ).toBeLessThan(4);
      expect(positions[3]!.x).toBeGreaterThan(positions[0]!.x + 500);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath('quadro.png'), fullPage: false });
  });
});
