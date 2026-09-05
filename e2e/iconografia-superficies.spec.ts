import { expect, test } from '@playwright/test';

test('as áreas mantêm o mesmo pictograma no Início e na navegação', async ({ page }, info) => {
  await page.goto('/preview/shell');
  const atalhos = page.getByRole('navigation', { name: 'Atalhos da plataforma' });
  const desenhos = await atalhos.locator('svg[data-icone-produto]').evaluateAll((icones) =>
    icones.map((icone) => ({
      area: icone.getAttribute('data-icone-produto'),
      desenho: icone.innerHTML,
      largura: icone.getBoundingClientRect().width,
      foco: icone.getAttribute('focusable'),
      oculto: icone.getAttribute('aria-hidden'),
    })),
  );
  expect(desenhos).toHaveLength(9);
  for (const icone of desenhos) {
    expect(icone.largura).toBe(30);
    expect(icone.foco).toBe('false');
    expect(icone.oculto).toBe('true');
    // A navegação desktop permanece no DOM quando o dock está em uso.
    const correspondente = page.locator(`aside svg[data-icone-produto="${icone.area}"]`);
    await expect(correspondente).toHaveAttribute('width', '22');
    expect(await correspondente.innerHTML()).toBe(icone.desenho);
  }
  await page.screenshot({ path: info.outputPath('inicio.png'), fullPage: true });
});

test('vidro estrutural não amplifica a saturação e ícone ativo herda tinta legível', async ({
  page,
}) => {
  await page.goto('/preview/shell');
  const resultados = await page.locator('[data-app-shell]').evaluate((shell) => {
    const estilo = getComputedStyle(shell);
    const fundo = estilo.backgroundImage;
    const cores = Array.from(fundo.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)).map((cor) => [
      Number(cor[1]),
      Number(cor[2]),
      Number(cor[3]),
    ]);
    return { cores, filtro: estilo.getPropertyValue('--app-glass-filter').trim() };
  });
  expect(resultados.cores.length).toBeGreaterThanOrEqual(2);
  resultados.cores.forEach(([r, g, b]) => {
    expect(r).toBeLessThanOrEqual(g);
    expect(g).toBeLessThanOrEqual(b);
  });
  expect(resultados.filtro).toBe('blur(24px) saturate(100%)');

  const largura = page.viewportSize()!.width;
  const icone = page.locator('a[aria-current="page"] svg[data-icone-produto]:visible');
  await expect(icone).toHaveCSS(
    'color',
    largura >= 1080 ? 'rgb(255, 255, 255)' : 'rgb(10, 31, 59)',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    largura,
  );
});

test('Sobral AI usa o mesmo símbolo sem poluir a conversa nem cortar o compositor', async ({
  page,
}, info) => {
  await page.goto('/preview/shell?tela=sobral');
  const main = page.locator('main');
  await expect(main.getByRole('region', { name: 'Nova conversa', exact: true })).toBeVisible();
  await expect(main.locator('svg[data-icone-produto="sobral"]')).toHaveCount(2);
  await expect(main.getByRole('textbox')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  // Testa alcance real acima do dock, sem enviar mensagens nem consumir créditos.
  await main.getByRole('textbox').fill('Como começar meu projeto?');
  const enviar = main.getByRole('button', { name: 'Enviar mensagem', exact: true });
  await enviar.scrollIntoViewIfNeeded();
  await enviar.click({ trial: true });
  await page.screenshot({ path: info.outputPath('sobral.png'), fullPage: true });
});
