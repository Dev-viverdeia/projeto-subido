import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const recibo = {
  mensagem_id: '66666666-6666-4666-8666-666666666666',
  thread_id: '44444444-4444-4444-8444-444444444444',
  tentativa: '11111111-1111-4111-8111-111111111111',
  estado: 'concluida',
  texto: 'Resposta recuperada sem gerar novamente.',
  erro: null,
  parar_em: null,
  resposta_id: '22222222-2222-4222-8222-222222222222',
  expira_em: '2027-01-01T00:00:00Z',
};

for (const width of [320, 768]) {
  test(`recuperação acessível em ${width}px, com movimento reduzido e teclado`, async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/consultor/responder**', (route) =>
      route.fulfill({ status: 401, json: { erro: 'Faça login' } }),
    );
    await page.goto('/preview/consultor-conversa?pendente=1');
    const verificar = page.getByRole('button', { name: 'Verificar resposta' });
    await expect(verificar).toBeVisible();
    await verificar.focus();
    await expect(verificar).toBeFocused();
    // O WebKit móvel usa a preferência nativa para pular links no Tab.
    if (!isMobile) {
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: /Ver guia/ })).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    const acao = await verificar.boundingBox();
    const leitura = await page.locator('[data-leitura-conversa]').boundingBox();
    expect(acao && leitura && acao.y + acao.height <= leitura.y + leitura.height).toBe(true);
  });
}

test('Sobral recupera o recibo perdido, mantém áudio e consulta sem repetir POST', async ({
  page,
}) => {
  let posts = 0;
  let recuperar = false;
  let iniciar = false;
  await page.route('**/api/consultor/responder**', async (route) => {
    if (route.request().method() === 'POST') {
      posts++;
      return route.abort('failed');
    }
    if (!iniciar) return route.fulfill({ status: 404, json: { erro: 'Resposta não encontrada' } });
    if (!recuperar) return route.fulfill({ status: 503, json: { erro: 'Sem conexão' } });
    await new Promise((r) => setTimeout(r, 400));
    return route.fulfill({ json: { geracao: recibo } });
  });
  await page.goto('/preview/consultor-conversa?pendente=1');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  expect(posts).toBe(0);
  iniciar = true;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('button', { name: 'Verificar resposta' })).toBeVisible();
  await expect(
    page.getByText('O que eu preciso fazer agora para avançar a Clínica Aurora?', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reproduzir áudio' })).toHaveCount(1);
  const ajuda = page.getByRole('link', { name: /Pedir ajuda/ });
  await expect(ajuda).toHaveAttribute(
    'href',
    `/suporte/novo?origem=%2Fconsultor%2F${recibo.thread_id}&contexto=sobral`,
  );
  await expect(ajuda).toHaveAttribute('target', '_blank');
  await expect
    .poll(async () => {
      const acao = await page.getByRole('button', { name: 'Verificar resposta' }).boundingBox();
      const leitura = await page.locator('[data-leitura-conversa]').boundingBox();
      return (
        acao !== null && leitura !== null && acao.y + acao.height <= leitura.y + leitura.height
      );
    })
    .toBe(true);
  await page.screenshot({ path: test.info().outputPath('sobral-recuperacao.png') });
  const axe = await new AxeBuilder({ page })
    .include('[data-ajuda-falha]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(axe.violations).toEqual([]);
  recuperar = true;
  await page.getByRole('button', { name: 'Verificar resposta' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Conferindo a resposta salva' }),
  ).toBeVisible();
  await expect(page.getByText(recibo.texto, { exact: true })).toBeVisible();
  expect(posts).toBe(1);
  await expect(page.getByRole('textbox')).toBeEnabled();
});

test('reabrir conversa com sessão expirada permite login e recuperação somente por leitura', async ({
  page,
}) => {
  let logado = false;
  const metodos: string[] = [];
  await page.route('**/api/consultor/responder**', (route) => {
    metodos.push(route.request().method());
    return route.fulfill(
      logado ? { json: { geracao: recibo } } : { status: 401, json: { erro: 'Faça login' } },
    );
  });
  await page.goto('/preview/consultor-conversa?pendente=1');
  const entrar = page.getByRole('link', { name: /Entrar na conta/ });
  await expect(entrar).toHaveAttribute('target', '_blank');
  await expect(entrar).toHaveAttribute('href', '/entrar');
  logado = true;
  await page.getByRole('button', { name: 'Verificar resposta' }).click();
  await expect(page.getByText(recibo.texto, { exact: true })).toBeVisible();
  expect(metodos.every((m) => m === 'GET')).toBe(true);
});

test('enriquecimento confere uma confirmação perdida sem repetir a análise', async ({ page }) => {
  let consultas = 0;
  let posts = 0;
  await page.route('**/rest/v1/crm_enriquecimentos**', async (route) => {
    consultas++;
    return route.fulfill({
      json:
        consultas === 1
          ? []
          : [{ id: '33333333-3333-4333-8333-333333333333', status: 'concluido' }],
    });
  });
  await page.route('**/functions/v1/enriquecimento', async (route) => {
    posts++;
    return route.abort('failed');
  });
  await page.goto('/preview/crm-dossie');
  await page.getByRole('button', { name: 'Atualizar dados', exact: true }).click();
  await page.getByRole('button', { name: 'Usar 3 créditos' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Andamento da análise' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByRole('button', { name: 'Usar 3 créditos' })).toHaveCount(0);
  await dialogo.getByRole('button', { name: 'Conferir andamento' }).click();
  await expect(dialogo.getByRole('status')).toContainText('A análise está pronta');
  const axe = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(axe.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.screenshot({ path: test.info().outputPath('enriquecimento-recuperado.png') });
  await dialogo.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(dialogo).toBeHidden();
  expect(posts).toBe(1);
  expect(consultas).toBe(2);
});
