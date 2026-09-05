import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { HERO, PROOF_NOTE, TESTIMONIALS_META } from '../src/content/landing';

test('a primeira dobra aparece sem cascata e preserva os destinos das ações', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/');
  const hero = page.locator('section[aria-labelledby="hero-title"]');
  await expect(hero.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(hero.locator('.rise, .mask-reveal')).toHaveCount(0);
  await expect(hero.getByText(HERO.sub, { exact: true })).toHaveCSS('opacity', '1');
  await expect(hero.getByRole('link', { name: HERO.ctaPrimary.label })).toHaveAttribute(
    'href',
    HERO.ctaPrimary.href,
  );
  await hero.getByRole('link', { name: HERO.ctaSecondary.label }).click();
  await expect(page.locator(HERO.ctaSecondary.href)).toBeInViewport();
  expect(erros).toEqual([]);
});

test('notas de origem e resultados são legíveis, inclusive com movimento reduzido', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const texto of [PROOF_NOTE, TESTIMONIALS_META.note]) {
    const nota = page.getByText(texto, { exact: true });
    await nota.scrollIntoViewIfNeeded();
    await expect(nota).toBeVisible();
    expect(
      await nota.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(14);
  }
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(
    resultado.violations.map(({ id, nodes }) => ({
      id,
      elementos: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    })),
  ).toEqual([]);
  // Teclado físico em janela estreita. A emulação touch do iOS não executa
  // a rolagem padrão por teclas; nela validamos foco, semântica e ausência de overflow.
  if (!isMobile) await page.setViewportSize({ width: 390, height: 844 });
  const tabela = page.getByRole('region', { name: 'Comparação de recursos' });
  await tabela.focus();
  await expect(tabela).toBeFocused();
  await expect(tabela).toHaveCSS('outline-style', 'solid');
  if (!isMobile) {
    expect(await tabela.evaluate((el) => el.scrollWidth)).toBeGreaterThan(
      await tabela.evaluate((el) => el.clientWidth),
    );
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => tabela.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
});

test('profundidade é progressiva e desliga ao pedir menos movimento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#solucoes');
  const midia = page.locator('#solucoes [style*="--parallax-distance"]');
  await midia.scrollIntoViewIfNeeded();
  if (await page.evaluate(() => CSS.supports('animation-timeline: view()'))) {
    await expect(midia).not.toHaveCSS('transform', 'none');
    await expect(midia).not.toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  } else {
    await expect(midia).toHaveCSS('transform', 'none');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(midia).toHaveCSS('transform', 'none');
  await expect(midia).toHaveCSS('animation-name', 'none');
  await expect(midia.getByRole('img')).toBeVisible();
});

test('build de produção mantém conteúdo e âncoras sem JavaScript', async ({ browser }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'CSS sem JavaScript exige build de produção.');
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await contexto.newPage();
    await page.goto(process.env.PLAYWRIGHT_BASE_URL!);
    const hero = page.locator('section[aria-labelledby="hero-title"]');
    await expect(hero.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(hero.getByText(HERO.sub, { exact: true })).toHaveCSS('opacity', '1');
    await hero.getByRole('link', { name: HERO.ctaSecondary.label }).click();
    await expect(page.locator(HERO.ctaSecondary.href)).toBeInViewport();
    await expect(page.getByText(PROOF_NOTE, { exact: true })).toHaveCSS('opacity', '1');
  } finally {
    await contexto.close();
  }
});
