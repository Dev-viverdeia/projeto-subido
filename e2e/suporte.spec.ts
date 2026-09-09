import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('central: busca, FAQ, teclado e botões no primeiro carregamento', async ({ page }) => {
  await page.goto('/preview/suporte');
  const acao = page.getByRole('link', { name: 'Pedir ajuda', exact: true });
  await expect(acao).toBeVisible();
  expect(await acao.evaluate((el) => getComputedStyle(el).backgroundImage)).not.toBe('none');
  await page.getByLabel('Buscar nos guias').fill('agenda');
  await expect(page.getByRole('link', { name: /Conectar o Google Agenda/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Compartilhar um certificado/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpar busca' }).click();
  const faq = page.locator('summary').filter({ hasText: 'O suporte consome meus créditos?' });
  await faq.focus();
  await page.keyboard.press('Enter');
  await expect(faq.locator('..')).toHaveAttribute('open', '');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
test('pedido preserva o texto em falha e permite tentar de novo', async ({ page }) => {
  let tentativas = 0;
  await page.route('**/api/suporte/publico', async (route) => {
    tentativas++;
    await route.fulfill({
      status: tentativas === 1 ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        tentativas === 1 ? { erro: 'Não foi possível enviar agora.' } : { ok: true },
      ),
    });
  });
  await page.goto('/preview/suporte?tela=pedido');
  await page.getByLabel('Seu e-mail', { exact: true }).fill('qa@example.invalid');
  await page.getByLabel('O que você precisa resolver?').fill('Minha conta');
  const descricao = page.getByLabel('Descreva o que aconteceu');
  await descricao.fill('Não consigo entrar na conta com meu e-mail.');
  await page.getByRole('button', { name: 'Receber link por e-mail' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível enviar agora.' }),
  ).toBeVisible();
  await expect(descricao).toHaveValue('Não consigo entrar na conta com meu e-mail.');
  await page.getByRole('button', { name: 'Receber link por e-mail' }).click();
  await expect(page.getByRole('heading', { name: 'Confira seu e-mail' })).toBeVisible();
});
test('IA mostra fontes e transfere contexto apenas para revisão', async ({ page }) => {
  await page.route('**/api/suporte/ia', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        resposta: 'Sim, você pode criar uma proposta sem reunião.',
        fontes: ['criar-proposta-sem-reuniao'],
        encaminhar: true,
      }),
    }),
  );
  await page.goto('/preview/suporte?tela=ia');
  await page.getByLabel('Sua pergunta').fill('Posso criar proposta sem reunião?');
  await page.getByRole('button', { name: 'Perguntar', exact: true }).click();
  await expect(
    page.getByText('Sim, você pode criar uma proposta sem reunião.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Criar uma proposta sem reunião' })).toHaveAttribute(
    'href',
    '/ajuda/criar-proposta-sem-reuniao',
  );
  await page.getByRole('button', { name: 'Levar dúvida à equipe' }).click();
  await expect(page).toHaveURL(/\/ajuda\/acesso$/);
  await expect(page.getByLabel('Descreva o que aconteceu')).toHaveValue(
    /Minha dúvida: Posso criar proposta sem reunião/,
  );
  await expect(page.getByRole('button', { name: 'Receber link por e-mail' })).toBeVisible();
});
test('conversa legível sem barra horizontal ou alteração de dados na demonstração', async ({
  page,
}) => {
  await page.goto('/preview/suporte?tela=conversa');
  await expect(
    page.getByRole('heading', { name: 'Ajuda para conectar minha agenda' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Marcar como resolvido' }).click();
  await expect(page.getByRole('status')).toContainText('nenhum dado foi alterado');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});

test('rascunho de nota interna fica separado da resposta pública, inclusive após recarregar', async ({
  page,
}) => {
  await page.goto('/preview/suporte?tela=equipe');
  await page.getByLabel('Sua mensagem', { exact: true }).fill('Resposta para o cliente.');
  await page.getByRole('button', { name: 'Nota interna', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nota interna' })).toHaveValue('');
  await page.getByRole('textbox', { name: 'Nota interna' }).fill('Informação só para a equipe.');
  await page.getByRole('button', { name: 'Responder ao cliente' }).click();
  await expect(page.getByLabel('Sua mensagem', { exact: true })).toHaveValue(
    'Resposta para o cliente.',
  );
  await page.reload();
  await expect(page.getByLabel('Sua mensagem', { exact: true })).toHaveValue(
    'Resposta para o cliente.',
  );
  await page.getByRole('button', { name: 'Nota interna', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nota interna' })).toHaveValue(
    'Informação só para a equipe.',
  );
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
test('pedido recupera título, relato e e-mail sem perder campos após reload', async ({ page }) => {
  await page.goto('/preview/suporte?tela=pedido');
  await page.getByLabel('Seu e-mail', { exact: true }).fill('qa@example.invalid');
  await page.getByLabel('O que você precisa resolver?').fill('Agenda não conecta');
  await page
    .getByLabel('Descreva o que aconteceu')
    .fill('Voltei do Google e não consegui conectar.');
  await page.reload();
  await expect(page.getByLabel('Seu e-mail', { exact: true })).toHaveValue('qa@example.invalid');
  await expect(page.getByLabel('O que você precisa resolver?')).toHaveValue('Agenda não conecta');
  await expect(page.getByLabel('Descreva o que aconteceu')).toHaveValue(
    'Voltei do Google e não consegui conectar.',
  );
});
test('fila e nova resposta permanecem legíveis em larguras pequenas e grandes', async ({
  page,
}) => {
  for (const width of [375, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tela of ['fila', 'cliente']) {
      await page.goto(`/preview/suporte?tela=${tela}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  await expect(page.getByRole('link', { name: /Nova resposta/ })).toBeVisible();
});

test('central traz IA antes dos guias e permite recuperar uma busca vazia', async ({ page }) => {
  await page.goto('/preview/suporte?tela=cliente');
  const ia = page.getByRole('link', { name: /Perguntar à IA/ });
  const guia = page.getByRole('link', { name: /Entrar na sua conta/ });
  expect((await ia.boundingBox())!.y).toBeLessThan((await guia.boundingBox())!.y);
  await expect(ia).toHaveAttribute('href', '/suporte/ia');
  await page.getByLabel('Filtrar guias por área').selectOption('reunioes');
  await expect(page.getByRole('link', { name: /Conectar o Google Agenda/ })).toBeVisible();
  await expect(guia).toHaveCount(0);
  await page.getByLabel('Buscar nos guias').fill('zzzzzz');
  await expect(page.getByText('Nenhum guia encontrado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.getByLabel('Filtrar guias por área')).toHaveValue('');
  await expect(page.getByLabel('Buscar nos guias')).toHaveValue('');
  await expect(guia).toBeVisible();
  await guia.focus();
  expect(await guia.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
});

test('responder foca o campo e resolução não fica antes da conversa no celular', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/preview/suporte?tela=conversa&longo=1');
  const campo = page.getByLabel('Sua mensagem', { exact: true });
  const fim = page.getByRole('complementary', { name: 'Resolução do atendimento' });
  expect((await fim.boundingBox())!.y).toBeGreaterThan((await campo.boundingBox())!.y);
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await expect(campo).toBeFocused();
  await campo.fill('Consegui conectar minha agenda. Obrigado!');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('nenhuma mensagem foi enviada');
  await expect(campo).toHaveValue('Consegui conectar minha agenda. Obrigado!');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('atendimento resolvido oferece reabertura e avaliação acessível', async ({ page }) => {
  await page.goto('/preview/suporte?tela=conversa&estado=resolvido');
  await expect(page.getByRole('heading', { name: 'Atendimento resolvido' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reabrir atendimento' })).toBeVisible();
  const nota = page.getByRole('button', { name: 'Nota 5 de 5' });
  const box = await nota.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByLabel('Precisa de mais ajuda?')).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});

test('IA mostra a pergunta enquanto consulta e recupera rascunho em falha', async ({ page }) => {
  let liberar!: () => void;
  const espera = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  await page.route('**/api/suporte/ia', async (route) => {
    await espera;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ erro: 'Não foi possível consultar agora.' }),
    });
  });
  await page.goto('/preview/suporte?tela=ia');
  await page.getByLabel('Sua pergunta').fill('Como conecto minha agenda?');
  await page.getByRole('button', { name: 'Perguntar', exact: true }).click();
  await expect(
    page.getByRole('article').filter({ hasText: 'Como conecto minha agenda?' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Consultando os guias do Subido…');
  await expect(page.getByLabel('Sua pergunta')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Pedir ajuda à equipe' })).toBeDisabled();
  liberar();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível consultar agora.' }),
  ).toBeVisible();
  await expect(page.getByLabel('Sua pergunta')).toHaveValue('Como conecto minha agenda?');
  await expect(page.getByLabel('Sua pergunta')).toBeEnabled();
});
