import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const tela of ['formacoes', 'projetos'] as const) {
  test(`${tela}: a primeira ação aparece sem rolar e os cards são legíveis`, async ({
    page,
  }, info) => {
    await page.goto(`/preview/shell?tela=${tela}`);
    const conteudo = page.getByRole('main');
    const primeiro = conteudo
      .getByRole('link', { name: tela === 'formacoes' ? /Começar formação/ : /Comece por aqui/ })
      .first();
    await expect(primeiro).toBeVisible();
    const acao = primeiro.getByText(tela === 'formacoes' ? 'Começar formação' : 'Ver projeto', {
      exact: true,
    });
    await expect(acao).toBeInViewport();
    const caixa = await acao.boundingBox();
    expect(caixa!.y + caixa!.height).toBeLessThan(
      page.viewportSize()!.height - (info.project.name === 'mobile' ? 74 : 0),
    );
    const tamanhos = await conteudo
      .locator('h3')
      .evaluateAll((titulos) =>
        titulos.map((titulo) => parseFloat(getComputedStyle(titulo).fontSize)),
      );
    expect(tamanhos.length).toBeGreaterThan(0);
    expect(tamanhos.every((tamanho) => tamanho >= 20)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
      [],
    );
    await page.screenshot({
      path: info.outputPath(`${tela}-${info.project.name}.png`),
      fullPage: true,
    });
  });

  test(`${tela}: 320px, teclado e movimento reduzido sem recortes`, async ({ page }, info) => {
    await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 1280, height: 740 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/preview/shell?tela=${tela}`);
    const cards = page
      .getByRole('main')
      .getByRole('link', { name: tela === 'formacoes' ? /Começar formação/ : /Ver projeto/ });
    await expect(cards).toHaveCount(tela === 'formacoes' ? 4 : 5);
    const ultimo = cards.last();
    await ultimo.scrollIntoViewIfNeeded();
    await page.keyboard.press('Tab');
    await ultimo.focus();
    await expect(ultimo).toBeFocused();
    const estilo = await ultimo.evaluate((el) => ({
      shadow: getComputedStyle(el).boxShadow,
      transition: getComputedStyle(el).transitionDuration,
    }));
    expect(estilo.shadow).toContain('4px');
    expect(parseFloat(estilo.transition)).toBeLessThanOrEqual(0.00001);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
  });

  for (const estado of ['andamento', 'concluido', 'vazio', 'carregando']) {
    test(`${tela}: estado ${estado} acessível e sem promessas contraditórias`, async ({
      page,
    }, info) => {
      await page.goto(`/preview/${tela}?estado=${estado}`);
      if (estado === 'andamento') {
        const retomar = page.getByRole('link', { name: /Continue de onde parou/ });
        await expect(retomar).toBeVisible();
        await expect(retomar).toContainText('2 de 5');
      } else if (estado === 'concluido') {
        await expect(page.getByText('Comece aqui', { exact: true })).toHaveCount(0);
        await expect(page.getByText('Comece por aqui', { exact: true })).toHaveCount(0);
        await expect(page.getByRole('link', { name: /Revisar (formação|projeto)/ })).toHaveCount(
          tela === 'formacoes' ? 4 : 5,
        );
        await expect(
          page.getByText(tela === 'formacoes' ? 'Formações concluídas' : 'Projeto concluído', {
            exact: true,
          }),
        ).toBeVisible();
      } else if (estado === 'vazio') {
        await expect(
          page.getByRole('heading', {
            name:
              tela === 'formacoes' ? 'Nenhuma formação disponível' : 'Nenhum projeto disponível',
          }),
        ).toBeVisible();
        await expect(page.getByText(/concluíd[oa]s?/)).toHaveCount(0);
      } else {
        await expect(page.getByRole('status', { name: /Carregando/ })).toHaveCount(1);
        await expect(page.getByText(/Preparando sua trilha|Preparando seus projetos/)).toHaveCount(
          0,
        );
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        page.viewportSize()!.width,
      );
      const axe = await new AxeBuilder({ page }).analyze();
      expect(
        axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
      ).toEqual([]);
      if (estado === 'concluido')
        await page.screenshot({
          path: info.outputPath(`${tela}-concluido-${info.project.name}.png`),
          fullPage: true,
        });
    });
  }
}

test('Formações não duplica o curso recomendado nem exibe numeração ornamental', async ({
  page,
}) => {
  await page.goto('/preview/formacoes');
  const grade = page.getByRole('list', { name: 'Formações em ordem recomendada' });
  await expect(grade.getByRole('link')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'ChatGPT para o trabalho' })).toHaveCount(1);
  await expect(page.getByText('01', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Aprenda. Aplique no trabalho.')).toHaveCount(0);
});
