import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const tela of ['formacao', 'aula', 'projeto']) {
  test(`${tela}: legível dentro do shell, sem recortes ou erros de acessibilidade`, async ({
    page,
  }, info) => {
    const erros: string[] = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    await page.goto(`/preview/shell?tela=${tela}`);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    if (tela === 'aula')
      await expect(page.getByRole('button', { name: 'Concluir e avançar' })).toBeInViewport();
    if (tela === 'formacao')
      await expect(
        page.getByRole('link', { name: 'Começar formação', exact: true }),
      ).toBeInViewport();
    if (tela === 'projeto')
      await expect(page.getByRole('button', { name: /Assistir:/ })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
      [],
    );
    expect(erros).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`${tela}-${info.project.name}.png`),
      fullPage: true,
    });
  });

  test(`${tela}: 320px e movimento reduzido`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/preview/shell?tela=${tela}`);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    if (tela === 'aula') {
      const concluir = page.getByRole('button', { name: 'Concluir e avançar' });
      await expect(concluir).toBeInViewport();
      expect((await concluir.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });
}

test('playlist mobile abre por cima do shell, fecha com Escape e devolve o foco', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/preview/shell?tela=aula&estado=andamento');
  const abrir = page.getByRole('button', { name: 'Ver as aulas do curso' });
  await abrir.click();
  const dialogo = page.getByRole('dialog', { name: 'Aulas do curso' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.locator('a[aria-current="page"]')).toContainText('Pesquisa e síntese');
  await expect(dialogo.getByRole('link', { name: /Criando um fluxo/ })).toBeVisible();
  const bounds = await dialogo.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.height).toBeLessThanOrEqual(844);
  await page.keyboard.press('Escape');
  await expect(dialogo).toHaveCount(0);
  await expect(abrir).toBeFocused();
});

test('em 1040px a playlist continua disponível pelo botão, sem coluna perdida', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1040, height: 900 });
  await page.goto('/preview/shell?tela=aula');
  await expect(page.getByRole('button', { name: 'Ver as aulas do curso' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Aulas do curso' })).toBeHidden();
});

test('projeto: as cinco fases, o kit e o teclado levam ao conteúdo correto', async ({ page }) => {
  await page.goto('/preview/shell?tela=projeto');
  const aprender = page.getByRole('tab', { name: 'Aprender' });
  await aprender.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Implementar');
  const fases = page.getByRole('navigation', { name: 'Fases do projeto' });
  for (const fase of ['Entender', 'Preparar', 'Construir', 'Validar', 'Entregar']) {
    await fases.getByRole('button', { name: new RegExp(fase) }).click();
    await expect(page.getByRole('heading', { level: 2, name: fase, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: /Abrir kit de implementação/ }).click();
  await expect(page.getByRole('tab', { name: 'Materiais' })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Materiais');
  await page.keyboard.press('Home');
  await expect(aprender).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Aulas do projeto' })).toBeVisible();
});

test('formação concluída mostra certificado e revisão, não outra primeira aula', async ({
  page,
}) => {
  await page.goto('/preview/shell?tela=formacao&estado=concluido');
  await expect(page.getByRole('link', { name: 'Ver certificado' })).toHaveAttribute(
    'href',
    '/certificados/formacao/formacao-de-chatgpt',
  );
  await expect(page.getByRole('link', { name: 'Começar formação', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Como conversar com a IA/ })).toHaveAttribute(
    'href',
    '/formacoes/formacao-de-chatgpt/aula/aula-1',
  );
});
