import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

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

async function abrirConversaLonga(page: Page, papel = 'convidado') {
  await page.goto(`/preview/roteiro-sala?chat=leitura&papel=${papel}`);
  await page.getByRole('button', { name: 'Simular mensagens' }).click();
  const abrir = page.getByRole('button', { name: 'Mensagens da reunião', exact: true });
  await abrir.click();
  const chat = page.getByRole('region', { name: 'Mensagens da reunião' });
  const lista = chat.getByRole('log');
  const campo = chat.getByRole('textbox');
  await expect
    .poll(() => lista.evaluate((e) => e.scrollHeight - e.clientHeight - e.scrollTop))
    .toBeLessThanOrEqual(32);
  return { abrir, chat, lista, campo };
}
async function receberMensagem(page: Page) {
  // Evento remoto via SDK: não é um clique do participante, não move foco nem a página.
  await page.getByRole('button', { name: 'Receber mensagem simulada' }).dispatchEvent('click');
}

for (const papel of ['anfitriao', 'convidado']) {
  test(`${papel} lê mensagens antigas sem saltos e retorna às recentes por teclado`, async ({
    page,
  }, info) => {
    const erros: string[] = [];
    const escritas: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    page.on('request', (r) => {
      if (r.method() === 'POST') escritas.push(r.url());
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        configurable: true,
        value: () => {
          throw new Error('Ler mensagens não deve ativar câmera ou microfone');
        },
      });
    });
    const { chat, lista, campo } = await abrirConversaLonga(page, papel);
    await lista.evaluate((e) => {
      e.scrollTop = 180;
    });
    await expect(chat.getByRole('button', { name: 'Ver recentes' })).toBeVisible();
    await campo.fill('Rascunho da próxima pergunta');
    const posicao = await lista.evaluate((e) => e.scrollTop);
    await receberMensagem(page);
    await receberMensagem(page);
    const recentes = chat.getByRole('button', { name: '2 novas mensagens', exact: true });
    await expect(recentes).toBeVisible();
    expect(await lista.evaluate((e) => e.scrollTop)).toBeCloseTo(posicao, 0);
    await expect(campo).toBeFocused();
    await expect(campo).toHaveValue('Rascunho da próxima pergunta');
    await expect(lista).toHaveAttribute('aria-live', 'off');
    expect((await recentes.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(
      await recentes.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(15);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath(`leitura-${papel}.png`), fullPage: true });
    await recentes.focus();
    await page.keyboard.press('Enter');
    await expect(lista).toBeFocused();
    await expect(recentes).toBeHidden();
    await expect(lista).toHaveAttribute('aria-live', 'polite');
    await receberMensagem(page);
    await expect(lista.getByText('Mensagem nova 3.', { exact: false })).toBeInViewport();
    await expect
      .poll(() => lista.evaluate((e) => e.scrollHeight - e.clientHeight - e.scrollTop))
      .toBeLessThanOrEqual(32);
    await expect(campo).toHaveValue('Rascunho da próxima pergunta');
    await expect(page.getByRole('main')).toHaveAttribute('data-saidas', '0');
    await expect(page.getByRole('main')).toHaveAttribute('data-encerramentos', '0');
    expect(erros).toEqual([]);
    expect(escritas).toEqual([]);
  });
}

test('fechar e reabrir preserva leitura, rascunho e mensagens ainda não vistas', async ({
  page,
}) => {
  const { abrir, chat, lista, campo } = await abrirConversaLonga(page);
  await lista.evaluate((e) => {
    e.scrollTop = 240;
  });
  await expect(chat.getByRole('button', { name: 'Ver recentes' })).toBeVisible();
  await campo.fill('Volto a esta mensagem');
  const posicao = await lista.evaluate((e) => e.scrollTop);
  await receberMensagem(page);
  await expect(chat.getByRole('button', { name: '1 nova mensagem', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(abrir).toBeFocused();
  await expect(abrir).toContainText('1');
  await receberMensagem(page);
  await expect(abrir).toContainText('2');
  await expect(abrir).toHaveAccessibleDescription('2 mensagens não lidas');
  await abrir.click();
  await expect(chat.getByRole('button', { name: '2 novas mensagens', exact: true })).toBeVisible();
  expect(await lista.evaluate((e) => e.scrollTop)).toBeCloseTo(posicao, 0);
  await expect(campo).toHaveValue('Volto a esta mensagem');
  // Chegar ao fim por rolagem também considera as mensagens vistas, sem exigir um clique.
  await lista.evaluate((e) => {
    e.scrollTop = e.scrollHeight;
  });
  await expect(chat.getByRole('button', { name: '2 novas mensagens', exact: true })).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(abrir).toHaveAccessibleDescription('');
});

test('redimensionar mantém o comportamento de leitura sem cortar os controles', async ({
  page,
}) => {
  const { chat, lista, campo } = await abrirConversaLonga(page);
  await page.setViewportSize({ width: 820, height: 680 });
  await expect
    .poll(() => lista.evaluate((e) => e.scrollHeight - e.clientHeight - e.scrollTop))
    .toBeLessThanOrEqual(32);
  await lista.evaluate((e) => {
    e.scrollTop = 150;
  });
  await expect(chat.getByRole('button', { name: 'Ver recentes' })).toBeVisible();
  const posicao = await lista.evaluate((e) => e.scrollTop);
  await page.setViewportSize({ width: 820, height: 580 });
  await receberMensagem(page);
  await expect(chat.getByRole('button', { name: '1 nova mensagem', exact: true })).toBeVisible();
  expect(await lista.evaluate((e) => e.scrollTop)).toBeCloseTo(posicao, 0);
  await expect(campo).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Sair da reunião', exact: true })).toBeInViewport();
});

test('aviso é legível em 320px, contraste forçado e movimento reduzido', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const { chat, lista, campo } = await abrirConversaLonga(page);
  await lista.evaluate((e) => {
    e.scrollTop = 100;
  });
  const recentes = chat.getByRole('button', { name: 'Ver recentes' });
  await expect(recentes).toBeVisible();
  await page.screenshot({ path: info.outputPath('leitura-320.png'), fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await campo.focus();
  await page.keyboard.press('Shift+Tab');
  // WebKit móvel navega campos de texto por Tab; verifica também o foco explícito do controle.
  await recentes.focus();
  await expect(recentes).toBeFocused();
  expect(await recentes.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
  expect(
    await recentes.evaluate((e) => parseFloat(getComputedStyle(e).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);
  for (const item of [recentes, campo, chat.getByRole('button', { name: 'Enviar mensagem' })]) {
    expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(item).toBeInViewport();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await chat.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('leitura-320-contraste.png'), fullPage: true });
});
