import { expect, test } from '@playwright/test';

const LISTA = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const EMPRESA = '22222222-2222-4222-8222-222222222222';

for (const caminho of ['link', 'navegador', 'modal', 'recarregar', 'sem-storage'] as const) {
  test(`Prospecção mantém lista, empresa e posição: ${caminho}`, async ({ page }) => {
    if (caminho === 'sem-storage')
      await page.addInitScript(() => {
        Object.defineProperty(window, 'sessionStorage', {
          get() {
            throw new Error('Bloqueado no teste');
          },
        });
      });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const mutacoes: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') mutacoes.push(request.url());
    });
    await page.goto('/preview/prospeccao?navegacao=1');
    await page.getByRole('link', { name: /Imobiliárias Campinas/ }).click();
    const card = page.getByRole('listitem', { name: 'Imobiliária Porto', exact: true });
    const abrir = card.getByRole('link', { name: 'Abrir ficha' });
    await expect(abrir).toHaveAttribute(
      'href',
      `/vendas/33333333-3333-4333-8333-333333333333?origem=prospeccao&lista=${LISTA}&empresa=${EMPRESA}`,
    );
    await abrir.scrollIntoViewIfNeeded();
    let topo: number | null = null;
    await page.exposeFunction('registrarTopoSaida', (valor: number) => {
      topo = valor;
    });
    // Safari pode reposicionar o controle ao clicar. Medir o DOM no clique real,
    // independentemente da posição gravada pela implementação.
    await abrir.evaluate((el) => {
      el.addEventListener(
        'click',
        () => {
          void (
            window as Window & { registrarTopoSaida: (valor: number) => Promise<void> }
          ).registrarTopoSaida(el.closest('article')!.getBoundingClientRect().top);
        },
        { capture: true, once: true },
      );
    });
    if (caminho === 'modal') {
      await card.getByRole('button', { name: 'Ver detalhes' }).click();
      await page.getByRole('dialog').getByRole('link', { name: 'Abrir ficha' }).click();
    } else await abrir.click();
    if (caminho !== 'modal') await expect.poll(() => topo).not.toBeNull();
    await expect(page.getByRole('heading', { name: 'Ficha do cliente' })).toBeVisible();
    if (caminho === 'recarregar') await page.reload();
    if (caminho === 'navegador') await page.goBack();
    else await page.getByRole('link', { name: 'Voltar para Prospecção' }).click();
    await expect(page).toHaveURL(new RegExp(`lista=${LISTA}`));
    await expect(page.getByRole('heading', { name: 'Imobiliárias', exact: true })).toBeVisible();
    await expect(abrir).toBeFocused();
    await expect(abrir).toBeInViewport();
    // O modal pode ajustar o viewport para alcançar seu acionador antes de abrir.
    if (caminho !== 'modal')
      await expect
        .poll(async () =>
          Math.abs((await card.evaluate((el) => el.getBoundingClientRect().top)) - topo!),
        )
        .toBeLessThan(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(mutacoes).toEqual([]);
  });
}

test('criação simulada retorna à empresa sem recriar a oportunidade', async ({ page }) => {
  let posts = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST') posts += 1;
  });
  await page.goto(`/preview/prospeccao?navegacao=1&lista=${LISTA}`);
  const card = page.getByRole('listitem', { name: 'Imobiliária Horizonte' });
  await card.getByRole('button', { name: 'Criar oportunidade' }).click();
  await expect(page.getByRole('heading', { name: 'Ficha do cliente' })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar para Prospecção' }).click();
  await expect(card.getByRole('link', { name: 'Abrir ficha' })).toBeFocused();
  await expect(card.getByRole('button', { name: 'Criar oportunidade' })).toHaveCount(0);
  expect(posts).toBe(0);
});

test('entrada por link compartilhado ou outra largura encontra a empresa sem posição salva', async ({
  page,
}) => {
  await page.goto(
    `/preview/prospeccao?navegacao=1&ficha=1&origem=prospeccao&lista=${LISTA}&empresa=${EMPRESA}`,
  );
  await page.getByRole('link', { name: 'Voltar para Prospecção' }).click();
  const abrir = page
    .getByRole('listitem', { name: 'Imobiliária Porto' })
    .getByRole('link', { name: 'Abrir ficha' });
  await expect(abrir).toBeFocused();
  await expect(abrir).toBeInViewport();
  await abrir.click();
  await page.setViewportSize({ width: 768, height: 900 });
  await page.getByRole('link', { name: 'Voltar para Prospecção' }).click();
  await expect(abrir).toBeFocused();
  await expect(abrir).toBeInViewport();
});

test('empresa removida mantém um foco utilizável na lista', async ({ page }) => {
  await page.goto(`/preview/prospeccao?navegacao=1&lista=${LISTA}`);
  const card = page.getByRole('listitem', { name: 'Imobiliária Porto' });
  await card.getByRole('link', { name: 'Abrir ficha' }).click();
  await page.getByRole('link', { name: 'Simular empresa removida' }).click();
  await expect(card).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Empresas encontradas' })).toBeFocused();
  await expect(page.getByRole('listitem', { name: 'Imobiliária Orbe' })).toBeVisible();
});
