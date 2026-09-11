import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('edição começa compacta e mantém o investimento antes do escopo', async ({
  page,
  isMobile,
}, testInfo) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/preview/proposta-editor?estado=rascunho');
  const editor = page.getByRole('region', { name: 'Editar proposta', exact: true });
  await expect(editor.locator('details[open]')).toHaveCount(0);
  await expect(editor.locator('summary')).toHaveCount(5);
  await expect(
    editor.getByText(isMobile ? 'Projeto e escopo' : 'Valor e condições', { exact: true }),
  ).toBeInViewport();
  if (isMobile) await page.getByRole('button', { name: 'Ver prévia', exact: true }).click();
  const previa = page.getByLabel('Prévia visual da proposta');
  const ordem = await previa
    .locator('[data-secao-preview]')
    .evaluateAll((secoes) => secoes.map((s) => s.getAttribute('data-secao-preview')));
  expect(ordem.indexOf('investimento')).toBeLessThan(ordem.indexOf('escopo'));
  await expect(previa.getByRole('button', { name: 'Editar cliente na proposta' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  expect(erros).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('editor-inicial.png') });
});

test('cada atalho da prévia abre o trecho correto e devolve o foco', async ({ page, isMobile }) => {
  await page.goto('/preview/proposta-editor?estado=rascunho');
  const trechos = [
    ['cliente', 'Empresa'],
    ['desafio e objetivo', 'Desafio identificado'],
    ['solução', 'Resumo da solução'],
    ['escopo', 'Título da etapa 1'],
    ['entregáveis', 'Entregável 1'],
    ['cronograma', 'Fase 1'],
    ['investimento', 'Valor do projeto (R$)'],
    ['próximos passos', 'Próximo passo 1'],
  ];
  for (const [trecho, campo] of trechos) {
    if (isMobile) await page.getByRole('button', { name: 'Ver prévia', exact: true }).click();
    await page.getByRole('button', { name: `Editar ${trecho} na proposta`, exact: true }).click();
    await expect(page.getByRole('textbox', { name: campo, exact: true })).toBeFocused();
    await expect(page.getByRole('textbox', { name: campo, exact: true })).toBeInViewport();
    await expect(
      page.getByRole('region', { name: 'Editar proposta', exact: true }).locator('details[open]'),
    ).toHaveCount(1);
  }
});

test('valor, condições e validade aparecem ao digitar, sem salvar nem perder a edição', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto('/preview/proposta-editor?estado=rascunho');
  await page.getByRole('heading', { name: 'Valor e condições', exact: true }).click();
  const valor = page.getByLabel('Valor do projeto (R$)', { exact: true });
  await valor.fill('27900,50');
  await page.getByLabel('Validade da proposta (dias)').fill('21');
  const condicoes = page.getByRole('textbox', { name: 'Condições de pagamento', exact: true });
  await condicoes.fill('Entrada e três parcelas combinadas com o cliente.');
  if (isMobile) await page.getByRole('button', { name: 'Ver prévia', exact: true }).click();
  const previa = page.getByLabel('Prévia visual da proposta');
  await expect(previa.getByText('R$ 27.900,50', { exact: true })).toBeInViewport();
  await expect(previa.getByText('21 dias', { exact: true })).toBeVisible();
  await expect(previa.getByText('Entrada e três parcelas combinadas com o cliente.')).toBeVisible();
  await expect(previa.getByText('Alterações não salvas')).toBeVisible();
  await expect(page.getByRole('link', { name: 'PDF', exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('investimento-ao-vivo.png') });
  if (isMobile) {
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    await expect(condicoes).toBeFocused();
  }
  await expect(valor).toHaveValue('27900,50');
});

test('seções abrem pelo teclado e conteúdo longo não causa rolagem horizontal', async ({
  page,
  isMobile,
}) => {
  await page.goto('/preview/proposta-editor?estado=rascunho');
  const resumo = page
    .getByRole('region', { name: 'Editar proposta', exact: true })
    .locator('summary')
    .first();
  await resumo.press('Enter');
  await expect(page.getByLabel('Empresa', { exact: true })).toBeVisible();
  const longo = 'Cliente'.repeat(22);
  await page.getByLabel('Empresa', { exact: true }).fill(longo);
  await page.getByLabel('Desafio identificado').fill('Contexto detalhado. '.repeat(80));
  if (isMobile) await page.getByRole('button', { name: 'Ver prévia', exact: true }).click();
  const previa = page.getByLabel('Prévia visual da proposta');
  await expect(previa.getByText(longo, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
});
