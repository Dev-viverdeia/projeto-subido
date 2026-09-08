import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('conquista é compacta, acessível e leva direto ao certificado', async ({ page }, info) => {
  await page.goto('/preview/shell?tela=aula&estado=concluido');
  const conquista = page.getByRole('region', { name: 'Conclusão da formação' });
  await expect(conquista.getByRole('heading')).toHaveText('Formação concluída');
  await expect(conquista).toContainText('Todas as 5 aulas concluídas.');
  const link = conquista.getByRole('link', { name: /Ver certificado/ });
  await expect(link).toHaveAttribute('href', '/certificados/formacao/formacao-de-chatgpt');
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect((await conquista.boundingBox())!.height).toBeLessThan(220);
  await link.focus();
  await expect(link).toBeFocused();
  expect(await link.evaluate((el) => getComputedStyle(el).boxShadow)).toContain('4px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  await page.screenshot({
    path: info.outputPath(`conclusao-${info.project.name}.png`),
    fullPage: true,
  });
});

test('conclusão aguarda salvar e não promete certificado durante uma falha', async ({ page }) => {
  for (const [estado, titulo] of [
    ['salvando-conclusao', 'Salvando conclusão…'],
    ['erro-conclusao', 'Conclusão não sincronizada'],
  ]) {
    await page.goto(`/preview/shell?tela=aula&estado=${estado}`);
    const conquista = page.getByRole('region', { name: 'Conclusão da formação' });
    await expect(conquista.getByRole('heading')).toHaveText(titulo!);
    await expect(conquista.getByRole('link', { name: /Ver certificado/ })).toHaveCount(0);
  }
});

test('terminar a última pendência mantém a pessoa na conquista e move o foco', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'subido_progresso_v1',
      JSON.stringify({
        aulas: Object.fromEntries([1, 2, 3, 4].map((n) => [`aula-${n}`, '2026-09-01T12:00:00Z'])),
        formacoes: {},
        etapas: {},
        solucoes: {},
      }),
    );
  });
  await page.goto('/preview/aula?ultima=1');
  await page.getByRole('button', { name: 'Concluir formação' }).click();
  await expect(page.getByRole('heading', { name: 'Formação concluída' })).toBeFocused();
  await expect(page.getByRole('link', { name: /Ver certificado/ })).toHaveAttribute(
    'href',
    '/certificados/formacao/formacao-de-chatgpt',
  );
  await expect(page).toHaveURL(/preview\/aula\?ultima=1/);
});

test('última aula não esconde aulas anteriores que ainda faltam', async ({ page }) => {
  await page.goto('/preview/aula?ultima=1');
  await page.getByRole('button', { name: 'Concluir aula' }).click();
  await expect(page.getByRole('link', { name: /Retomar aulas pendentes/ })).toHaveAttribute(
    'href',
    '/formacoes/formacao-de-chatgpt/aula/aula-1',
  );
  await expect(page.getByRole('link', { name: /Ver certificado/ })).toHaveCount(0);
});

test('conquista cabe em 320px com movimento reduzido', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/shell?tela=aula&estado=concluido');
  const conquista = page.getByRole('region', { name: 'Conclusão da formação' });
  const link = conquista.getByRole('link', { name: /Ver certificado/ });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  // O reset acessível do DS usa 0,01ms para preservar eventos de fim de transição.
  expect(
    await link.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);
  await expect(link).toBeVisible();
});
