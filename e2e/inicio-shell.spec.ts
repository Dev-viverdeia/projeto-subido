import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('o menu desktop mantém os últimos destinos alcançáveis em uma tela baixa', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/preview/shell');
  const lateral = page.getByRole('navigation', { name: 'Seções da plataforma' });
  const entregas = lateral.getByRole('link', { name: 'Entregas', exact: true });
  await entregas.scrollIntoViewIfNeeded();
  const geometria = await entregas.boundingBox();
  expect(geometria).not.toBeNull();
  expect(geometria!.y).toBeGreaterThan(60);
  expect(geometria!.y + geometria!.height).toBeLessThan(600);
  await expect(page.getByRole('link', { name: 'Administração', exact: true })).toBeInViewport();
  const rolagem = await lateral.evaluate((elemento) => ({
    altura: elemento.clientHeight,
    conteudo: elemento.scrollHeight,
    posicao: elemento.scrollTop,
  }));
  expect(rolagem.conteudo).toBeGreaterThan(rolagem.altura);
  expect(rolagem.posicao).toBeGreaterThan(0);
});

test('os nove acessos cabem sem rolagem desnecessária em um notebook', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/preview/shell');
  const atalhos = page.getByRole('navigation', { name: 'Atalhos da plataforma' });
  await expect(atalhos.getByRole('link')).toHaveCount(9);
  for (const atalho of await atalhos.getByRole('link').all()) {
    await expect(atalho).toBeInViewport();
  }
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(721);
});

test('o menu mobile cobre a viewport mesmo após rolar e restaura a página ao fechar', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.goto('/preview/shell');
  await page.getByRole('link', { name: 'Ver entregas: Entregas' }).scrollIntoViewIfNeeded();
  const posicaoAntes = await page.evaluate(() => window.scrollY);
  const mais = page.getByRole('button', { name: 'Mais', exact: true });
  await mais.click();
  const menu = page.getByRole('dialog', { name: 'Mais' });
  await expect(menu).toBeVisible();
  await expect(page.locator('[data-app-shell]')).toHaveAttribute('inert', '');
  const geometria = await menu.boundingBox();
  expect(geometria!.y).toBeGreaterThanOrEqual(0);
  expect(geometria!.y + geometria!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  const fundo = await page
    .getByRole('button', { name: 'Fechar navegação ao tocar fora' })
    .boundingBox();
  expect(fundo).toEqual({
    x: 0,
    y: 0,
    width: page.viewportSize()!.width,
    height: page.viewportSize()!.height,
  });
  await expect(page.getByRole('button', { name: 'Fechar navegação', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(menu.getByRole('link', { name: /Minha conta/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Fechar navegação', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(mais).toBeFocused();
  await expect(page.locator('[data-app-shell]')).not.toHaveAttribute('inert');
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - posicaoAntes)).toBeLessThanOrEqual(
    2,
  );
});

test('voltar ao desktop com Mais aberto não deixa a página bloqueada', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.goto('/preview/shell');
  await page.getByRole('button', { name: 'Mais', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Mais' })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByRole('dialog', { name: 'Mais' })).toHaveCount(0);
  await expect(page.locator('[data-app-shell]')).not.toHaveAttribute('inert');
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('Starter, nome longo e texto de ajuda continuam legíveis sem estourar', async ({
  page,
}, info) => {
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/preview/shell?plano=starter&nome=longo');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Maria Aparecida');
  const atalhos = page.getByRole('navigation', { name: 'Atalhos da plataforma' });
  await expect(atalhos.getByRole('link', { name: 'Estúdio: conhecer plano Pro' })).toHaveAttribute(
    'href',
    '/conta/assinatura?upgrade=estudio&origem=%2Finicio',
  );
  await expect(atalhos.getByRole('link', { name: 'Ver reuniões: Reuniões' })).toHaveAttribute(
    'href',
    '/reunioes',
  );
  const dimensoes = await atalhos.getByRole('link').evaluateAll((links) =>
    links.map((link) => ({
      altura: link.getBoundingClientRect().height,
      titulo: parseFloat(getComputedStyle(link.querySelector('strong')!).fontSize),
      ajuda: parseFloat(getComputedStyle(link.querySelector('strong + span')!).fontSize),
    })),
  );
  for (const dimensao of dimensoes) {
    expect(dimensao.altura).toBeGreaterThanOrEqual(44);
    expect(dimensao.titulo).toBeGreaterThanOrEqual(17);
    expect(dimensao.ajuda).toBeGreaterThanOrEqual(14);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  const resultado = await new AxeBuilder({ page }).analyze();
  expect(
    resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
});

test('o perfil mantém a saída alcançável e navega por teclado em telas baixas', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 390 : 1280, height: 500 });
  await page.goto('/preview/shell');
  const perfil = page.getByRole('button', { name: /84 créditos disponíveis/ });
  await perfil.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /Minha conta/ })).toBeFocused();
  await page.keyboard.press('End');
  const saida = page.getByRole('menuitem', { name: 'Encerrar sessão' });
  await expect(saida).toBeFocused();
  await expect(saida).toBeInViewport();
  const menu = await page.getByRole('menu', { name: 'Minha conta' }).boundingBox();
  expect(menu!.y + menu!.height).toBeLessThanOrEqual(500);
  await page.keyboard.press('Escape');
  await expect(perfil).toBeFocused();
});

test('movimento reduzido preserva os acessos e o foco visível', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/shell');
  // Ativa modalidade de teclado antes de focar. O WebKit mobile não inclui
  // links no Tab padrão, mas precisa manter o anel quando recebe foco por teclado.
  await page.keyboard.press('Tab');
  const projetos = page.getByRole('link', { name: 'Ver projetos: Projetos' });
  await projetos.focus();
  await expect(projetos).toBeFocused();
  const estilo = await projetos.evaluate((elemento) => ({
    sombra: getComputedStyle(elemento).boxShadow,
    transicao: getComputedStyle(elemento).transitionDuration,
  }));
  expect(estilo.sombra).toContain('4px');
  // A rede global do DS usa 0.01ms para preservar eventos de término.
  expect(parseFloat(estilo.transicao)).toBeLessThanOrEqual(0.00001);
});
