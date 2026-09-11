import { expect, test } from '@playwright/test';

test.skip(({ browserName }) => browserName !== 'chromium', 'CPU lenta usa CDP do Chromium.');

// Build real: o parser pode pintar o título antes de terminar de montar os campos.
// A CPU lenta reproduz o salto que a centralização por altura causava nesse intervalo.
for (const viewport of [
  { width: 412, height: 823 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`entrada estável em ${viewport.width}px com CPU lenta`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 8 });
    await page.addInitScript(() => {
      const alvo = window as Window & { clsEntrada: number };
      alvo.clsEntrada = 0;
      new PerformanceObserver((lista) => {
        for (const entrada of lista.getEntries()) {
          const deslocamento = entrada as PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          };
          if (!deslocamento.hadRecentInput) alvo.clsEntrada += deslocamento.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/entrar', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
    await page.waitForTimeout(1500);
    const cls = await page.evaluate(() => (window as Window & { clsEntrada: number }).clsEntrada);
    await testInfo.attach('estabilidade', {
      body: JSON.stringify({ viewport, cpu: 8, cls }),
      contentType: 'application/json',
    });
    await page.screenshot({ path: testInfo.outputPath('entrada.png'), fullPage: true });
    expect(cls, 'O formulário não pode saltar durante o carregamento').toBeLessThanOrEqual(0.1);
    await page.getByLabel('E-mail', { exact: true }).focus();
    await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused();
    await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute(
      'href',
      '/recuperar-senha',
    );
    await expect(page.getByRole('link', { name: 'Criar conta', exact: true })).toHaveAttribute(
      'href',
      '/criar-conta',
    );
  });
}
