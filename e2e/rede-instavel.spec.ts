import { expect, test } from '@playwright/test';

test('Vendas mantém o card ao cair a conexão durante a mudança de etapa', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/preview/crm');
  let pedidos = 0;
  await page.route('**/preview/crm', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    pedidos++;
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.abort('internetdisconnected');
  });
  await page.getByRole('button', { name: 'Ações de Automação do atendimento' }).click();
  await page.getByRole('menuitem', { name: 'Descobrir', exact: true }).click();
  await expect(page.getByText('A alteração não foi confirmada', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Ações de Automação do atendimento' }),
  ).toBeEnabled();
  expect(pedidos).toBe(1);
  expect(erros).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('vendas-recuperada.png') });
});

test('Sobral preserva a mensagem offline e permite continuar editando', async ({
  page,
  context,
}) => {
  await page.goto('/preview/consultor');
  const campo = page.getByRole('textbox');
  await campo.fill('Como preparo a conversa com o cliente?');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Sem conexão' })).toBeVisible();
  await expect(campo).toHaveValue('Como preparo a conversa com o cliente?');
  await page.screenshot({ path: test.info().outputPath('sobral-offline.png') });
  await context.setOffline(false);
  await campo.fill('Quero revisar a proposta antes da conversa.');
  await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled();
});

test('Prospecção preserva o recorte offline sem iniciar busca', async ({ page, context }) => {
  await page.goto('/preview/prospeccao');
  await page.getByLabel('Tipo de empresa').fill('Clínicas');
  await page.getByLabel('Cidade ou região').fill('Recife');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Buscar empresas' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Sem conexão' })).toBeVisible();
  await expect(page.getByLabel('Tipo de empresa')).toHaveValue('Clínicas');
  await page.screenshot({ path: test.info().outputPath('prospeccao-offline.png') });
  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Buscar empresas' })).toBeEnabled();
});

test('Prospecção recupera os campos se a resposta da busca se perde', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/preview/prospeccao');
  let pedidos = 0;
  await page.route('**/preview/prospeccao', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    pedidos++;
    await route.abort('internetdisconnected');
  });
  await page.getByLabel('Tipo de empresa').fill('Clínicas');
  await page.getByLabel('Cidade ou região').fill('Recife');
  await page.getByRole('button', { name: 'Buscar empresas' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'A busca não foi confirmada' }),
  ).toBeVisible();
  await expect(page.getByLabel('Tipo de empresa')).toHaveValue('Clínicas');
  await expect(page.getByLabel('Cidade ou região')).toHaveValue('Recife');
  await expect(page.getByRole('button', { name: 'Buscar empresas' })).toBeEnabled();
  expect(pedidos).toBe(1);
  expect(erros).toEqual([]);
});
