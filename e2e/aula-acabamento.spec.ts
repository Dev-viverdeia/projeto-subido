import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('aula: controles não se sobrepõem em notebook, tablet ou celular', async ({ page }) => {
  for (const width of [1280, 1080, 768, 320]) {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/preview/shell?tela=aula&estado=andamento');
    const nav = page.getByRole('navigation', { name: 'Navegação da aula' });
    await expect(nav).toBeVisible();
    const limites = await nav.boundingBox();
    const controles = await nav.locator('a, button').evaluateAll((elementos) =>
      elementos.map((elemento) => {
        const r = elemento.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height };
      }),
    );
    expect(controles).toHaveLength(3);
    for (const [i, controle] of controles.entries()) {
      expect(controle.left).toBeGreaterThanOrEqual(limites!.x);
      expect(controle.right).toBeLessThanOrEqual(limites!.x + limites!.width);
      expect(controle.height).toBeGreaterThanOrEqual(44);
      for (const outro of controles.slice(i + 1)) {
        expect(
          controle.right <= outro.left ||
            outro.right <= controle.left ||
            controle.bottom <= outro.top ||
            outro.bottom <= controle.top,
        ).toBe(true);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
});

test('aula concluída: conclusão explícita e próximo destino em destaque', async ({
  page,
}, info) => {
  await page.goto('/preview/shell?tela=aula&estado=concluido');
  const nav = page.getByRole('navigation', { name: 'Navegação da aula' });
  await expect(nav.getByRole('status')).toHaveText('Aula concluída');
  await expect(nav.getByRole('button', { name: 'Concluir e avançar' })).toHaveCount(0);
  const proxima = nav.getByRole('link', { name: /Próxima aula/ });
  await expect(proxima).toHaveAttribute('data-destaque', '');
  await expect(proxima).toHaveAttribute('href', '/formacoes/formacao-de-chatgpt/aula/aula-2');
  await proxima.focus();
  await expect(proxima).toBeFocused();
  expect(await proxima.evaluate((el) => getComputedStyle(el).boxShadow)).toContain('4px');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  await page.screenshot({
    path: info.outputPath(`aula-concluida-${info.project.name}.png`),
    fullPage: true,
  });
});

test('playlist: associações únicas, conclusão acessível e foco visível por teclado', async ({
  page,
  browserName,
}, info) => {
  await page.goto('/preview/shell?tela=aula&estado=andamento');
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Ver as aulas do curso' }).click();
  }
  const painel = page.getByRole(info.project.name === 'mobile' ? 'dialog' : 'complementary', {
    name: 'Aulas do curso',
  });
  const gatilho = painel.getByRole('button', { name: /Fundamentos/ });
  await expect(gatilho).toHaveAccessibleName(/Módulo concluído/);
  const id = await gatilho.getAttribute('aria-controls');
  expect(id).toBeTruthy();
  expect(
    await page
      .locator('[id]')
      .evaluateAll((els, procurado) => els.filter((el) => el.id === procurado).length, id),
  ).toBe(1);
  await gatilho.focus();
  await page.keyboard.press('Enter');
  await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
  const regiao = painel.getByRole('region', { name: /Fundamentos/ });
  await expect(regiao).toHaveAttribute('id', id!);
  const feita = regiao.getByRole('link', { name: /Como conversar.*Aula concluída/ });
  await expect(feita).toBeVisible();
  await feita.focus();
  await expect(feita).toBeFocused();
  expect(await feita.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await gatilho.focus();
  await page.keyboard.press('Enter');
  await expect(regiao).toHaveAttribute('inert', '');
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(painel.getByRole('button', { name: /Aplicação no trabalho real/ })).toBeFocused();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
});

test('curso extenso: abre na aula atual sem tirar o vídeo da tela', async ({ page }, info) => {
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 390 : 1280, height: 740 });
  await page.goto('/preview/shell?tela=aula&estado=extenso');
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Ver as aulas do curso' }).click();
  }
  const painel = page.getByRole(info.project.name === 'mobile' ? 'dialog' : 'complementary', {
    name: 'Aulas do curso',
  });
  const atual = painel.locator('a[aria-current="page"]');
  await expect(atual).toContainText('Aplicação 9:');
  await expect(atual).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  if (info.project.name === 'desktop') {
    const heading = painel.getByRole('heading', { level: 2 });
    await expect(heading).toBeInViewport({ ratio: 1 });
    const topo = await heading.boundingBox();
    const ultima = painel
      .getByRole('region', { name: 'Aplicação no trabalho real' })
      .getByRole('link', { name: /Aplicação 12:/ });
    await ultima.focus();
    await expect(ultima).toBeInViewport({ ratio: 1 });
    expect((await heading.boundingBox())!.y).toBe(topo!.y);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const bounds = await painel.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(740);
  }
  await page.screenshot({
    path: info.outputPath(`aula-extensa-${info.project.name}.png`),
    fullPage: true,
  });
  // Abrir outro módulo é uma escolha de revisão, não um pedido para voltar à aula atual.
  await painel.getByRole('button', { name: /Fundamentos/ }).click();
  const revisao = painel
    .getByRole('region', { name: /Fundamentos/ })
    .getByRole('link', { name: /Aplicação 1:/ });
  await expect(revisao).toBeInViewport({ ratio: 1 });
});

test('player: carregamento sob demanda, contraste e movimento reduzido', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://video.exemplo.test/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html lang="pt-BR"><title>Player de teste</title><body>Vídeo da aula</body></html>',
    }),
  );
  await page.goto('/preview/shell?tela=aula&estado=video');
  const play = page.getByRole('button', { name: /Assistir:/ });
  await expect(play).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await play.focus();
  if (info.project.name === 'desktop') await play.hover();
  expect(
    await play
      .locator('span')
      .first()
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe('none');
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  await page.screenshot({
    path: info.outputPath(`aula-player-${info.project.name}.png`),
    fullPage: true,
  });
  await page.keyboard.press('Enter');
  await expect(page.locator('iframe')).toHaveAttribute(
    'src',
    'https://video.exemplo.test/embed/aula',
  );
  await expect(page.getByRole('button', { name: /Assistir:/ })).toHaveCount(0);
});
