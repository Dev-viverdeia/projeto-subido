import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('link do e-mail revela a revisão mesmo quando ela começa recolhida', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') erros.push(mensagem.text());
  });
  await page.goto(
    '/preview/portal-cliente?estado=revisoes#entrega-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  );
  const entrega = page.getByRole('article', { name: 'Montar a base aprovada' });
  await expect(entrega).toBeVisible();
  await expect(entrega.getByRole('button', { name: 'Aprovar entrega' })).toBeInViewport();
  await entrega.getByRole('button', { name: 'Pedir ajuste' }).click();
  const ajuste = entrega.getByLabel('O que precisa mudar?');
  await expect(ajuste).toBeVisible();
  await ajuste.fill('Validar as respostas antes de publicar.');
  const resumo = page.locator('details > summary').filter({ hasText: 'Montar a base aprovada' });
  await resumo.click();
  await expect(entrega).not.toBeVisible();
  await resumo.press('Enter');
  await expect(ajuste).toHaveValue('Validar as respostas antes de publicar.');
  expect(erros).toEqual([]);
});

test('organiza revisões sem esconder os materiais nem perder o ajuste digitado', async ({
  page,
}) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/preview/portal-cliente?estado=revisoes');
  const primeira = page
    .getByRole('group')
    .filter({ has: page.locator('summary').filter({ hasText: 'Medir a demanda real' }) });
  const segunda = page.locator('details').filter({
    has: page.locator(':scope > summary').filter({ hasText: 'Definir os limites da IA' }),
  });
  await expect(
    page.getByRole('button', { name: 'Aprovar entrega' }).filter({ visible: true }),
  ).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Confirmar como resolvido' })).toBeVisible();
  await primeira.getByRole('button', { name: 'Pedir ajuste' }).click();
  const ajuste = primeira.getByLabel('O que precisa mudar?');
  await ajuste.fill('Incluir o fluxo de transferência para a recepção.');
  await primeira.locator('summary').first().click();
  await expect(ajuste).not.toBeVisible();
  await segunda.locator('summary').first().press('Enter');
  await expect(segunda.getByText('Matriz de limites e escalonamento.')).toBeVisible();
  await primeira.locator('summary').first().press('Enter');
  await expect(ajuste).toHaveValue('Incluir o fluxo de transferência para a recepção.');
  await page.getByRole('link', { name: 'Arquivos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Arquivos do projeto' })).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Arquivos do projeto' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  expect(erros).toEqual([]);
});

test('pedido de mudança usa diálogo com foco, Escape e ações visíveis no celular', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/portal-cliente?estado=vazio');
  await page.getByText('Sobre o projeto', { exact: true }).click();
  const gatilho = page.getByRole('button', { name: 'Pedir uma mudança' });
  await gatilho.click();
  const dialogo = page.getByRole('dialog', { name: 'O que precisa mudar?' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByLabel('Resumo do pedido')).toBeFocused();
  await expect(dialogo.getByRole('button', { name: 'Enviar para análise' })).toBeInViewport();
  await dialogo.getByRole('button', { name: 'Enviar para análise' }).focus();
  await page.keyboard.press('Tab');
  expect(await dialogo.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialogo).not.toBeVisible();
  await expect(gatilho).toBeFocused();
});
