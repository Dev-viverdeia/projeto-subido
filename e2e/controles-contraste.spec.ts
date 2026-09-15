import { expect, test, type Locator } from '@playwright/test';
import { conferirContrasteDasEtapas } from './helpers/estudio-contraste';

async function selecaoLegivel(controles: Locator) {
  // Não basta aguardar a animação terminar: bloqueia a causa da regressão
  // mesmo quando um runner lento não captura o primeiro quadro da troca.
  const transicoes = await controles.evaluateAll((els) =>
    els.map((el) => ({
      nome: el.textContent,
      propriedades: getComputedStyle(el)
        .transitionProperty.split(',')
        .map((p) => p.trim()),
    })),
  );
  expect(transicoes.length).toBeGreaterThan(0);
  for (const controle of transicoes) {
    for (const propriedade of ['all', 'color', 'background', 'background-color']) {
      expect(controle.propriedades, controle.nome ?? '').not.toContain(propriedade);
    }
  }
  // Amostra 21 pontos da transição existente, sem neutralizar o CSS.
  await conferirContrasteDasEtapas(controles);
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`roteiro: seleção e desseleção legíveis (${reducedMotion})`, async ({ page, isMobile }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/preview/call-preparo?tipo=kickoff');
    const nav = page.getByRole('navigation', { name: 'Momentos do roteiro' });
    for (const nome of ['Como abrir', 'Como fechar', 'Perguntas', 'Como fechar']) {
      const botao = nav.getByRole('button', { name: nome, exact: true });
      if (isMobile) await botao.tap();
      else await botao.click();
      await expect(botao).toHaveAttribute('aria-pressed', 'true');
      await expect(nav.getByRole('button', { pressed: true })).toHaveCount(1);
      await selecaoLegivel(nav.getByRole('button'));
    }
    await expect(page.getByRole('heading', { name: 'Confirmar o acordo' })).toBeVisible();
    await expect(page.getByText('Confirmar o acordo e iniciar a primeira tarefa.')).toBeVisible();
  });

  test(`projeto: abas e conclusão sem inversão intermediária (${reducedMotion})`, async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/preview/shell?tela=projeto&estado=nina');
    const nav = page.getByRole('tablist', { name: 'Áreas do projeto' });
    for (const nome of ['Aprender', 'Implementar', 'Pré-requisitos e materiais', 'Aprender']) {
      const aba = nav.getByRole('tab', { name: nome, exact: true });
      if (isMobile) await aba.tap();
      else await aba.click();
      await expect(aba).toHaveAttribute('aria-selected', 'true');
      await selecaoLegivel(nav.getByRole('tab'));
    }
    const aulas = page.getByRole('navigation', { name: 'Aulas do projeto', exact: true });
    for (const numero of [2, 1]) {
      const menu = page.getByRole('button', { name: /^Aula \d de \d/ });
      if (!(await aulas.isVisible())) await menu.click();
      await aulas.getByRole('button', { name: new RegExp(`^Aula ${numero}:`) }).click();
      // No celular, escolher fecha a lista. Reabra antes de medir os controles.
      if (!(await aulas.isVisible())) await menu.click();
      await selecaoLegivel(aulas.getByRole('button'));
    }
    await selecaoLegivel(page.getByRole('button', { name: 'Concluir aula', exact: true }));
    await expect(
      page.getByRole('progressbar', { name: 'Progresso do aprendizado', exact: true }),
    ).toHaveAttribute('aria-valuenow', '0');
  });
}

test('roteiro: toque, foco real e layout nos pontos de quebra', async ({ page }) => {
  await page.goto('/preview/call-preparo');
  const nav = page.getByRole('navigation', { name: 'Momentos do roteiro' });
  for (const width of [320, 600, 768, 900, 1080, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const caixas = await nav.getByRole('button').evaluateAll((els) =>
      els.map((el) => ({
        altura: el.getBoundingClientRect().height,
        largura: el.getBoundingClientRect().width,
        fonte: parseFloat(getComputedStyle(el).fontSize),
        toque: getComputedStyle(el).touchAction,
      })),
    );
    for (const caixa of caixas) {
      expect(caixa.altura).toBeGreaterThanOrEqual(44);
      expect(caixa.largura).toBeGreaterThanOrEqual(44);
      expect(caixa.fonte).toBeGreaterThanOrEqual(15);
      expect(caixa.toque).toBe('manipulation');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const abrir = nav.getByRole('button', { name: 'Como abrir', exact: true });
  await abrir.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(abrir).toBeFocused();
  await expect(abrir).toHaveCSS('outline-style', 'solid');
  expect(await abrir.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
});
