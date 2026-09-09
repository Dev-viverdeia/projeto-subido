import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const largura of [320, 390, 768, 1440]) {
  test(`projeto: cliente acessível em um clique a ${largura}px`, async ({ page }, info) => {
    await page.setViewportSize({ width: largura, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const erros: string[] = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    await page.goto('/preview/shell?tela=projeto&estado=nina');
    const atalho = page.getByRole('button', { name: 'Usar com cliente', exact: true });
    await expect(atalho).toBeInViewport();
    expect((await atalho.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await atalho.click();
    await expect(page.getByRole('heading', { name: 'Usar com cliente' })).toBeFocused();
    const adicionar = page.getByRole('link', { name: 'Adicionar empresa', exact: true });
    await expect(adicionar).toBeInViewport();
    await expect(adicionar).toHaveAttribute(
      'href',
      /\/vendas\?novo=projeto&projeto=.+&projetoSlug=sdr-atendimento-qualificacao/,
    );
    expect((await adicionar.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      largura,
    );
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(erros).toEqual([]);
    await page.screenshot({ path: info.outputPath(`cliente-${largura}.png`), fullPage: true });
  });
}

test('vendas: etapas legíveis, toque confortável e busca encontra outra fase', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/preview/crm');
  const tabs = page.getByRole('tablist', { name: 'Etapas da venda' });
  for (const tab of await tabs.getByRole('tab').all()) {
    expect((await tab.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    expect(
      await tab.locator('span').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(14);
  }
  await tabs.getByRole('tab').first().focus();
  await page.keyboard.press('End');
  await expect(tabs.getByRole('tab', { name: /^Ganho:/ })).toBeFocused();
  await page.getByRole('searchbox', { name: 'Buscar vendas' }).fill('Aurora');
  await expect(tabs.getByRole('tab', { name: /^Preparar:/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('heading', { name: 'Preparar', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Ações de Clínica Aurora', exact: true }),
  ).toBeVisible();
});

test('entregas: uma identificação por destaque e ação clara', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/preview/entregas');
  const regiao = page.getByRole('region', { name: 'Para fazer agora' });
  const entrega = regiao.getByRole('link', { name: 'Abrir entrega de Clínica Aurora' });
  await expect(entrega.getByText('Clínica Aurora', { exact: true })).toHaveCount(1);
  const continuar = entrega.getByText('Continuar entrega', { exact: true });
  await expect(continuar).toBeInViewport();
  expect((await continuar.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('entregas-mobile.png'), fullPage: true });
});
