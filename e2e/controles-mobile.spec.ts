import { expect, test } from '@playwright/test';

test('a quantidade selecionada mantém contraste ao toque e ao passar o mouse', async ({ page }) => {
  await page.goto('/preview/prospeccao');
  const quantidade = page.getByRole('button', { name: '10', exact: true });
  await quantidade.click();
  await quantidade.hover();
  await expect(quantidade).toHaveAttribute('aria-pressed', 'true');
  const contraste = await quantidade.evaluate((botao) => {
    const estilo = getComputedStyle(botao);
    const luminancia = (cor: string) => {
      const canais = cor
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((valor) => {
          const canal = valor / 255;
          return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
        });
      return canais[0] * 0.2126 + canais[1] * 0.7152 + canais[2] * 0.0722;
    };
    const frente = luminancia(estilo.color);
    const fundo = luminancia(estilo.backgroundColor);
    return (Math.max(frente, fundo) + 0.05) / (Math.min(frente, fundo) + 0.05);
  });
  expect(contraste).toBeGreaterThanOrEqual(4.5);
});

test('a busca tem um único anel de foco e um único controle de limpar', async ({ page }) => {
  await page.goto('/preview/crm');
  const busca = page.getByPlaceholder('Buscar empresa ou contato');
  await busca.fill('Aurora');
  await busca.focus();
  await expect(busca).toHaveCSS('box-shadow', 'none');
  await expect(busca).toHaveCSS('outline-style', 'none');
  const moldura = await busca.evaluate((input) => getComputedStyle(input.parentElement!).boxShadow);
  expect(moldura).not.toBe('none');
  // WebKit/Chromium não expõem o estilo computado desse controle nativo.
  // Verifica a regra aplicada e registra o resultado visual, sem inferir "none".
  const ocultaNativo = await busca.evaluate((input) => {
    const buscar = (regras: CSSRuleList): boolean =>
      [...regras].some((regra) => {
        if (regra instanceof CSSStyleRule) {
          const seletor = regra.selectorText.split('::-webkit-search-cancel-button');
          return (
            seletor.length === 2 && input.matches(seletor[0]) && regra.style.display === 'none'
          );
        }
        return 'cssRules' in regra && buscar((regra as CSSGroupingRule).cssRules);
      });
    return [...document.styleSheets].some((folha) => buscar(folha.cssRules));
  });
  expect(ocultaNativo).toBe(true);
  await page.screenshot({ path: test.info().outputPath('busca-foco-unico.png') });
  await page.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(busca).toHaveValue('');
});
