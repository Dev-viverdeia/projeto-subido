import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('mesa de execução', () => {
  test('troca etapas e tarefas sem procurar a navegação no fim da página', async ({ page }) => {
    await page.goto('/preview/sala-entrega?estado=execucao');
    const navegacao = page.getByRole('navigation', { name: 'Fases da entrega' });
    const compacta = await navegacao
      .getByRole('combobox', { name: 'Etapa', exact: true })
      .isVisible();
    if (compacta) {
      await navegacao
        .getByRole('combobox', { name: 'Tarefa', exact: true })
        .selectOption({ label: 'Configurar o canal oficial · Pendente' });
    } else {
      await navegacao
        .getByRole('button', { name: 'Abrir tarefa Configurar o canal oficial' })
        .click();
    }
    await expect(
      page.getByRole('heading', { name: 'Configurar o canal oficial', exact: true }),
    ).toBeVisible();
    if (compacta) {
      await navegacao
        .getByRole('combobox', { name: 'Etapa', exact: true })
        .selectOption({ label: 'Entender · 2/2' });
    } else {
      await navegacao.getByRole('button', { name: /Entender/ }).click();
    }
    await expect(page.getByRole('heading', { name: 'Resultado registrado' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Concluir tarefa' })).toHaveCount(0);
    await expect(page.getByRole('main')).toHaveCount(1);
    const navegacaoY = await navegacao.boundingBox();
    const registroY = await page
      .getByRole('heading', { name: 'Resultado registrado' })
      .boundingBox();
    expect(navegacaoY!.y).toBeLessThan(registroY!.y);
  });

  test('consulta guia e modelo pelo teclado sem perder o registro em edição', async ({ page }) => {
    await page.goto('/preview/sala-entrega?estado=execucao');
    const registro = page.getByRole('textbox', { name: 'Resultado e teste realizado' });
    await registro.fill('Testei as dez perguntas e registrei as fontes.');
    await page.getByRole('button', { name: 'Abrir guia' }).click();
    const roteiro = page.getByRole('tab', { name: /Passo a passo/ });
    await roteiro.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Modelo pronto' })).toBeFocused();
    await expect(page.getByRole('region', { name: 'Modelo: Base de respostas' })).toBeVisible();
    await expect(registro).toHaveValue('Testei as dez perguntas e registrei as fontes.');
    let auditoria = await new AxeBuilder({ page }).analyze();
    expect(
      auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
    ).toEqual([]);
    await page.keyboard.press('Home');
    await expect(
      page.getByText('Teste dez perguntas com o responsável antes de publicar.'),
    ).toBeVisible();
    auditoria = await new AxeBuilder({ page }).analyze();
    expect(
      auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
    ).toEqual([]);
    await page.getByRole('button', { name: 'Fechar guia' }).click();
    await expect(registro).toHaveValue('Testei as dez perguntas e registrei as fontes.');
    await expect(page.getByRole('button', { name: 'Concluir tarefa' })).toBeEnabled();
  });

  test('mantém os limites de layout nas transições de tamanho', async ({ page }, info) => {
    test.skip(
      info.project.name !== 'desktop',
      'A matriz usa redimensionamento do navegador desktop.',
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/preview/sala-entrega?estado=execucao');
    for (const width of [
      360, 390, 599, 600, 767, 768, 899, 900, 1079, 1080, 1279, 1280, 1439, 1440,
    ]) {
      await page.setViewportSize({ width, height: 900 });
      const medida = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      expect(medida.doc, `overflow em ${width}px`).toBeLessThanOrEqual(medida.viewport);
      const tarefa = page.locator('#tarefa-em-foco');
      const caixa = await tarefa.boundingBox();
      expect(caixa!.x).toBeGreaterThanOrEqual(0);
      expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(width + 1);
    }
  });
});
