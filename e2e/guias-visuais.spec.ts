import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import guias from '../src/lib/suporte/guias-visuais.json';

for (const guia of guias) {
  test(`guia visual: ${guia.slug}`, async ({ page }) => {
    await page.goto(`/preview/guia-ajuda?slug=${guia.slug}`);
    await expect(page.locator('ol > li')).toHaveCount(guia.passos.length);
    const ampliar = page.getByRole('button', { name: /^Ampliar imagem:/ });
    await expect(ampliar).toHaveCount(guia.capturas.length);
    await expect(page.getByRole('link', { name: 'Abrir na plataforma' })).toBeVisible();
    for (const imagem of await page.locator('figure img').all())
      await expect(imagem).toHaveJSProperty('complete', true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await ampliar.first().click();
    const dialogo = page.getByRole('dialog', { name: 'Imagem do guia' });
    await expect(dialogo).toBeInViewport();
    await dialogo.getByRole('button', { name: 'Ver em tamanho real' }).click();
    await expect(dialogo.getByRole('button', { name: 'Ajustar à tela' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialogo).toHaveCount(0);
    await expect(ampliar.first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Ver em tamanho real' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
}
test('proposta sem reunião mostra o caminho de rascunho sem contexto de call', async ({ page }) => {
  await page.goto('/preview/proposta-nova?estado=sem-reuniao');
  await expect(page.getByText('Dados da reunião incluídos')).toHaveCount(0);
  await expect(page.locator('input[name="reuniao"]')).toHaveValue('');
  await page.getByRole('combobox', { name: /Projeto-base/ }).selectOption('sem-base');
  await expect(page.getByRole('button', { name: 'Criar rascunho' })).toBeEnabled();
  const ajuda = page.getByRole('link', { name: /Como criar uma proposta/ });
  await expect(ajuda).toHaveAttribute('href', '/ajuda/criar-proposta-sem-reuniao');
  await expect(ajuda).toHaveAttribute('target', '_blank');
});
test('conexão com Google é navegação completa e botão tem estilo independente', async ({
  page,
}) => {
  await page.goto('/preview/agenda-conta');
  const conectar = page.getByRole('link', { name: 'Conectar Google Calendar' });
  await expect(conectar).toHaveAttribute(
    'href',
    '/api/integracoes/google-calendar/conectar?retorno=%2Fconta',
  );
  expect(await conectar.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(
    'rgba(0, 0, 0, 0)',
  );
  expect((await conectar.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole('link', { name: /Como conectar/ })).toHaveAttribute(
    'href',
    '/ajuda/conectar-google-agenda',
  );
});

test('gestão de entrega oferece orientação sem fechar a escolha em andamento', async ({ page }) => {
  await page.goto('/preview/sala-entrega?estado=execucao');
  await page.getByRole('button', { name: 'Pontual', exact: true }).click();
  const ajuda = page
    .getByRole('dialog')
    .getByRole('link', { name: /Entender os tipos de entrega/ });
  await expect(ajuda).toHaveAttribute('href', '/ajuda/entrega-pontual-recorrente');
  await expect(ajuda).toHaveAttribute('target', '_blank');
});
