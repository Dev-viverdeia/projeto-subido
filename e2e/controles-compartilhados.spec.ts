import { expect, test } from '@playwright/test';

test('campo mantém o foco na moldura, inclusive com hover e erro', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/shell?tela=controles');
  for (const nome of ['Empresa', 'E-mail']) {
    const campo = page.getByRole('textbox', { name: nome, exact: true });
    await campo.click();
    expect(await campo.locator('..').evaluate((el) => getComputedStyle(el).boxShadow)).toContain(
      '4px',
    );
    await page.keyboard.press('Tab');
    await campo.focus();
    const moldura = campo.locator('..');
    await expect(campo).toBeFocused();
    if (info.project.name === 'desktop') await campo.hover();
    expect(await moldura.evaluate((el) => getComputedStyle(el).boxShadow)).toContain('4px');
    expect(await campo.evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none');
  }
});

test('erro e indisponibilidade não parecem campos normais', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/shell?tela=controles');
  const normal = page.getByRole('textbox', { name: 'Empresa', exact: true }).locator('..');
  const erro = page.getByRole('textbox', { name: 'E-mail', exact: true }).locator('..');
  const ler = (el: Element) => ({
    borda: getComputedStyle(el).borderColor,
    fundo: getComputedStyle(el).background,
    cursor: getComputedStyle(el).cursor,
    filtro: getComputedStyle(el).backdropFilter,
  });
  expect((await erro.evaluate(ler)).borda).not.toBe((await normal.evaluate(ler)).borda);
  const bordaErro = (await erro.evaluate(ler)).borda;
  if (info.project.name === 'desktop') {
    await erro.hover();
    expect((await erro.evaluate(ler)).borda).toBe(bordaErro);
  }
  for (const nome of ['Código', 'Responsável']) {
    const campo = page.getByRole('textbox', { name: nome });
    await expect(campo).toBeDisabled();
    const moldura = campo.locator('..');
    const antes = await moldura.evaluate(ler);
    expect(antes.fundo).not.toBe((await normal.evaluate(ler)).fundo);
    expect(antes.cursor).toBe('not-allowed');
    expect(antes.filtro).toBe('none');
    if (info.project.name === 'desktop') {
      await campo.hover();
      expect(await moldura.evaluate(ler)).toEqual(antes);
    }
  }
  const etapa = page.getByRole('button', { name: 'Etapa', exact: true });
  const etapaErro = page.getByRole('button', { name: 'Etapa pendente', exact: true });
  expect((await etapaErro.evaluate(ler)).borda).not.toBe((await etapa.evaluate(ler)).borda);
  if (info.project.name === 'desktop') {
    const borda = (await etapaErro.evaluate(ler)).borda;
    await etapaErro.hover();
    expect((await etapaErro.evaluate(ler)).borda).toBe(borda);
  }
  const etapaDesabilitada = page.getByRole('button', { name: 'Etapa indisponível' });
  await expect(etapaDesabilitada).toBeDisabled();
  expect((await etapaDesabilitada.evaluate(ler)).fundo).not.toBe((await etapa.evaluate(ler)).fundo);
  await page.screenshot({ path: info.outputPath('estados-dos-campos.png'), fullPage: true });
});

test('erro do seletor prevalece quando o CSS da library carrega depois', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/shell?tela=controles');
  const campo = page.getByRole('button', { name: 'Etapa pendente', exact: true });
  const bordaErro = await campo.evaluate((el) => getComputedStyle(el).borderColor);
  // Reproduz a ordem de chunks que apagava o erro no hover, sem alterar a library.
  await page.addStyleTag({ path: 'src/design-system/via/components/Select/Select.css' });
  if (info.project.name === 'desktop') await campo.hover();
  await expect(campo).toHaveCSS('border-color', bordaErro);
  await campo.focus();
  await expect(campo).toHaveCSS('border-color', bordaErro);
  await campo.click();
  await expect(campo).toHaveAttribute('aria-expanded', 'true');
  await expect(campo).toHaveCSS('border-color', bordaErro);
});

test('o último botão fica totalmente acima do dock em páginas longas', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  for (const tela of ['aula&estado=andamento', 'controles']) {
    await page.goto(`/preview/shell?tela=${tela}`);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const ultimo = page.locator('main').locator('button, a[href]').last();
    const dock = page.getByRole('navigation', { name: 'Navegação principal' });
    const alvo = await ultimo.boundingBox();
    const barra = await dock.boundingBox();
    expect(barra!.y - (alvo!.y + alvo!.height)).toBeGreaterThanOrEqual(16);
    await page.screenshot({ path: info.outputPath(`rodape-${tela.split('&')[0]}.png`) });
  }
});

test('formulário em tela baixa preserva rodapé, leitura e rolagem interna', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 390 : 1280, height: 500 });
  await page.goto('/preview/shell?tela=controles');
  await page.getByRole('button', { name: 'Editar dados', exact: true }).focus();
  await page.keyboard.press('Enter');
  const dialogo = page.getByRole('dialog', { name: 'Editar dados', exact: true });
  const salvar = dialogo.getByRole('button', { name: 'Salvar alterações' });
  const head = dialogo.getByRole('heading', { name: 'Editar dados' });
  await expect(salvar).toBeInViewport({ ratio: 1 });
  // Mede o layout final, não uma posição intermediária da entrada do diálogo.
  await dialogo.evaluate(async (el) => {
    const animacoes = el.getAnimations();
    for (const animacao of animacoes) {
      const efeito = animacao.effect;
      if (efeito instanceof KeyframeEffect) {
        if (efeito.getKeyframes().some((frame) => frame.opacity !== undefined)) {
          throw new Error('O modal não deve animar opacidade sobre os campos de vidro.');
        }
      }
    }
    await Promise.all(animacoes.map((animacao) => animacao.finished));
  });
  const topo = await head.boundingBox();
  await dialogo.getByRole('button', { name: 'Etapa pendente' }).focus();
  await expect(head).toBeInViewport({ ratio: 1 });
  expect((await head.boundingBox())!.y).toBe(topo!.y);
  await expect(salvar).toBeInViewport({ ratio: 1 });
  if (info.project.name === 'mobile') {
    expect(
      await dialogo
        .getByRole('textbox', { name: 'Empresa', exact: true })
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
  }
  await page.screenshot({ path: info.outputPath('formulario-tela-baixa.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Editar dados', exact: true })).toBeFocused();
});
