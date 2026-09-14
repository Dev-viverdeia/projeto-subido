import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('agenda prioriza o próximo encontro apesar de 253 reuniões antigas', async ({
  page,
}, info) => {
  await page.goto('/preview/agenda');
  await expect(page.getByRole('region', { name: 'Conversa sobre atendimento 1' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Histórico', exact: true })).toHaveCount(0);
  await expect(page.getByText('Revisão do projeto 1', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver mais reuniões' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('agenda.png'), fullPage: true });
});

test('histórico busca clientes, pagina e restaura filtros ao voltar', async ({ page }, info) => {
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST') posts.push(r.url());
  });
  await page.goto('/preview/agenda');
  await page.getByRole('link', { name: 'Histórico', exact: true }).click();
  const historico = page.getByRole('region', { name: 'Histórico', exact: true });
  await expect(historico.locator('article')).toHaveCount(12);
  await page.getByRole('searchbox').fill('Camila');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/busca=Camila/);
  await expect(historico).not.toContainText('Moura Imóveis');
  const primeiro = await historico.locator('strong').first().innerText();
  await page.getByRole('link', { name: 'Ver mais reuniões' }).click();
  await expect(page).toHaveURL(/cursor=/);
  await expect(historico.getByText(primeiro, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('searchbox')).toHaveValue('Camila');
  await page.goBack();
  await expect(historico.getByText(primeiro, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(page).not.toHaveURL(/busca=/);
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await expect(historico.locator('article')).toHaveCount(12);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('historico.png'), fullPage: true });
  expect(posts).toEqual([]);
});

test('busca vazia e pendências em 320px sem corte lateral', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/preview/agenda?visao=historico&busca=NenhumaXYZ');
  await expect(page.getByRole('region', { name: 'Nenhuma reunião encontrada' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Limpar busca' }).click();
  await page.getByRole('link', { name: 'Para revisar' }).click();
  await expect(page.getByRole('button', { name: 'Resolver pendência' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('pendencias-320.png'), fullPage: true });
});

test('busca com teclado e movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/agenda?visao=historico');
  const busca = page.getByRole('searchbox');
  await busca.focus();
  await busca.fill('Projeto 1');
  await busca.press('Enter');
  await expect(page).toHaveURL(/busca=Projeto\+1/);
  await expect(
    page.getByRole('region', { name: 'Histórico', exact: true }).locator('article'),
  ).toHaveCount(12);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('menu mantém alteração disponível e reabre o formulário', async ({ page }, info) => {
  await page.goto('/preview/agenda');
  const linha = page
    .getByRole('region', { name: 'Próximas reuniões', exact: true })
    .locator('article')
    .first();
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    await linha.getByRole('button', { name: 'Outras ações', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Alterar reunião' }).click();
    await expect(page.getByRole('dialog', { name: 'Alterar reunião' })).toBeVisible();
    if (tentativa === 0) {
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath('alterar-reuniao.png'), fullPage: true });
    }
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
});

test('aba selecionada mantém identificação em alto contraste', async ({ page }, info) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/preview/agenda?visao=historico');
  const aba = page.getByRole('link', { name: 'Histórico', exact: true });
  await expect(aba).toHaveAttribute('aria-current', 'page');
  await aba.focus();
  await expect(aba).toBeFocused();
  await page.screenshot({ path: info.outputPath('alto-contraste.png') });
});
