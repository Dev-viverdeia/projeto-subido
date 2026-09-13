import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { conferirContrasteDasEtapas } from './helpers/estudio-contraste';

async function semOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}

test('Estúdio: tarefa inteira, salvamento confirmado e próxima tarefa explícita', async ({
  page,
}, info) => {
  await page.goto('/preview/estudio-sala?estado=execucao');
  const tarefa = page.getByRole('article');
  await expect(tarefa.getByRole('heading', { name: 'Construir o fluxo' })).toBeVisible();
  await expect(tarefa).toContainText('encaminhe para uma pessoa com o histórico completo');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  await page.screenshot({ path: info.outputPath('estudio-execucao.png'), fullPage: true });
  await tarefa.getByRole('button', { name: 'Concluir tarefa' }).click();
  await expect(tarefa.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
  await expect(tarefa.getByRole('button', { name: 'Reabrir tarefa' })).toBeEnabled();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
  await expect(tarefa.getByRole('heading', { name: 'Construir o fluxo' })).toBeFocused();
  await semOverflow(page);
  await page.screenshot({ path: info.outputPath('estudio-concluida.png'), fullPage: true });
  await tarefa.getByRole('button', { name: 'Abrir próxima tarefa' }).click();
  await expect(tarefa.getByRole('heading', { name: 'Testar com a equipe' })).toBeFocused();
  await expect(tarefa.getByRole('button', { name: 'Iniciar tarefa' })).toBeEnabled();
});

test('Estúdio: erro não vira conclusão e nova tentativa funciona', async ({ page }) => {
  await page.goto('/preview/estudio-sala?estado=erro');
  await page.getByRole('button', { name: 'Concluir tarefa' }).click();
  await expect(page.getByRole('article').getByRole('alert')).toContainText(
    'Não foi possível salvar',
  );
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  await expect(page.getByRole('heading', { name: 'Construir o fluxo' })).toBeVisible();
  await page.getByRole('button', { name: 'Concluir tarefa' }).click();
  await expect(page.getByRole('button', { name: 'Reabrir tarefa' })).toBeEnabled();
  await expect(page.getByRole('article').getByRole('alert')).toHaveCount(0);
});

test('Estúdio: ferramenta por teclado, detalhes recolhidos e etapas reais', async ({
  page,
}, info) => {
  await page.goto('/preview/estudio-sala?estado=preparar');
  const executar = page.getByRole('tab', { name: /Executar/ });
  await expect(executar).toHaveAttribute('aria-disabled', 'true');
  const preparar = page.getByRole('tab', { name: /^Preparar/ });
  await preparar.focus();
  await page.keyboard.press('ArrowRight');
  await expect(executar).toBeFocused();
  await expect(executar).toHaveAccessibleDescription('Escolha onde construir na etapa “Preparar”.');
  await page.keyboard.press('ArrowLeft');
  await expect(preparar).toBeFocused();
  const escolha = page.getByRole('radio', { name: 'Lovable + Supabase', exact: true });
  await escolha.focus();
  await page.keyboard.press('Space');
  await expect(escolha).toBeChecked();
  await expect(preparar).toHaveAttribute('aria-selected', 'true');
  await expect(executar).toHaveAttribute('aria-disabled', 'false');
  const prompt = page
    .locator('details')
    .filter({ has: page.locator('summary', { hasText: /^Prompt de partida$/ }) });
  await expect(prompt).not.toHaveAttribute('open');
  await prompt.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(prompt.locator('pre')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(prompt.locator('pre')).toBeHidden();
  await semOverflow(page);
  await page.screenshot({ path: info.outputPath('estudio-preparar.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Entender', exact: true }).click();
  await expect(page.getByRole('tab', { name: /Entender.*conclu/i })).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
});

test('Estúdio: filtros, lista mobile e conclusão não confundida com entrega', async ({ page }) => {
  await page.goto('/preview/estudio-sala?estado=execucao');
  const lista = page.getByRole('button', { name: /Ver tarefas/ });
  if (await lista.isVisible()) await lista.click();
  await page
    .getByRole('navigation', { name: 'Escolher tarefa' })
    .getByRole('button', { name: /Aprovar as respostas/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Aprovar as respostas' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Reabrir tarefa' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Filtrar por fase' }).selectOption('3');
  await page.getByRole('button', { name: /Concluídas/ }).click();
  await expect(page.getByRole('heading', { name: 'Nenhuma tarefa neste filtro' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todas as tarefas' }).click();
  await expect(page.getByRole('article')).toBeVisible();
  await page.goto('/preview/estudio-sala?estado=concluido');
  await expect(page.getByRole('status')).toContainText(
    'A entrega ao cliente é gerenciada em Entregas',
  );
  await expect(page.getByRole('tab', { name: /Executar.*Tarefas concluídas/ })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '6');
  await semOverflow(page);
});

test('Estúdio: 320px, tablet e desktop sem cortes e com contraste', async ({ page }, info) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/preview/estudio-sala?estado=execucao');
    await expect(page.getByRole('heading', { name: 'Construir o fluxo' })).toBeVisible();
    await semOverflow(page);
    await page.screenshot({ path: info.outputPath('estudio-' + width + '.png'), fullPage: true });
    await page.getByRole('tab', { name: /Preparar/ }).click();
    await expect(page.getByRole('heading', { name: 'Escolha onde construir' })).toBeVisible();
    await semOverflow(page);
    const resultado = await new AxeBuilder({ page }).include('main').analyze();
    expect(resultado.violations).toEqual([]);
    await page.screenshot({ path: info.outputPath('preparar-' + width + '.png'), fullPage: true });
  }
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Estúdio: contraste preservado durante a troca de etapas (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/preview/estudio-sala?estado=execucao');
    const abas = page.getByRole('tablist', { name: 'Etapas do projeto' }).getByRole('tab');
    await page.getByRole('tab', { name: /Preparar/ }).click();
    await conferirContrasteDasEtapas(abas);
    await page.keyboard.press('ArrowRight');
    await conferirContrasteDasEtapas(abas);
    await expect(page.getByRole('tab', { name: /Executar/ })).toBeFocused();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  });
}

test('Estúdio: foco, hover e bloqueio preservam a etapa selecionada', async ({ page }) => {
  await page.goto('/preview/estudio-sala?estado=preparar');
  const preparar = page.getByRole('tab', { name: /^Preparar/ });
  const executar = page.getByRole('tab', { name: /Executar/ });
  await preparar.click();
  await expect(preparar).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.keyboard.press('ArrowRight');
  await expect(executar).toBeFocused();
  expect(await executar.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(executar).not.toHaveCSS('box-shadow', 'none');
  await executar.hover();
  await expect(executar).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.keyboard.press('Enter');
  await expect(preparar).toHaveAttribute('aria-selected', 'true');
  await expect(executar).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('ArrowLeft');
  await expect(preparar).toBeFocused();
  await expect(preparar).not.toHaveCSS('box-shadow', 'none');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel')).toBeFocused();
  const medidas = await page.getByRole('tab').evaluateAll((abas) =>
    abas.map((aba) => {
      const { width, height } = aba.getBoundingClientRect();
      return { width, height };
    }),
  );
  expect(medidas.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true);
});

test('Estúdio: seleção e foco continuam distintos em alto contraste', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Emulação de forced-colors usa Chromium.');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/preview/estudio-sala?estado=execucao');
  const executar = page.getByRole('tab', { name: /Executar/ });
  await executar.click();
  await page.keyboard.press('ArrowLeft');
  const preparar = page.getByRole('tab', { name: /Preparar/ });
  await expect(preparar).toBeFocused();
  await expect(preparar).toHaveCSS('outline-style', 'solid');
  await expect(preparar).toHaveCSS('outline-width', '2px');
  const bordas = await preparar.evaluate((el) => ({
    selecionada: getComputedStyle(el).borderTopColor,
    inativas: Array.from(el.parentElement!.querySelectorAll('[aria-selected="false"]')).map(
      (aba) => getComputedStyle(aba).borderTopColor,
    ),
  }));
  expect(bordas.inativas.every((cor) => cor !== bordas.selecionada)).toBe(true);
  await page.screenshot({ path: info.outputPath('estudio-alto-contraste.png'), fullPage: true });
});

test('Projetos: tarefa em destaque, critério visível e conclusão sem saltar', async ({
  page,
}, info) => {
  await page.goto('/preview/shell?tela=projeto&estado=nina');
  await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
  await expect(page.getByText('Pronto quando', { exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Progresso do projeto' })).toHaveCount(1);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('projeto-implementar.png'), fullPage: true });
  // A moldura usa progresso fixo para screenshots; a Nina isolada permite gravar localmente.
  await page.goto('/preview/nina');
  await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
  const concluir = page.getByRole('button', { name: 'Concluir: Mapear a conversa até a reunião' });
  await concluir.click();
  await expect(
    page.getByRole('button', { name: 'Reabrir: Mapear a conversa até a reunião' }),
  ).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Passo concluído.' })).toBeVisible();
  await semOverflow(page);
  await page.getByRole('button', { name: 'Próximo passo', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Concluir: Definir qualificação e limites' }),
  ).toBeVisible();
});
