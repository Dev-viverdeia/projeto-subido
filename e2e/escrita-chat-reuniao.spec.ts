import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function abrirChat(page: Page, papel = 'convidado') {
  await page.goto(`/preview/roteiro-sala?chat=leitura&envio=teste&papel=${papel}`);
  await page.getByRole('button', { name: 'Simular mensagens' }).click();
  const abrir = page.getByRole('button', { name: 'Mensagens da reunião', exact: true });
  await abrir.click();
  const chat = page.getByRole('region', { name: 'Mensagens da reunião' });
  return {
    abrir,
    chat,
    campo: chat.getByRole('textbox'),
    lista: chat.getByRole('log'),
    transporte: page.getByTestId('transporte-chat'),
  };
}

async function resposta(page: Page, falhar = false) {
  // Resposta do transporte, não uma ação do participante. Não desloca o foco.
  await page
    .getByRole('button', {
      name: falhar ? 'Falhar envio simulado' : 'Concluir envio simulado',
      includeHidden: true,
    })
    .dispatchEvent('click');
}

for (const papel of ['anfitriao', 'convidado']) {
  test(`${papel} escreve em várias linhas e envia uma única vez com retorno claro`, async ({
    page,
    isMobile,
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
        writable: true,
        value: () => {
          throw new Error('Escrever mensagem não deve solicitar mídia');
        },
      });
    });
    const { chat, campo, lista, transporte } = await abrirChat(page, papel);
    const inicial = (await campo.boundingBox())!.height;
    await campo.fill('Combinado para o projeto:');
    await campo.press(isMobile ? 'Enter' : 'Shift+Enter');
    await campo.pressSequentially('Revisar o escopo');
    await campo.press('Shift+Enter');
    await campo.pressSequentially('Confirmar o prazo');
    const texto = 'Combinado para o projeto:\nRevisar o escopo\nConfirmar o prazo';
    await expect(campo).toHaveValue(texto);
    await expect(transporte).toHaveAttribute('data-tentativas', '0');
    expect((await campo.boundingBox())!.height).toBeGreaterThan(inicial);
    await expect(chat.getByRole('button', { name: 'Ver recentes' })).toBeHidden();
    await expect
      .poll(() => lista.evaluate((e) => e.scrollHeight - e.clientHeight - e.scrollTop))
      .toBeLessThanOrEqual(32);
    await page.screenshot({ path: info.outputPath(`escrita-${papel}.png`), fullPage: true });
    if (isMobile) await chat.getByRole('button', { name: 'Enviar mensagem' }).click();
    else await campo.press('Enter');
    const enviar = chat.getByRole('button', { name: 'Enviando mensagem' });
    await expect(enviar).toHaveAttribute('aria-disabled', 'true');
    await expect(campo).toHaveAttribute('readonly', '');
    await expect(chat.getByRole('form').getByRole('status')).toContainText('Enviando…');
    await chat.getByRole('form').dispatchEvent('submit');
    await chat.getByRole('form').dispatchEvent('submit');
    await expect(transporte).toHaveAttribute('data-tentativas', '1');
    await expect(campo).toHaveValue(texto);
    await resposta(page);
    await expect(campo).toHaveValue('');
    await expect(chat.getByRole('form').getByRole('status')).toContainText('Enviada');
    await expect(lista.getByText(texto, { exact: true })).toHaveCount(1);
    await expect(lista.getByText(texto, { exact: true })).toBeInViewport();
    expect((await campo.boundingBox())!.height).toBeLessThanOrEqual(inicial + 1);
    // Safari no toque não foca botões. No teclado, a escrita continua sem novo clique.
    if (!isMobile) await expect(campo).toBeFocused();
    expect(
      await lista.getByText(texto, { exact: true }).evaluate((e) => getComputedStyle(e).whiteSpace),
    ).toBe('pre-wrap');
    await expect(page.getByRole('main')).toHaveAttribute('data-saidas', '0');
    await expect(page.getByRole('main')).toHaveAttribute('data-encerramentos', '0');
    expect(erros).toEqual([]);
    expect(escritas).toEqual([]);
  });
}

test('falha preserva o texto e permite revisar antes de tentar novamente', async ({
  page,
}, info) => {
  const { chat, campo, lista, transporte } = await abrirChat(page);
  await campo.fill('O prazo será de três semanas.');
  await chat.getByRole('button', { name: 'Enviar mensagem' }).click();
  await resposta(page, true);
  await expect(chat.getByRole('alert')).toHaveText('A mensagem não foi enviada. Tente novamente.');
  await expect(campo).toHaveValue('O prazo será de três semanas.');
  await expect(chat.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  await expect(transporte).toHaveAttribute('data-tentativas', '1');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('falha-envio.png'), fullPage: true });
  await campo.fill('O prazo será de quatro semanas.');
  await expect(chat.getByRole('alert')).toHaveCount(0);
  await chat.getByRole('button', { name: 'Enviar mensagem' }).click();
  await resposta(page);
  await expect(lista.getByText('O prazo será de quatro semanas.', { exact: true })).toBeVisible();
  await expect(lista.getByText('O prazo será de três semanas.', { exact: true })).toHaveCount(0);
  await expect(transporte).toHaveAttribute('data-tentativas', '2');
});

test('fechar durante o envio não perde rascunho nem toma foco de outro controle', async ({
  page,
}) => {
  const { abrir, chat, campo, transporte } = await abrirChat(page);
  await campo.fill('Envio o material após a conversa.');
  await chat.getByRole('button', { name: 'Enviar mensagem' }).click();
  await chat.getByRole('button', { name: 'Fechar mensagens' }).click();
  await expect(abrir).toBeFocused();
  await resposta(page, true);
  await expect(abrir).toBeFocused();
  await abrir.click();
  await expect(campo).toHaveValue('Envio o material após a conversa.');
  await chat.getByRole('button', { name: 'Tentar novamente' }).click();
  await chat.getByRole('button', { name: 'Fechar mensagens' }).click();
  await resposta(page);
  await expect(abrir).toBeFocused();
  await abrir.click();
  await expect(campo).toHaveValue('');
  await expect(
    chat.getByRole('log').getByText('Envio o material após a conversa.', { exact: true }),
  ).toHaveCount(1);
  await expect(transporte).toHaveAttribute('data-tentativas', '2');
});

test('mensagem longa não é cortada e o limite impede o envio sem apagar o texto', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const { chat, campo, transporte } = await abrirChat(page);
  const texto = 'Revisar escopo. '.repeat(140);
  await campo.fill(texto);
  await expect(campo).toHaveValue(texto);
  await expect(campo).toHaveAttribute('aria-invalid', 'true');
  await expect(chat.getByRole('alert')).toHaveText('Use até 2.000 caracteres.');
  await expect(chat.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled();
  await chat.getByRole('form').dispatchEvent('submit');
  await expect(transporte).toHaveAttribute('data-tentativas', '0');
  expect(await chat.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  await campo.fill(texto.slice(0, 2000));
  await expect(chat.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled();
  await chat.getByRole('button', { name: 'Enviar mensagem' }).click();
  await resposta(page);
  await expect(campo).toHaveValue('');
});

test('campo cresce sem puxar a leitura e cabe em telas estreitas e baixas', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const { chat, campo, lista } = await abrirChat(page);
  await lista.evaluate((e) => {
    e.scrollTop = 180;
  });
  await expect(chat.getByRole('button', { name: 'Ver recentes' })).toBeVisible();
  const posicao = await lista.evaluate((e) => e.scrollTop);
  await campo.fill(
    'Primeiro ponto\nSegundo ponto\nTerceiro ponto\nQuarto ponto\nQuinto ponto\nSexto ponto\nSétimo ponto',
  );
  expect(await lista.evaluate((e) => e.scrollTop)).toBeCloseTo(posicao, 0);
  expect((await campo.boundingBox())!.height).toBeLessThanOrEqual(144);
  expect(await campo.evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
  expect(
    await campo.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBeGreaterThanOrEqual(17);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('escrita-320.png'), fullPage: true });
  await page.setViewportSize({ width: 640, height: 420 });
  await expect(campo).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Sair da reunião', exact: true })).toBeInViewport();
  expect((await lista.boundingBox())!.height).toBeGreaterThan(70);
  for (const controle of [campo, chat.getByRole('button', { name: 'Enviar mensagem' })]) {
    expect((await controle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('escrita-baixa.png'), fullPage: true });
});

test('composição de teclado não envia antes da hora e foco funciona sem animação', async ({
  page,
  isMobile,
}, info) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const { chat, campo, transporte } = await abrirChat(page);
  await campo.fill('Confirmação de escopo');
  await campo.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await expect(transporte).toHaveAttribute('data-tentativas', '0');
  await campo.press('Shift+Enter');
  await expect(campo).toHaveValue('Confirmação de escopo\n');
  await campo.press('Tab');
  const enviar = chat.getByRole('button', { name: 'Enviar mensagem' });
  // Safari em modo toque não percorre botões com Tab sem acesso completo pelo teclado.
  if (isMobile) await enviar.focus();
  await expect(enviar).toBeFocused();
  expect(await enviar.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
  await enviar.press('Enter');
  await expect(transporte).toHaveAttribute('data-tentativas', '1');
  const icone = chat.getByRole('button', { name: 'Enviando mensagem' }).locator('svg');
  expect(await icone.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await page.screenshot({ path: info.outputPath('escrita-contraste.png'), fullPage: true });
  await resposta(page);
});
