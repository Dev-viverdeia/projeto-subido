import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function interromperEnvios(page: Page) {
  let envios = 0;
  await page.route('**/*', (route) => {
    if (route.request().method() !== 'GET') {
      envios++;
      return route.abort('failed');
    }
    return route.continue();
  });
  return () => envios;
}
async function conferirVisual(page: Page) {
  await expect(page.getByRole('complementary', { name: 'Ajuda para continuar' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
}

test('proposta mantém escolhas com envio interrompido e ajuda não inclui dados do cliente', async ({
  page,
}) => {
  const envios = await interromperEnvios(page);
  await page.goto('/preview/proposta-nova?estado=lista');
  await page
    .getByRole('combobox', { name: 'Cliente', exact: true })
    .selectOption('22222222-2222-4222-8222-222222222222');
  await page.getByRole('combobox', { name: /Projeto-base/ }).selectOption('sem-base');
  await page.getByRole('button', { name: 'Criar rascunho' }).click();
  await expect(page.locator('[data-ajuda-falha] [role="alert"]')).toContainText(
    'Confira a Biblioteca comercial',
  );
  await expect(page.getByRole('combobox', { name: 'Cliente', exact: true })).toHaveValue(
    '22222222-2222-4222-8222-222222222222',
  );
  await expect(page.getByRole('combobox', { name: /Projeto-base/ })).toHaveValue('sem-base');
  await expect(page.getByRole('link', { name: 'Ver propostas' })).toHaveAttribute(
    'target',
    '_blank',
  );
  await expect(page.getByRole('link', { name: /Pedir ajuda/ })).toHaveAttribute(
    'href',
    '/suporte/novo?origem=%2Fpropostas%2Fnova&contexto=proposta',
  );
  await conferirVisual(page);
  expect(envios()).toBe(1);
});

test('agendamento mantém data, título, cliente e email na falha de conexão', async ({ page }) => {
  const envios = await interromperEnvios(page);
  await page.goto('/preview/calls?calendar=1&modal=1');
  await page
    .getByLabel('Cliente em negociação')
    .selectOption('33333333-3333-4333-8333-333333333333');
  await page.getByLabel('Data e horário', { exact: true }).fill('2026-11-10T10:30');
  await page.getByLabel('Duração (minutos)', { exact: true }).fill('60');
  await page.getByLabel('Título (opcional)', { exact: true }).fill('Conversa demonstrativa');
  await page.getByLabel('E-mail do cliente', { exact: true }).fill('cliente@example.test');
  await page.getByRole('button', { name: 'Criar reunião e enviar convite' }).click();
  await expect(page.locator('[data-ajuda-falha] [role="alert"]')).toContainText(
    'Confira suas reuniões',
  );
  await expect(page.getByLabel('Data e horário', { exact: true })).toHaveValue('2026-11-10T10:30');
  await expect(page.getByLabel('Cliente em negociação')).toHaveValue(
    '33333333-3333-4333-8333-333333333333',
  );
  await expect(page.getByLabel('Duração (minutos)', { exact: true })).toHaveValue('60');
  await expect(page.getByLabel('Título (opcional)', { exact: true })).toHaveValue(
    'Conversa demonstrativa',
  );
  await expect(page.getByLabel('E-mail do cliente', { exact: true })).toHaveValue(
    'cliente@example.test',
  );
  await expect(page.getByRole('link', { name: 'Ver reuniões' })).toHaveAttribute(
    'target',
    '_blank',
  );
  await conferirVisual(page);
  expect(envios()).toBe(1);
});

test('entrega mantém a confirmação e permite conferir sem reenviar', async ({ page }) => {
  const envios = await interromperEnvios(page);
  await page.goto('/preview/sala-entrega?estado=execucao');
  await page.getByRole('button', { name: 'Concluir entrega', exact: true }).click();
  const dialogo = page.getByRole('dialog');
  await dialogo.getByRole('checkbox').check();
  await dialogo.getByRole('button', { name: 'Concluir entrega', exact: true }).click();
  await expect(page.locator('[data-ajuda-falha] [role="alert"]')).toContainText(
    'Confira os dados atuais',
  );
  await expect(dialogo.getByRole('checkbox')).toBeChecked();
  await expect(dialogo.getByRole('button', { name: 'Atualizar dados' })).toBeEnabled();
  await conferirVisual(page);
  await dialogo.getByRole('button', { name: 'Atualizar dados' }).click();
  await expect(dialogo.locator('[data-ajuda-falha]')).toHaveCount(0);
  await expect(dialogo.getByRole('checkbox')).toBeChecked();
  expect(envios()).toBe(1);
});

test('falha da agenda oferece guia e suporte sem erro técnico', async ({ page }) => {
  await page.goto('/preview/agenda-conta?estado=erro');
  await expect(page.locator('[data-ajuda-falha] [role="alert"]')).toContainText(
    'A agenda ainda não está conectada',
  );
  await expect(page.getByRole('link', { name: /Ver guia/ })).toHaveAttribute(
    'href',
    '/ajuda/conectar-google-agenda',
  );
  await conferirVisual(page);
});

test('pedido recebe assunto e área mas não sobrescreve um rascunho existente', async ({ page }) => {
  await page.goto('/preview/suporte?tela=pedido-cliente&contexto=proposta');
  await expect(page.getByLabel('O que você precisa resolver?', { exact: true })).toHaveValue(
    'Problema ao criar uma proposta',
  );
  await page
    .getByLabel('O que você precisa resolver?', { exact: true })
    .fill('Minha dúvida já escrita');
  await page
    .getByLabel('Descreva o que aconteceu', { exact: true })
    .fill('Eu já estava descrevendo meu problema aqui.');
  await page.goto('/preview/suporte?tela=pedido-cliente&contexto=agenda');
  await expect(page.getByLabel('O que você precisa resolver?', { exact: true })).toHaveValue(
    'Minha dúvida já escrita',
  );
  await expect(
    page.getByRole('textbox', { name: 'Descreva o que aconteceu', exact: true }),
  ).toHaveValue('Eu já estava descrevendo meu problema aqui.');
});
