import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('cliente mostra suas pendências e abre a validação com foco', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/sala-entrega?estado=validacao');
  const nav = page.getByRole('navigation', { name: 'Áreas da entrega' });
  await nav.getByRole('button', { name: /Cliente.*pendência/ }).click();
  const fila = page.getByRole('region', { name: 'Com o cliente' });
  await expect(fila.getByRole('button', { name: /Ver validação:/ })).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('cliente-pendencias.png'), fullPage: false });
  await fila.getByRole('button', { name: /Ver validação:/ }).click();
  await expect(page.locator('#validacao-cliente')).toBeFocused();
  await expect(page.getByText('Agora é com o cliente.')).toBeInViewport();
  await expect(nav.getByRole('button', { name: 'Trabalho', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const resultado = await new AxeBuilder({ page }).analyze();
  expect(
    resultado.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
});

test('execução e recorrência têm gestão visível e navegação sem corte', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const estado of ['execucao', 'recorrente', 'pontual-concluido']) {
    await page.goto(`/preview/sala-entrega?estado=${estado}`);
    const gestao = page.getByRole('region', { name: 'Gestão da entrega' });
    await expect(gestao).toBeInViewport();
    await expect(gestao.locator('xpath=ancestor::header')).toHaveCount(1);
    await page.screenshot({ path: info.outputPath(`${estado}.png`), fullPage: false });
    const resultado = await new AxeBuilder({ page }).analyze();
    expect(
      resultado.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
      estado,
    ).toEqual([]);
    if (info.project.name === 'desktop') {
      for (const width of [320, 390, 600, 768, 1080, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const medida = await page.evaluate(() => ({
          largura: document.documentElement.scrollWidth,
          viewport: innerWidth,
        }));
        expect(medida.largura, `${estado} em ${width}px`).toBeLessThanOrEqual(medida.viewport);
        const botoes = page
          .getByRole('navigation', { name: 'Áreas da entrega' })
          .getByRole('button');
        for (const botao of await botoes.all()) {
          const caixa = await botao.boundingBox();
          expect(caixa!.height).toBeGreaterThanOrEqual(44);
          const semCorte = await botao.evaluate((el) => el.scrollWidth <= el.clientWidth);
          expect(semCorte).toBe(true);
        }
      }
    }
  }
});
