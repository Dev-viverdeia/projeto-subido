import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TEXTO_LONGO } from '../src/app/preview/consultor-conversa/leitura.fixture';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/consultor/**', (route) =>
    route.fulfill({ status: 401, json: { erro: 'IA bloqueada no teste' } }),
  );
  await page.route('**/*.supabase.co/**', (route) => route.abort('failed'));
});

test('resposta longa abre por teclado, sem perder texto nem rascunho', async ({ page }) => {
  await page.goto('/preview/consultor-conversa?leitura=longa');
  const campo = page.getByRole('textbox');
  await campo.fill('Minha próxima pergunta');
  const texto = page.locator('[data-texto-resposta]');
  await expect(texto.locator('p').first()).toBeInViewport();
  await expect(texto.locator('details')).not.toHaveAttribute('open');
  await expect(texto).toContainText(TEXTO_LONGO.split('\n\n')[0]);
  const abrir = texto.locator('summary');
  await abrir.focus();
  await page.keyboard.press('Enter');
  await expect(texto.locator('details')).toHaveAttribute('open');
  await expect(texto.locator('p')).toHaveText(TEXTO_LONGO.split('\n\n'));
  await expect(texto.locator('p').last()).toBeVisible();
  await abrir.press('Space');
  await expect(texto.locator('details')).not.toHaveAttribute('open');
  await expect(abrir).toBeFocused();
  await expect(campo).toHaveValue('Minha próxima pergunta');
});

test('copiar inclui os parágrafos recolhidos', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (texto: string) => {
          sessionStorage.setItem('qa-copia', texto);
        },
      },
    });
  });
  await page.goto('/preview/consultor-conversa?leitura=longa');
  await page.getByRole('button', { name: 'Copiar a resposta do Sobral AI' }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('qa-copia'))).toBe(TEXTO_LONGO);
});

test('texto e recomendações abrem mesmo sem JavaScript', async ({ browser, baseURL }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  const pagina = await contexto.newPage();
  try {
    await pagina.goto(`${baseURL}/preview/consultor-conversa?leitura=sem-acao`);
    await pagina.locator('[data-texto-resposta] summary').click();
    await expect(pagina.locator('[data-texto-resposta] p').last()).toBeVisible();
    await pagina
      .getByRole('region', { name: 'Conteúdos recomendados' })
      .locator('summary')
      .filter({ hasText: 'Mais 2 recomendações' })
      .click();
    await expect(pagina.getByRole('link', { name: /Abrir formação: Fundamentos/ })).toBeVisible();
  } finally {
    await contexto.close();
  }
});

test('recomendações têm destinos preservados e motivo completo sob demanda', async ({ page }) => {
  await page.goto('/preview/consultor-conversa?leitura=sem-acao');
  const recursos = page.getByRole('region', { name: 'Conteúdos recomendados' });
  await expect(recursos.getByRole('link')).toHaveCount(1);
  await expect(recursos.getByRole('link')).toHaveAttribute(
    'href',
    '/solucoes/sdr-atendimento-qualificacao',
  );
  await recursos.locator('summary').filter({ hasText: 'Por que esta indicação?' }).first().click();
  await expect(recursos.getByText(/Use o passo a passo da Nina/)).toBeVisible();
  await recursos.locator('summary').filter({ hasText: 'Mais 2 recomendações' }).click();
  await expect(recursos.getByRole('link')).toHaveCount(3);
  await expect(recursos.getByRole('link', { name: /Abrir formação/ })).toHaveAttribute(
    'href',
    '/formacoes',
  );
  await recursos.getByRole('link', { name: /Ver no projeto/ }).focus();
  await expect(recursos.getByRole('link', { name: /Ver no projeto/ })).toBeFocused();
});

test('há uma só ação de vendas e a revisão continua exigindo confirmação', async ({ page }) => {
  await page.goto('/preview/consultor-conversa?leitura=longa');
  await expect(
    page.getByRole('complementary', { name: 'Plano gerado nesta resposta' }),
  ).toHaveCount(0);
  const acao = page.getByRole('complementary', { name: 'Ação pronta para revisar' });
  await expect(acao).toHaveCount(1);
  await expect(acao.getByRole('button', { name: 'Revisar' })).toHaveCount(1);
  await acao.locator('summary').click();
  await expect(acao.getByRole('link', { name: 'Abrir ficha' })).toHaveAttribute(
    'href',
    '/vendas/11111111-1111-4111-8111-111111111111',
  );
  await acao.getByRole('button', { name: 'Revisar' }).click();
  await expect(page.getByText('Nada muda antes desta confirmação.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar revisão da ação' }).click();
  await page.getByRole('button', { name: 'Revisar', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar na ficha' }).click();
  await expect(page.getByText('Nada muda antes desta confirmação.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Concluir/ })).toBeVisible();
});

test('resposta curta não cria dobra e ação geral usa um destino claro', async ({ page }) => {
  await page.goto('/preview/consultor-conversa?leitura=curta');
  await expect(page.locator('[data-texto-resposta] details')).toHaveCount(0);
  await page.goto('/preview/consultor-conversa?leitura=geral');
  const acao = page.getByRole('complementary', { name: 'Próximo passo sugerido' });
  await expect(acao.getByRole('link', { name: 'Ver vendas' })).toHaveAttribute('href', '/vendas');
  await acao.locator('summary').click();
  await expect(acao.getByText('Resultado esperado')).toBeVisible();
  await page.goto('/preview/consultor-conversa?leitura=sem-cartoes');
  await expect(page.getByRole('region', { name: 'Conteúdos recomendados' })).toHaveCount(0);
});

test('leitura e controles acessíveis, sem transbordar em tela estreita', async ({ page }, info) => {
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/consultor-conversa?leitura=longa');
  const leitura = page.locator('[data-leitura-conversa]');
  await page.screenshot({ path: info.outputPath('leitura-recolhida.png') });
  await page.locator('[data-texto-resposta] summary').click();
  await page
    .getByRole('region', { name: 'Conteúdos recomendados' })
    .locator('summary')
    .filter({ hasText: 'Mais 2 recomendações' })
    .click();
  const indicacoes = page.locator('summary').filter({ hasText: 'Por que esta indicação?' });
  for (const item of await indicacoes.all()) await item.click();
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-leitura-conversa]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(await leitura.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  const font = await page
    .locator('[data-texto-resposta] p')
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(font).toBeGreaterThanOrEqual(16);
  await page.screenshot({ path: info.outputPath('leitura-expandida.png') });
});
