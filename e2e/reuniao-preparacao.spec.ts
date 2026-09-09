import AxeBuilder from '@axe-core/playwright';
import { chromium, expect, test } from '@playwright/test';

test('controles em português não sobrepõem a sala no celular', async ({ page }, info) => {
  await page.goto('/preview/sala-dispositivos');
  await expect(page.locator('.lk-participant-tile')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Ativar microfone', exact: true })).toBeVisible();
  for (const label of [
    'Ativar microfone',
    'Ativar câmera',
    'Encerrar reunião',
    'Mensagens da reunião',
  ]) {
    const botao = page.getByRole('button', { name: label, exact: true });
    await expect(botao).toBeInViewport();
    const caixa = await botao.boundingBox();
    expect(caixa!.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByLabel('Configurar câmera e microfone', { exact: true }).click();
  const camera = page.getByRole('combobox', { name: 'Câmera da reunião', exact: true });
  await expect(camera).toBeInViewport();
  expect(await camera.evaluate((el) => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
  await camera.focus();
  await page.keyboard.press('Escape');
  await expect(camera).toBeHidden();
  await page.getByRole('button', { name: 'Mensagens da reunião', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Mensagem para os participantes' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Enviar mensagem', exact: true })).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Mensagens da reunião', exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('controles-sala.png'), fullPage: true });
});

test('permissão negada mantém a entrada disponível e explica como recuperar', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      // O adaptador WebRTC do Safari envolve este método; o mock não pode torná-lo readonly.
      writable: true,
      configurable: true,
      value: () => Promise.reject(new DOMException('Bloqueado no teste', 'NotAllowedError')),
    });
  });
  await page.goto('/preview/sala-call?convidado=1');
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Testar câmera e microfone' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Permita o microfone');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Permita a câmera');
  await page.getByRole('checkbox').check();
  const entrar = page.getByRole('button', { name: 'Entrar na reunião' });
  await expect(entrar).toBeEnabled();
  await expect(page.getByText('Você entrará com câmera e microfone desligados.')).toBeVisible();
  await page.getByText('Escolher dispositivos', { exact: true }).click();
  for (const seletor of await page.getByRole('combobox').all()) {
    expect(
      await seletor.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('permissao-bloqueada.png'), fullPage: true });
});

test('prévia real é local, desligável e não envia mídia antes de entrar', async ({
  browserName,
  baseURL,
}, info) => {
  test.skip(
    browserName !== 'chromium',
    'Dispositivos sintéticos do Chromium; WebKit cobre layout e falhas.',
  );
  const browser = await chromium.launch({
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ['camera', 'microphone'],
    });
    const page = await context.newPage();
    const chamadas: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/calls/')) chamadas.push(request.url());
    });
    await page.addInitScript(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      const streams: MediaStream[] = [];
      Object.defineProperty(window, 'streamsTeste', { value: streams });
      navigator.mediaDevices.getUserMedia = async (opcoes) => {
        const stream = await original(opcoes);
        streams.push(stream);
        return stream;
      };
    });
    await page.goto(`${baseURL}/preview/sala-call?convidado=1`);
    await expect(page.getByText('Você entrará com câmera e microfone desligados.')).toBeVisible();
    expect(
      await page.evaluate(
        () => (window as unknown as { streamsTeste: MediaStream[] }).streamsTeste.length,
      ),
    ).toBe(0);
    await page.getByRole('button', { name: 'Testar câmera e microfone' }).click();
    await expect(
      page.getByRole('button', { name: 'Desligar câmera', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('button', { name: 'Desligar microfone', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    const video = page.locator('video[aria-label="Sua prévia de câmera"]');
    await expect
      .poll(() => video.evaluate((el: HTMLVideoElement) => el.videoWidth))
      .toBeGreaterThan(0);
    await expect(page.getByText('Microfone captando sua voz', { exact: true })).toBeVisible();
    await page.getByText('Escolher dispositivos', { exact: true }).click();
    await expect(
      page.getByRole('combobox', { name: 'Câmera', exact: true }).locator('option'),
    ).not.toHaveCount(1);
    const auditoria = await new AxeBuilder({ page }).analyze();
    expect(
      auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
    ).toEqual([]);
    await page.screenshot({ path: info.outputPath('previa-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: info.outputPath('previa-mobile.png'), fullPage: true });
    expect(chamadas).toEqual([]);
    await page.getByRole('button', { name: 'Desligar câmera', exact: true }).click();
    await expect(video).toBeHidden();
    await page.getByRole('button', { name: 'Desligar microfone', exact: true }).click();
    expect(
      await page.evaluate(() =>
        (window as unknown as { streamsTeste: MediaStream[] }).streamsTeste.every((s) =>
          s.getTracks().every((t) => t.readyState === 'ended'),
        ),
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Ativar câmera', exact: true }).click();
    await expect(video).toBeVisible();
    // Falha de token não pode deixar a prévia com uma imagem congelada nem a câmera aberta.
    await page.route('**/api/calls/token', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ erro: 'Não foi possível abrir a sala. Tente novamente.' }),
      }),
    );
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Entrar na reunião' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Tente novamente');
    await expect(video).toBeHidden();
    expect(
      await page.evaluate(() =>
        (window as unknown as { streamsTeste: MediaStream[] }).streamsTeste.every((s) =>
          s.getTracks().every((t) => t.readyState === 'ended'),
        ),
      ),
    ).toBe(true);
  } finally {
    await browser.close();
  }
});
