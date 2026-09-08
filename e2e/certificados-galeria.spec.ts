import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('galeria exibe documentos grandes, co-branding e destinos reais', async ({ page }) => {
  await page.goto('/preview/certificados');
  await expect(page.getByRole('heading', { level: 1, name: 'Certificados' })).toBeVisible();
  const documentos = page.getByRole('article', { name: /^Certificado de / });
  await expect(documentos).toHaveCount(2);
  for (const documento of await documentos.all()) {
    await expect(documento.getByRole('img', { name: 'Viver de IA', exact: true })).toBeVisible();
    await expect(documento.getByRole('img', { name: 'Subido', exact: true })).toBeVisible();
    const box = await documento.boundingBox();
    expect(box!.width).toBeGreaterThan((page.viewportSize()?.width ?? 0) > 900 ? 450 : 290);
  }
  await expect(page.getByRole('link', { name: /Ver certificado/ }).first()).toHaveAttribute(
    'href',
    '/certificados/solucao/nina-sdr',
  );
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
  const acessibilidade = await new AxeBuilder({ page }).analyze();
  expect(
    acessibilidade.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
});

test('estado vazio diferencia o modelo de uma conquista real', async ({ page }) => {
  await page.goto('/preview/certificados?estado=vazio');
  await expect(page.getByRole('article', { name: 'Modelo de certificado' })).toContainText(
    'Prévia ilustrativa · sem validade',
  );
  await expect(page.getByRole('link', { name: /Ver certificado/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Começar formação/ })).toHaveAttribute(
    'href',
    '/formacoes/chatgpt-para-o-trabalho',
  );
  await expect(page.getByRole('heading', { name: 'Conquistados' })).toHaveCount(0);
});

test('a moldura da plataforma não transforma o modelo em uma página gigante', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/preview/certificados?estado=vazio');
  await page.locator('main > div').evaluate((el) => {
    (el as HTMLElement).style.maxWidth = '956px';
  });
  const painel = page.getByRole('region', { name: 'Seu próximo certificado começa aqui.' });
  expect((await painel.boundingBox())!.height).toBeLessThan(560);
  const texto = await painel.getByRole('heading', { level: 2 }).boundingBox();
  const modelo = await painel.getByRole('article').boundingBox();
  expect(modelo!.x).toBeGreaterThan(texto!.x + texto!.width);
});

test('folha mantém compartilhamento, cópia e impressão acessíveis', async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/preview/certificado');
  await expect(page.getByRole('img', { name: 'Viver de IA', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compartilhar no LinkedIn' })).toHaveAttribute(
    'href',
    /linkedin\.com\/sharing\/share-offsite/,
  );
  await page.getByRole('button', { name: 'Copiar link', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Link copiado' })).toBeVisible();
  if (browserName === 'chromium') {
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'https://subido.viverdeia.ai/certificado/subido-preview-2026',
    );
  }
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.impressaoSolicitada = 'sim';
    };
  });
  await page.getByRole('button', { name: 'Salvar em PDF' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-impressao-solicitada', 'sim');
  const resultado = await new AxeBuilder({ page }).analyze();
  expect(
    resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
});

test('nomes e títulos longos cabem no celular sem recorte', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/preview/certificado?longo=1');
  const documento = page.getByRole('article', { name: /^Certificado de / });
  await expect(documento).toContainText('Maria Fernanda Albuquerque de Oliveira e Vasconcelos');
  await expect(documento.getByRole('heading', { level: 1 })).toContainText(
    'implementação de projetos para empresas',
  );
  const dimensoes = await page.evaluate(() => ({
    largura: document.documentElement.clientWidth,
    conteudo: document.documentElement.scrollWidth,
  }));
  expect(dimensoes.conteudo).toBeLessThanOrEqual(dimensoes.largura);
  const limites = await documento.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return Array.from(el.querySelectorAll('p,h1,footer,[role="img"]')).every((child) => {
      const b = child.getBoundingClientRect();
      return b.left >= box.left && b.right <= box.right && b.bottom <= box.bottom;
    });
  });
  expect(limites).toBe(true);
});

test('ações têm alvo de toque e foco visível para teclado', async ({ page, isMobile }) => {
  await page.goto('/preview/certificados');
  const acao = page.getByRole('link', { name: /Ver certificado/ }).first();
  if (isMobile) {
    const box = await acao.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    return;
  }
  await page.keyboard.press('Tab');
  await expect(acao).toBeFocused();
  expect(await acao.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
});
