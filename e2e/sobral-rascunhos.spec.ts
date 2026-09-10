import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
const conta = '11111111-1111-4111-8111-111111111111';
test.beforeEach(async ({ page }) => {
  await page.route(`https://${host}/**`, (route) => route.abort('failed'));
  await page.route('**/api/consultor/responder**', (route) =>
    route.fulfill({ status: 401, json: { erro: 'IA bloqueada no teste' } }),
  );
});
test('fecha a aba, volta e retoma o texto sem envio automático', async ({ page, context }) => {
  const pedidos: string[] = [];
  context.on('request', (r) => {
    if (r.method() === 'POST') pedidos.push(r.url());
  });
  await page.goto('/preview/consultor');
  await page.getByRole('textbox').fill('Como preparo a proposta desta clínica?');
  await expect(page.getByText('Texto salvo neste navegador.')).toBeVisible();
  await page.close();
  const volta = await context.newPage();
  await volta.goto('/preview/consultor');
  await expect(volta.getByRole('textbox')).toHaveValue('');
  await volta.getByRole('button', { name: 'Retomar rascunho' }).click();
  await expect(volta.getByRole('textbox')).toHaveValue('Como preparo a proposta desta clínica?');
  await expect(volta.getByText('Rascunho recuperado.')).toBeVisible();
  expect(pedidos).toEqual([]);
  const axe = await new AxeBuilder({ page: volta })
    .include('[data-rascunho-sobral]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(axe.violations).toEqual([]);
  await volta.screenshot({ path: test.info().outputPath('rascunho-recuperado.png') });
});
test('aviso e ações cabem a 320px; descartar não envia nem volta após recarregar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/preview/consultor');
  await page.getByRole('textbox').fill('Ainda estou pensando');
  await page.reload();
  const retomar = page.getByRole('button', { name: 'Retomar rascunho' });
  await expect(retomar).toBeInViewport();
  const enviar = page.getByRole('button', { name: 'Enviar mensagem', exact: true });
  const caixa = await enviar.boundingBox();
  expect(caixa && caixa.y + caixa.height).toBeLessThanOrEqual(700);
  // Viewport não basta: overflow:hidden do compositor também pode cortar o botão.
  await expect
    .poll(async () =>
      enviar.evaluate((el) => {
        const b = el.getBoundingClientRect();
        const form = el.closest('form')!.getBoundingClientRect();
        return b.bottom <= form.bottom && b.top >= form.top;
      }),
    )
    .toBe(true);
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(largura).toBeLessThanOrEqual(320);
  await page.screenshot({ path: test.info().outputPath('rascunho-320.png') });
  await page.getByRole('button', { name: 'Descartar rascunho' }).click();
  await page.reload();
  await expect(retomar).toHaveCount(0);
});
test('rascunhos de duas abas não se sobrescrevem', async ({ page, context }) => {
  await page.goto('/preview/consultor');
  const outra = await context.newPage();
  await outra.goto('/preview/consultor');
  await page.getByRole('textbox').fill('Primeiro assunto');
  await outra.getByRole('textbox').fill('Segundo assunto');
  await expect(page.getByRole('textbox')).toHaveValue('Primeiro assunto');
  await expect(outra.getByRole('textbox')).toHaveValue('Segundo assunto');
  await page.reload();
  await page.getByRole('button', { name: 'Retomar rascunho' }).click();
  await expect(page.getByRole('textbox')).toHaveValue('Segundo assunto');
  const textos = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith('subido:sobral:rascunho:v1:'))
      .map((k) => JSON.parse(localStorage.getItem(k)!).texto),
  );
  expect(textos.sort()).toEqual(['Primeiro assunto', 'Segundo assunto']);
});
test('storage bloqueado mantém edição e informa a limitação', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('bloqueado', 'QuotaExceededError');
    };
  });
  await page.goto('/preview/consultor');
  await page.getByRole('textbox').fill('Minha pergunta');
  await expect(
    page.getByText('Não foi possível guardar o rascunho. Mantenha esta aba aberta.'),
  ).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveValue('Minha pergunta');
  await expect(page.getByRole('button', { name: 'Enviar mensagem', exact: true })).toBeEnabled();
});
test('envio incerto sobrevive ao reload e retoma com os mesmos IDs', async ({
  page,
  context,
  baseURL,
}) => {
  const session = {
    access_token: 'jwt-sintetico-sem-acesso',
    refresh_token: 'sem-acesso',
    token_type: 'bearer',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    user: {
      id: conta,
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
    },
  };
  await context.addCookies([
    {
      name: `sb-${host.split('.')[0]}-auth-token`,
      value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
      url: baseURL!,
      sameSite: 'Lax',
    },
  ]);
  const pedidos: unknown[] = [];
  await page.route('**/rest/v1/rpc/sobral_confirmar_texto', async (route) => {
    const p = route.request().postDataJSON() as { p_mensagem: string };
    pedidos.push(p);
    if (pedidos.length === 1) return route.abort('failed');
    return route.fulfill({ json: p.p_mensagem });
  });
  await page.route('**/rest/v1/consultor_mensagens**', (route) => route.fulfill({ json: [] }));
  await page.goto('/preview/consultor');
  await page.getByRole('textbox').fill('Pergunta que não deve ser duplicada');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Conferir envio' })).toBeVisible();
  await expect(
    page.getByText('Você pode sair e retomar esta pergunta neste navegador.'),
  ).toBeVisible();
  await page.reload();
  expect(pedidos).toHaveLength(1);
  await page.getByRole('button', { name: 'Retomar pergunta' }).click();
  await expect(page.getByRole('textbox', { includeHidden: true })).toBeDisabled();
  expect(pedidos).toHaveLength(1);
  await page.getByRole('button', { name: 'Conferir envio' }).click();
  await page.getByRole('button', { name: 'Retomar envio' }).click();
  await expect(page.getByRole('button', { name: 'Verificar resposta' })).toBeVisible();
  expect(pedidos).toHaveLength(2);
  expect(pedidos[0]).toEqual(pedidos[1]);
});
