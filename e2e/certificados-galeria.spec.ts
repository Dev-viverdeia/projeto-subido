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
  await page.getByRole('button', { name: 'Compartilhar no LinkedIn' }).click();
  await expect(page.getByRole('link', { name: 'Publicar no LinkedIn' })).toHaveAttribute(
    'href',
    /linkedin\.com\/sharing\/share-offsite/,
  );
  await page.keyboard.press('Escape');
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

test('clicar na prévia usa o mesmo destino do botão do certificado', async ({ page }) => {
  await page.goto('/preview/certificados');
  const link = page.getByRole('link', { name: /Ver certificado/ }).first();
  const href = await link.getAttribute('href');
  const folha = page.getByRole('article', { name: /^Certificado de / }).first();
  const box = (await folha.boundingBox())!;
  // Captura o clique nativo antes do roteador: verifica a área inteira sem
  // depender de autenticação ou navegar para um certificado fictício.
  await page.evaluate(() => {
    document.addEventListener(
      'click',
      (event) => {
        const link = (event.target as Element).closest('a');
        if (!link) return;
        document.body.dataset.destinoCertificado = link.getAttribute('href') ?? '';
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      { capture: true, once: true },
    );
  });
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('body')).toHaveAttribute('data-destino-certificado', href!);
});

test('impressão mantém nome e título longos inteiros em uma folha A4', async ({ page }) => {
  await page.goto('/preview/certificado?longo=1');
  await page.emulateMedia({ media: 'print' });
  const documento = page.getByRole('article', { name: /^Certificado de / });
  const dimensoes = await documento.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return {
      largura: box.width,
      altura: box.height,
      conteudo: el.scrollHeight,
      elementosDentro: Array.from(el.querySelectorAll('p,h1,footer,[role="img"]')).every((c) => {
        const b = c.getBoundingClientRect();
        return b.left >= box.left && b.right <= box.right && b.bottom <= box.bottom;
      }),
    };
  });
  expect(dimensoes.largura).toBeCloseTo(1122.52, 0);
  expect(dimensoes.altura).toBeLessThanOrEqual(794);
  expect(dimensoes.conteudo).toBeLessThanOrEqual(Math.ceil(dimensoes.altura));
  expect(dimensoes.elementosDentro).toBe(true);
});

test('compartilhamento mostra PNG, download e campos copiáveis do perfil', async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/preview/certificado?longo=1');
  const gatilho = page.getByRole('button', { name: 'Compartilhar no LinkedIn' });
  await gatilho.click();
  const modal = page.getByRole('dialog', { name: 'Compartilhar certificado' });
  const imagem = modal.getByRole('img', { name: /^Prévia do certificado/ });
  await expect(imagem).toBeVisible();
  await imagem.evaluate((el: HTMLImageElement) => el.decode());
  expect(
    await imagem.evaluate((el: HTMLImageElement) => [el.naturalWidth, el.naturalHeight]),
  ).toEqual([1200, 627]);
  await expect(modal.getByRole('link', { name: 'Publicar no LinkedIn' })).toHaveAttribute(
    'target',
    '_blank',
  );
  const baixar = page.waitForEvent('download');
  await modal.getByRole('link', { name: 'Baixar imagem' }).click();
  expect((await baixar).suggestedFilename()).toBe('certificado-subido.png');
  await modal.getByRole('button', { name: 'Perfil', exact: true }).click();
  await expect(modal.getByRole('button', { name: 'Perfil', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await modal.getByRole('button', { name: 'Copiar nome', exact: true }).click();
  await expect(modal.getByRole('status')).toContainText('Nome: copiado.');
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      'Inteligência artificial aplicada',
    );
  await expect(
    modal.getByRole('link', { name: 'Adicionar ao perfil no LinkedIn' }),
  ).toHaveAttribute('href', 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME');
  const acessibilidade = await new AxeBuilder({ page }).analyze();
  expect(
    acessibilidade.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(gatilho).toBeFocused();
});

test('erro de prévia permite recuperação sem bloquear o compartilhamento', async ({ page }) => {
  await page.route('**/preview/certificado/imagem*', (route) => route.abort());
  await page.goto('/preview/certificado');
  await page.getByRole('button', { name: 'Compartilhar no LinkedIn' }).click();
  const modal = page.getByRole('dialog', { name: 'Compartilhar certificado' });
  await expect(
    modal.getByText('A prévia não carregou. Seu link continua disponível.'),
  ).toBeVisible();
  await expect(modal.getByRole('link', { name: 'Publicar no LinkedIn' })).toBeVisible();
  await page.unroute('**/preview/certificado/imagem*');
  await modal.getByRole('button', { name: 'Recarregar prévia' }).click();
  const imagem = modal.getByRole('img', { name: /^Prévia do certificado/ });
  await imagem.evaluate((el: HTMLImageElement) => el.decode());
  expect(await imagem.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1200);
});
