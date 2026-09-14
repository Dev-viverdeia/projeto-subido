import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('escolha em portal preserva sala, pergunta e foco ao cancelar', async ({
  page,
  browserName,
}, info) => {
  const chamadas: string[] = [];
  const erros: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' || r.url().includes('/api/calls/')) chamadas.push(r.url());
  });
  page.on('pageerror', (e) => erros.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      writable: true,
      value: () => {
        throw new Error('Nenhuma mídia deveria ser solicitada');
      },
    });
  });
  await page.goto('/preview/roteiro-sala');
  await page.getByRole('button', { name: 'Próxima pergunta' }).click();
  const pergunta = await page
    .getByRole('region', { name: 'Roteiro da reunião' })
    .getByRole('heading', { level: 3 })
    .innerText();
  const sair = page.getByRole('button', { name: 'Sair da reunião', exact: true });
  await sair.click();
  const modal = page.getByRole('dialog', { name: 'Sair da reunião' });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Voltar à reunião' })).toBeFocused();
  await expect(modal.getByRole('button', { name: 'Sair da sala' })).toHaveAccessibleDescription(
    'Os outros participantes podem continuar.',
  );
  const caixa = (await modal.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(caixa.x).toBeGreaterThanOrEqual(0);
  expect(caixa.y).toBeGreaterThanOrEqual(0);
  expect(caixa.x + caixa.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(caixa.y + caixa.height).toBeLessThanOrEqual(viewport.height + 1);
  for (let i = 0; i < 6; i++) {
    // WebKit usa Option+Tab para incluir botões na navegação por teclado.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    expect(await modal.evaluate((e) => e.contains(document.activeElement))).toBe(true);
  }
  for (const name of ['Sair da sala', 'Encerrar para todos']) {
    const button = modal.getByRole('button', { name });
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('saida-confirmacao.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(sair).toBeFocused();
  await expect(page.getByRole('heading', { name: pergunta, exact: true })).toBeVisible();
  await expect(page.locator('main')).toHaveAttribute('data-saidas', '0');
  await expect(page.locator('main')).toHaveAttribute('data-encerramentos', '0');
  expect(chamadas).toEqual([]);
  expect(erros).toEqual([]);
});

for (const [escolha, contador, oposto] of [
  ['Sair da sala', 'data-saidas', 'data-encerramentos'],
  ['Encerrar para todos', 'data-encerramentos', 'data-saidas'],
] as const) {
  test(`${escolha}: confirma uma única vez e aguarda sem permitir fechamento`, async ({
    page,
  }, info) => {
    await page.goto('/preview/roteiro-sala');
    await page.getByRole('button', { name: 'Sair da reunião', exact: true }).click();
    const modal = page.getByRole('dialog');
    // dispatchEvent simula um segundo clique mesmo após o primeiro desabilitar o controle.
    const button = modal.getByRole('button', { name: escolha, exact: true });
    await button.click();
    await button.dispatchEvent('click');
    await expect(modal.getByRole('status')).toHaveText('Aguarde a confirmação para sair.');
    await expect(modal.getByRole('button', { name: 'Voltar à reunião' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(modal).toBeVisible();
    await page.screenshot({ path: info.outputPath('saida-aguardando.png') });
    await expect(modal).toBeHidden();
    await expect(page.locator('main')).toHaveAttribute(contador, '1');
    await expect(page.locator('main')).toHaveAttribute(oposto, '0');
  });
}

test('falha preserva a sala e oferece nova tentativa sem detalhes técnicos', async ({
  page,
}, info) => {
  await page.goto('/preview/roteiro-sala?saida=erro');
  await page.getByRole('button', { name: 'Sair da reunião', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: 'Encerrar para todos' }).click();
  await expect(modal.getByRole('alert')).toHaveText(
    'Não foi possível concluir o encerramento. Tente novamente.',
  );
  await expect(modal.getByRole('alert')).toBeFocused();
  await expect(page.getByRole('article').first()).toBeAttached();
  await expect(modal.getByRole('button', { name: 'Encerrar para todos' })).toBeEnabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('saida-erro.png') });
  await modal.getByRole('button', { name: 'Encerrar para todos' }).click();
  await expect(modal).toBeHidden();
  await expect(page.locator('main')).toHaveAttribute('data-encerramentos', '2');
  await expect(page.locator('main')).toHaveAttribute('data-saidas', '0');
});

test('confirmação cabe em 320px com alto contraste e movimento reduzido', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/preview/roteiro-sala');
  await page.getByRole('button', { name: 'Sair da reunião', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('button', { name: 'Voltar à reunião' })).toBeInViewport();
  await expect(modal.getByRole('button', { name: 'Sair da sala' })).toBeInViewport();
  await expect(modal.getByRole('button', { name: 'Encerrar para todos' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('saida-320-contraste.png'), fullPage: true });
});
