import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

// Sessão sintética só na rota de preview. Toda chamada ao Supabase é interceptada.
const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
const conta = '11111111-1111-4111-8111-111111111111';
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
test.beforeEach(async ({ page, context, baseURL }) => {
  await context.addCookies([
    {
      name: `sb-${host.split('.')[0]}-auth-token`,
      value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
      url: baseURL!,
      sameSite: 'Lax',
    },
  ]);
  await page.route(`https://${host}/**`, (route) =>
    route.fulfill({ status: 503, json: { message: 'Chamada não esperada no teste' } }),
  );
  // Não gerar IA real nem navegar para a conversa sintética autenticada.
  await page.route('**/api/consultor/responder**', (route) =>
    route.fulfill({ status: 401, json: { erro: 'Sessão do teste' } }),
  );
});

for (const salvo of [true, false]) {
  test(`primeiro texto com confirmação perdida ${salvo ? 'após' : 'antes do'} salvamento`, async ({
    page,
  }) => {
    type Pedido = { p_thread: string; p_mensagem: string; p_conteudo: string; p_nova: boolean };
    const pedidos: Pedido[] = [];
    let consultas = 0;
    await page.route('**/rest/v1/rpc/sobral_confirmar_texto', async (route) => {
      const body = route.request().postDataJSON() as Pedido;
      pedidos.push(body);
      if (pedidos.length === 1) return route.abort('failed');
      return route.fulfill({ json: body.p_mensagem });
    });
    await page.route('**/rest/v1/consultor_mensagens**', async (route) => {
      consultas++;
      const p = pedidos[0]!;
      await new Promise((r) => setTimeout(r, 350));
      return route.fulfill({
        json: salvo
          ? [
              {
                id: p.p_mensagem,
                thread_id: p.p_thread,
                papel: 'usuario',
                conteudo: p.p_conteudo,
                consultor_anexos: [],
              },
            ]
          : [],
      });
    });
    await page.goto('/preview/consultor');
    await page.getByRole('button', { name: 'Priorizar uma venda' }).click();
    await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled();
    const texto = 'Como preparo a primeira proposta para uma clínica?';
    await page.getByRole('textbox').fill(texto);
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    const conferir = page.getByRole('button', { name: 'Conferir envio' });
    await expect(conferir).toBeVisible();
    await expect(page.getByText(texto, { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { includeHidden: true })).toBeDisabled();
    await expect(page.getByRole('list', { name: 'Exemplos de perguntas' })).toBeHidden();
    // Ação e pergunta dentro da área útil, não escondidas atrás do compositor.
    await expect
      .poll(async () => {
        const b = await conferir.boundingBox();
        const c = await page.locator('[data-leitura-conversa]').boundingBox();
        return Boolean(b && c && b.y >= c.y && b.y + b.height <= c.y + c.height);
      })
      .toBe(true);
    await page.screenshot({ path: test.info().outputPath('primeiro-envio-recuperacao.png') });
    const axe = await new AxeBuilder({ page })
      .include('[data-ajuda-falha]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
    await conferir.click();
    await expect(page.getByRole('status').filter({ hasText: 'Conferindo envio' })).toBeVisible();
    if (!salvo) {
      await page.getByRole('button', { name: 'Retomar envio' }).click();
      expect(pedidos).toHaveLength(2);
      expect(pedidos[0]).toEqual(pedidos[1]);
    }
    await expect(page.getByRole('button', { name: 'Verificar resposta' })).toBeVisible();
    expect(pedidos).toHaveLength(salvo ? 1 : 2);
    expect(consultas).toBe(1);
    expect(pedidos[0]?.p_nova).toBe(true);
  });
}
