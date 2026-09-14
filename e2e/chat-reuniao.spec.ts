import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const papel of ['anfitriao', 'convidado']) {
  test(`${papel} abre a proposta em outra aba sem sair da reunião`, async ({
    page,
    context,
  }, info) => {
    const externas: string[] = [];
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    page.on('request', (r) => {
      if (r.method() === 'POST' || /https:\/\/(subido\.viverdeia\.ai|exemplo\.test)/.test(r.url()))
        externas.push(r.url());
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        configurable: true,
        writable: true,
        value: () => {
          throw new Error('O chat não deve solicitar mídia');
        },
      });
    });
    const url = 'https://subido.viverdeia.ai/p/demonstracao?versao=2#escopo';
    // Destino local controlado: o teste não abre proposta ou dados reais.
    await context.route('https://subido.viverdeia.ai/p/demonstracao?versao=2', (r) =>
      r.fulfill({
        contentType: 'text/html',
        body: '<title>Proposta de exemplo</title><h1>Escopo</h1>',
      }),
    );
    await page.goto(`/preview/roteiro-sala?chat=normal&papel=${papel}`);
    await page.getByRole('button', { name: 'Simular mensagens' }).click();
    const abrir = page.getByRole('button', { name: 'Mensagens da reunião', exact: true });
    await expect(abrir).toContainText('2');
    await abrir.click();
    const chat = page.getByRole('region', { name: 'Mensagens da reunião' });
    await expect(chat.getByRole('link')).toHaveCount(2);
    expect(externas).toEqual([]);
    const campo = chat.getByRole('textbox', { name: 'Mensagem para os participantes' });
    await campo.fill('Vamos revisar o escopo juntos.');
    const link = chat.getByRole('link', { name: `${url} (abre em outra aba)` });
    await expect(link).toHaveAttribute('href', url);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await link.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`chat-${papel}.png`), fullPage: true });
    const local = page.url();
    const novaAba = page.waitForEvent('popup');
    if (papel === 'convidado') {
      await link.focus();
      await page.keyboard.press('Enter');
    } else await link.click();
    const proposta = await novaAba;
    await expect(proposta).toHaveURL(url);
    await expect(proposta.getByRole('heading', { name: 'Escopo' })).toBeVisible();
    expect(await proposta.evaluate(() => window.opener === null)).toBe(true);
    expect(await proposta.evaluate(() => document.referrer)).toBe('');
    await proposta.close();
    await page.bringToFront();
    expect(page.url()).toBe(local);
    await expect(campo).toHaveValue('Vamos revisar o escopo juntos.');
    await expect(page.getByRole('main')).toHaveAttribute('data-saidas', '0');
    await expect(page.getByRole('main')).toHaveAttribute('data-encerramentos', '0');
    await chat.getByRole('button', { name: 'Fechar mensagens' }).click();
    await expect(abrir).toBeFocused();
    if (papel === 'anfitriao')
      await expect(
        page.getByRole('complementary', { name: 'Apoio privado da reunião' }),
      ).toBeVisible();
    await abrir.click();
    await expect(campo).toHaveValue('Vamos revisar o escopo juntos.');
    await expect(chat.getByRole('link')).toHaveCount(2);
    expect(erros).toEqual([]);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('link extenso não esconde o envio ou a saída da sala em 320px', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/preview/roteiro-sala?chat=extenso');
  await page.getByRole('button', { name: 'Próxima pergunta' }).click();
  await page.getByRole('button', { name: 'Simular mensagens' }).click();
  await page.getByRole('button', { name: 'Mensagens da reunião', exact: true }).click();
  const chat = page.getByRole('region', { name: 'Mensagens da reunião' });
  const link = chat.getByRole('link').last();
  expect((await chat.boundingBox())!.height).toBeGreaterThan(740 * 0.7);
  await expect(link).toHaveAttribute('href', `https://exemplo.test/guia?token=${'a'.repeat(600)}`);
  await link.scrollIntoViewIfNeeded();
  await expect(chat.getByRole('textbox')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Sair da reunião', exact: true })).toBeInViewport();
  for (const item of [
    link,
    chat.getByRole('textbox'),
    chat.getByRole('button', { name: 'Enviar mensagem' }),
  ]) {
    expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect((await link.boundingBox())!.height).toBeLessThan(100);
  expect(
    await link.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBeGreaterThanOrEqual(17);
  expect(await link.evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/^"?geist"?[, ]/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await chat.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  expect(await chat.getByRole('log').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('chat-320.png'), fullPage: true });
  await chat.getByRole('button', { name: 'Fechar mensagens' }).click();
  await expect(page.getByText('2 de 4', { exact: true })).toBeVisible();
});

test('links mantêm foco e contraste sem movimento, e Escape retorna ao controle', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/preview/roteiro-sala?chat=normal&papel=convidado');
  await page.getByRole('button', { name: 'Simular mensagens' }).click();
  const abrir = page.getByRole('button', { name: 'Mensagens da reunião', exact: true });
  await abrir.click();
  const link = page.getByRole('link').first();
  await expect(page.getByRole('textbox', { name: 'Mensagem para os participantes' })).toBeFocused();
  await page.keyboard.press('Tab');
  await link.focus();
  await expect(link).toBeFocused();
  expect(await link.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
  // O DS aplica 0.01ms como rede global de proteção para movimento reduzido.
  expect(
    await link.evaluate((e) => parseFloat(getComputedStyle(e).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);
  await page.screenshot({ path: info.outputPath('chat-contraste.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(abrir).toBeFocused();
  await expect(page.getByRole('region', { name: 'Mensagens da reunião' })).toBeHidden();
});
