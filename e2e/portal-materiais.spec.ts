import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('arquivos e suporte são acessíveis sem abrir os resultados', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/preview/portal-cliente');
  await expect(page.getByRole('heading', { name: 'Arquivos do projeto' })).toBeVisible();
  const baixar = page.getByRole('link', {
    name: 'Baixar Mapa de demanda do atendimento, versão 2',
  });
  await expect(baixar).toBeVisible();
  expect(await baixar.evaluate((el) => el.closest('details'))).toBeNull();
  await expect(baixar).toHaveAttribute('href', /^\/portal\/[\w-]+\/arquivos\/[\w-]+$/);
  await expect(page.getByRole('link', { name: 'Falar com o suporte' })).toHaveAttribute(
    'href',
    'mailto:suporte@mateussilva.com.br',
  );
  await expect(page.getByText('100%', { exact: true })).toHaveCount(0);

  await page.getByLabel('Detalhes de Mapa de demanda do atendimento').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Entrega: Medir a demanda real')).toBeVisible();
  await page.getByText('Garantia e continuidade', { exact: true }).click();
  await expect(
    page
      .getByRole('complementary', { name: 'Suporte do projeto' })
      .getByText('Cobre: Correções do fluxo, das respostas e das integrações entregues.'),
  ).toBeVisible();
  const resultado = await new AxeBuilder({ page }).analyze();
  expect(
    resultado.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  expect(erros).toEqual([]);
});

test('listas grandes preservam todos os arquivos sem dominar a primeira leitura', async ({
  page,
}) => {
  await page.goto('/preview/portal-cliente?estado=muitos');
  await expect(
    page.getByRole('link', { name: 'Baixar Material 4 da implementação, versão 2' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Baixar Material 12 da implementação, versão 2' }),
  ).not.toBeVisible();
  const medidas = await page.evaluate(() => ({
    largura: document.documentElement.scrollWidth,
    viewport: innerWidth,
    altura: document.documentElement.scrollHeight,
  }));
  expect(medidas.largura).toBeLessThanOrEqual(medidas.viewport);
  expect(medidas.altura).toBeLessThan(2100);
  await page.getByText('Ver mais 8 arquivos', { exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Baixar Material 12 da implementação, versão 2' }),
  ).toBeVisible();
  await page.getByText('Ver mais 2 entregas', { exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Abrir entrega: Medir a demanda real' }),
  ).toBeVisible();
});

test('conclusão manual não inventa aceite, garantia ou execução completa', async ({ page }) => {
  await page.goto('/preview/portal-cliente?estado=manual');
  await expect(page.getByText('Projeto concluído', { exact: true })).toBeVisible();
  await expect(page.getByText('Entrega registrada pelo profissional')).toBeVisible();
  await expect(page.getByText('Aceite confirmado')).toHaveCount(0);
  await expect(page.getByText('100%', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Garantia e continuidade')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Arquivos do projeto' })).toBeVisible();
});

test('projeto sem materiais mostra o estado real e permanece legível com movimento reduzido', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/portal-cliente?estado=vazio');
  await expect(page.getByText('Nenhum arquivo liberado')).toBeVisible();
  await expect(page.getByRole('link', { name: /Baixar/ })).toHaveCount(0);
  await expect(page.getByText('0%', { exact: true })).toBeVisible();
  await expect(page.getByText('Nenhuma ação pendente.')).toBeVisible();
  const resultado = await new AxeBuilder({ page }).analyze();
  expect(
    resultado.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
});

for (const estado of ['pendencias', 'escopo']) {
  test(`mantém a decisão de ${estado} antes dos materiais`, async ({ page }) => {
    await page.goto(`/preview/portal-cliente?estado=${estado}`);
    const decisao =
      estado === 'escopo'
        ? page.getByRole('region', { name: 'Revise a mudança no projeto.' })
        : page.getByRole('region', { name: '2 itens precisam da sua confirmação.' });
    await expect(decisao).toBeVisible();
    await expect(
      decisao
        .getByRole('button', {
          name: estado === 'escopo' ? 'Aprovar mudança' : 'Confirmar como resolvido',
        })
        .first(),
    ).toBeEnabled();
    const posicao = await decisao.boundingBox();
    const arquivos = await page.getByRole('heading', { name: 'Arquivos do projeto' }).boundingBox();
    expect(posicao!.y).toBeLessThan(arquivos!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const resultado = await new AxeBuilder({ page }).analyze();
    expect(
      resultado.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
    ).toEqual([]);
  });
}
