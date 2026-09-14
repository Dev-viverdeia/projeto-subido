import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const simular = (page: Page, nome: string) =>
  page.getByRole('button', { name: nome, exact: true, includeHidden: true }).dispatchEvent('click');
async function abrir(page: Page, papel = 'convidado') {
  await page.goto(`/preview/retomada-reuniao?papel=${papel}`);
  await page.getByRole('button', { name: 'Abrir demonstração' }).click();
  await page.getByRole('button', { name: 'Mensagens da reunião', exact: true }).click();
  await page.getByRole('textbox').fill('Revisar o escopo\nConfirmar o prazo');
}

for (const papel of ['anfitriao', 'convidado']) {
  test(`${papel} retoma rascunho e painel sem enviar nem abrir mídia`, async ({ page }, info) => {
    const posts: string[] = [];
    const erros: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST') posts.push(r.url());
    });
    page.on('pageerror', (e) => erros.push(e.message));
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        configurable: true,
        value: () => {
          throw new Error('Não solicitar mídia');
        },
      });
    });
    await abrir(page, papel);
    await simular(page, 'Simular queda');
    const heading = page.getByRole('heading', { name: 'Reconectando à reunião' });
    await expect(heading).toBeFocused();
    await expect(page.getByText('Rascunho mantido nesta aba')).toBeVisible();
    await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-pedidos', '1');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath(`retomando-${papel}.png`), fullPage: true });
    await simular(page, 'Concluir retomada');
    await expect(page.getByRole('textbox')).toHaveValue('Revisar o escopo\nConfirmar o prazo');
    await expect(page.getByTestId('transporte-chat')).toHaveAttribute('data-tentativas', '0');
    await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-tentativa', '0');
    await page.screenshot({ path: info.outputPath(`retomada-${papel}.png`), fullPage: true });
    expect(posts).toEqual([]);
    expect(erros).toEqual([]);
  });
}

test('offline pausa pedidos e retoma sem recarregar quando a rede volta', async ({
  page,
  context,
}, info) => {
  await abrir(page);
  await context.setOffline(true);
  await simular(page, 'Simular queda');
  await expect(page.getByRole('heading', { name: 'Você está sem internet' })).toBeVisible();
  await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-pedidos', '0');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('sem-internet.png'), fullPage: true });
  await context.setOffline(false);
  await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-pedidos', '1');
  await simular(page, 'Concluir retomada');
  await expect(page.getByRole('textbox')).toHaveValue('Revisar o escopo\nConfirmar o prazo');
});

test('falha limitada oferece nova tentativa com texto legível em 320px', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await abrir(page);
  await simular(page, 'Falhar tentativas');
  await simular(page, 'Simular queda');
  await expect(page.getByRole('heading', { name: 'Não foi possível reconectar' })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-pedidos', '3');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const tentar = page.getByRole('button', { name: 'Tentar novamente', exact: true });
  expect((await tentar.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('falha-320.png'), fullPage: true });
  await simular(page, 'Concluir retomada');
  await tentar.click();
  await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-pedidos', '4');
  await simular(page, 'Concluir retomada');
  await expect(page.getByRole('textbox')).toHaveValue('Revisar o escopo\nConfirmar o prazo');
});

test('envio interrompido mantém texto e não reenvia sozinho', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Enviando mensagem' })).toBeVisible();
  await simular(page, 'Simular queda');
  await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-pedidos', '1');
  await simular(page, 'Concluir retomada');
  await expect(page.getByRole('textbox')).toHaveValue('Revisar o escopo\nConfirmar o prazo');
  await expect(page.getByRole('alert').filter({ hasText: 'Envio interrompido.' })).toHaveText(
    'Envio interrompido. Confira com os participantes antes de reenviar.',
  );
  await expect(page.getByTestId('transporte-chat')).toHaveAttribute('data-tentativas', '0');
});

test('sair cancela retomada e retorno tardio não reabre sala nem recupera texto descartado', async ({
  page,
}) => {
  await abrir(page);
  await simular(page, 'Simular queda');
  await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-pedidos', '1');
  await page.getByRole('button', { name: 'Sair da reunião' }).click();
  await simular(page, 'Concluir retomada');
  await expect(
    page.getByRole('button', { name: 'Entrar novamente na demonstração' }),
  ).toBeVisible();
  await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-encerramentos', '0');
  await page.getByRole('button', { name: 'Entrar novamente na demonstração' }).click();
  await page.getByRole('button', { name: 'Mensagens da reunião', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveValue('');
});

test('anfitrião pode escolher sair sem reconectar por trás do modal', async ({
  page,
  context,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await abrir(page, 'anfitriao');
  await context.setOffline(true);
  await simular(page, 'Simular queda');
  await page.getByRole('button', { name: 'Sair da reunião' }).click();
  await context.setOffline(false);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-pedidos', '0');
  await page.screenshot({ path: info.outputPath('saida-na-retomada.png'), fullPage: true });
  await page.getByRole('button', { name: 'Sair da sala', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Entrar novamente na demonstração' }),
  ).toBeVisible();
  await expect(page.getByTestId('controle-retomada')).toHaveAttribute('data-encerramentos', '0');
});
