import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function semOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}

test.describe('Leitura essencial', () => {
  test('funil direto, detalhes por teclado e números legíveis', async ({ page }, testInfo) => {
    await page.goto('/preview/metricas');
    const funil = page.getByRole('region', { name: 'Funil de vendas' });
    await expect(funil.getByRole('listitem')).toHaveCount(5);
    await expect(funil.getByText('42', { exact: true })).toBeVisible();
    await expect(page.getByRole('table')).toBeHidden();
    const resumo = page.locator('summary', { hasText: 'Comparações e taxas' });
    await resumo.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('table').getByRole('row')).toHaveCount(7);
    await semOverflow(page);
    const acessibilidade = await new AxeBuilder({ page }).include('main').analyze();
    expect(
      acessibilidade.violations.filter(
        (item) => item.impact === 'serious' || item.impact === 'critical',
      ),
    ).toEqual([]);
    const tamanho = await funil
      .locator('li')
      .first()
      .evaluate((li) => parseFloat(getComputedStyle(li.querySelector('span')!).fontSize));
    expect(tamanho).toBeGreaterThanOrEqual(14);
    await page.screenshot({ path: testInfo.outputPath('metricas-detalhes.png'), fullPage: true });
    await resumo.press('Enter');
    await expect(page.getByRole('table')).toBeHidden();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath('metricas-essencial.png'), fullPage: true });
  });

  test('zero é zero e os volumes não precisam diminuir em sequência', async ({ page }) => {
    await page.goto('/preview/metricas?estado=vazio');
    await expect(
      page.getByRole('region', { name: 'Funil de vendas' }).getByText('Sem base'),
    ).toBeVisible();
    const larguras = await page
      .locator('[data-indicador] [style]')
      .evaluateAll((barras) => barras.map((barra) => barra.getBoundingClientRect().width));
    expect(larguras).toEqual([0, 0, 0, 0, 0]);
    await expect(page.getByRole('link', { name: 'Criar lista' })).toBeVisible();
    await page.goto('/preview/metricas?estado=avulso');
    const largura = async (id: string) =>
      page
        .locator(`[data-indicador="${id}"] [style]`)
        .evaluate((el) => el.getBoundingClientRect().width);
    expect(await largura('oportunidades')).toBeGreaterThan(await largura('abordagens'));
    await page.locator('summary', { hasText: 'Comparações e taxas' }).click();
    await expect(page.getByText('900%', { exact: true })).toBeVisible();
    await semOverflow(page);
    await page.goto('/preview/metricas?estado=total');
    await page.locator('summary', { hasText: 'Comparações e taxas' }).click();
    await expect(page.getByText(/Não há período anterior para comparar/)).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
  });

  test('primeira prospecção usa o formulário sem um segundo tutorial', async ({
    page,
  }, testInfo) => {
    await page.goto('/preview/shell?tela=prospeccao');
    await expect(page.getByText('Suas listas aparecerão aqui.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Buscar empresas/ })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: /Tipo de empresa/ })).toBeVisible();
    await expect(page.getByText('Listas', { exact: true })).toHaveCount(0);
    await semOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath('prospeccao-essencial.png'),
      fullPage: true,
    });
  });

  test('jornada compacta mantém etapa atual e conclusão explícitas', async ({ page }, testInfo) => {
    await page.goto('/preview/crm-dossie?entrada=1');
    const jornada = page.getByRole('list', { name: 'Jornada deste cliente' });
    await expect(jornada.getByRole('listitem')).toHaveCount(5);
    await expect(jornada.locator('[aria-current="step"]')).toHaveCount(1);
    const rotulosInteiros = await jornada
      .locator('strong')
      .evaluateAll((rotulos) =>
        rotulos.every(
          (rotulo) =>
            rotulo.getBoundingClientRect().height <=
            parseFloat(getComputedStyle(rotulo).lineHeight) + 1,
        ),
      );
    expect(rotulosInteiros).toBe(true);
    await expect(jornada.getByRole('listitem', { name: 'Preparar: Em andamento' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar reunião' }).first()).toBeVisible();
    await semOverflow(page);
    await jornada.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('jornada-essencial.png') });
    await page.goto('/preview/crm-dossie?resultado=ganho');
    await expect(jornada.locator('[data-estado="concluida"]')).toHaveCount(3);
    await expect(jornada.locator('[data-estado="concluida"] svg')).toHaveCount(3);
    await page.goto('/preview/crm-dossie?resultado=perdido');
    await expect(
      jornada.getByRole('listitem', { name: 'Descobrir: Encerrada aqui' }),
    ).toBeVisible();
    await expect(jornada.locator('[data-estado="encerrada"] svg')).toBeVisible();
    await semOverflow(page);
  });

  test('loading preserva a estrutura clara sem números fictícios', async ({ page }) => {
    await page.goto('/preview/shell?tela=metricas&estado=carregando');
    await expect(page.getByRole('status')).toHaveText('Carregando métricas…');
    await expect(page.getByRole('heading', { name: 'Métricas', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Organizar/ })).toHaveCount(0);
    await semOverflow(page);
  });
});
