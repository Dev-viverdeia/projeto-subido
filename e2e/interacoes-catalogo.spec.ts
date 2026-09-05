import { expect, test } from '@playwright/test';

for (const tela of ['formacoes', 'projetos']) {
  test(`${tela}: o card responde ao mouse sem sublinhar todo o conteúdo ou mudar de lugar`, async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto(`/preview/shell?tela=${tela}`);
    const cards = page
      .getByRole('main')
      .getByRole('link')
      .filter({ has: page.locator('h3') });
    await expect(cards.first()).toBeVisible();
    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const sombraAntes = await card.evaluate((el) => getComputedStyle(el).boxShadow);
      await card.hover();
      await expect(card).toHaveCSS('text-decoration-line', 'none');
      await expect(card).toHaveCSS('transform', 'none');
      await expect(card).not.toHaveCSS('box-shadow', sombraAntes);
      await expect(card.locator('a, button, [tabindex]')).toHaveCount(0);
    }
    const nav = page.getByRole('navigation', { name: 'Seções da plataforma' });
    const inicio = nav.getByRole('link', { name: 'Início', exact: true });
    await inicio.hover();
    await expect(inicio).toHaveCSS('text-decoration-line', 'none');
  });

  test(`${tela}: teclado e movimento reduzido preservam o foco e a posição do card`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/preview/shell?tela=${tela}`);
    const card = page
      .getByRole('main')
      .getByRole('link')
      .filter({ has: page.locator('h3') })
      .first();
    await page.keyboard.press('Tab');
    await card.focus();
    await expect(card).toBeFocused();
    const sombraFocada = await card.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(sombraFocada).toContain('4px');
    if (info.project.name === 'desktop') {
      await card.hover();
      // Hover não pode apagar o anel de foco nem reintroduzir movimento.
      await expect(card).toHaveCSS('box-shadow', sombraFocada);
    }
    await expect(card).toHaveCSS('transform', 'none');
    const setas = await card.locator('svg').evaluateAll((els) =>
      els.map((el) => ({
        propria: getComputedStyle(el).transform,
        pai: getComputedStyle(el.parentElement!).transform,
      })),
    );
    for (const seta of setas) expect(seta).toEqual({ propria: 'none', pai: 'none' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    await page.screenshot({ path: test.info().outputPath(`${tela}-foco.png`), fullPage: true });
  });
}

test('links de prosa continuam sublinhados, sem contaminar a navegação em listas', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/preview/interacoes');
  for (const nome of [
    'link no parágrafo',
    'link estilizado no parágrafo',
    'link na lista',
    'link de texto com classe na lista',
    'Link na lista aninhada',
  ]) {
    const link = page.getByRole('link', { name: nome, exact: true });
    await link.hover();
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
  }
  const navegacao = page.getByRole('link', { name: 'Abrir conteúdo' });
  await navegacao.hover();
  await expect(navegacao).toHaveCSS('text-decoration-line', 'none');
});

test('a tinta do foco tem contraste superior a 3:1 contra o branco e o canvas frio', async ({
  page,
}) => {
  await page.goto('/preview/interacoes');
  const cor = await page
    .locator('[data-amostra-foco]')
    .evaluate((el) => getComputedStyle(el).color);
  const rgb = cor
    .match(/[\d.]+/g)!
    .slice(0, 3)
    .map(Number);
  const componentes = cor.startsWith('color(srgb') ? rgb : rgb.map((c) => c / 255);
  const luminancia = (valores: number[]) =>
    valores
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((soma, c, i) => soma + c * [0.2126, 0.7152, 0.0722][i]!, 0);
  const tinta = luminancia(componentes);
  for (const fundo of [
    [1, 1, 1],
    [247 / 255, 248 / 255, 250 / 255],
  ]) {
    expect((luminancia(fundo) + 0.05) / (tinta + 0.05)).toBeGreaterThan(3);
  }
});

test('os estados de formação continuam distinguindo retomar de revisar', async ({ page }) => {
  for (const [estado, acao] of [
    ['andamento', 'Retomar formação'],
    ['concluido', 'Revisar formação'],
  ]) {
    await page.goto(`/preview/formacoes?estado=${estado}`);
    const lista = page.getByRole('list', { name: 'Formações em ordem recomendada' });
    const card = lista.getByRole('link').first();
    await expect(card).toContainText(acao!);
    await expect(card.locator('button, a, [tabindex]')).toHaveCount(0);
    await expect(card).toHaveCSS('text-decoration-line', 'none');
  }
});
