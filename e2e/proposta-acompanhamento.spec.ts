import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('link e acompanhamento aparecem antes do editor, sem decisões competindo', async ({
  page,
}, testInfo) => {
  await page.goto('/preview/proposta-editor?estado=sem-visualizacoes');
  const painel = page.getByRole('region', { name: 'Acompanhar proposta' });
  await expect(painel.getByRole('button', { name: 'Copiar link' })).toBeInViewport();
  await expect(painel.getByText('Sem visualizações')).toBeVisible();
  await expect(painel.getByRole('button', { name: 'Confirmar venda e abrir entrega' })).toHaveCount(
    0,
  );
  expect((await painel.boundingBox())!.y).toBeLessThan(
    (await page.getByLabel('Nome da proposta').boundingBox())!.y,
  );
  await painel.getByText('Registrar resposta', { exact: true }).press('Enter');
  await expect(
    painel.getByRole('button', { name: 'Confirmar venda e abrir entrega' }),
  ).toBeVisible();
  await painel.getByText('Registrar resposta', { exact: true }).press('Enter');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('acompanhamento-inicial.png') });
});

test('gerenciar acesso abre confirmação sem cortar o modal e devolve o foco', async ({
  page,
}, testInfo) => {
  await page.goto('/preview/proposta-editor');
  await page.getByText('Gerenciar acesso', { exact: true }).press('Enter');
  const trocar = page.getByRole('button', { name: 'Trocar link' });
  await trocar.click();
  const modal = page.getByRole('dialog', { name: 'Criar um novo link?' });
  await expect(modal).toBeInViewport();
  await expect(modal.getByRole('button', { name: 'Criar novo link' })).toBeInViewport();
  await expect(modal).toContainText('O link anterior deixará de funcionar');
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('confirmacao-link.png') });
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(trocar).toBeFocused();
  await page.getByRole('button', { name: 'Desativar link' }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Desativar link' })).toBeFocused();
  await expect(page.getByLabel('Link da proposta')).toBeVisible();
});

test('a versão não salva não é apresentada como compartilhada', async ({ page, isMobile }) => {
  await page.goto('/preview/proposta-editor');
  if (isMobile) {
    await page.getByRole('button', { name: 'Ver prévia', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ver prévia', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
  }
  await page.getByLabel('Nome da proposta').fill('Nova versão ainda em edição');
  const painel = page.getByRole('region', { name: 'Acompanhar proposta' });
  await expect(painel.getByRole('button', { name: 'Copiar link' })).toBeDisabled();
  await expect(painel.getByRole('status')).toContainText('Salve para compartilhar');
  await expect(painel.getByRole('link', { name: 'Abrir versão salva' })).toBeVisible();
  await painel.getByText('Registrar resposta', { exact: true }).click();
  await expect(
    painel.getByRole('button', { name: 'Confirmar venda e abrir entrega' }),
  ).toBeDisabled();
});

test('o painel permanece utilizável em telas estreitas e tablets', async ({ page, isMobile }) => {
  await page.setViewportSize(isMobile ? { width: 320, height: 740 } : { width: 820, height: 1100 });
  await page.goto('/preview/proposta-editor?estado=aceita-cliente');
  const painel = page.getByRole('region', { name: 'Acompanhar proposta' });
  await expect(painel.getByRole('button', { name: 'Copiar link' })).toBeInViewport();
  await expect(painel.getByRole('link', { name: /Abrir entrega/ })).toBeInViewport();
  await painel.getByText('Ver resposta do cliente', { exact: true }).press('Enter');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
});

test('a resposta fica disponível sem ocupar a tela com o comentário inteiro', async ({
  page,
}, testInfo) => {
  await page.goto('/preview/proposta-editor?estado=recusada-cliente');
  const painel = page.getByRole('region', { name: 'Acompanhar proposta' });
  await expect(painel.getByRole('heading', { name: 'Proposta não aprovada' })).toBeVisible();
  await expect(painel.getByText('Resposta de Camila Rios')).toBeVisible();
  await expect(painel.getByText('Revisamos o projeto', { exact: false })).not.toBeVisible();
  await painel.getByText('Ver resposta do cliente', { exact: true }).press('Enter');
  await expect(painel.getByText('Revisamos o projeto', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('resposta-cliente.png') });
  await page.goto('/preview/proposta-editor?estado=desativada');
  await expect(painel.getByText('Link desativado', { exact: true })).toBeVisible();
  await expect(painel.getByRole('button', { name: 'Copiar link' })).toHaveCount(0);
  await expect(painel.getByRole('button', { name: 'Criar novo link' })).toBeInViewport();
});
