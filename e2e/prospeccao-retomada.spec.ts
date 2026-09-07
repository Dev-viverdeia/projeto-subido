import { expect, test } from '@playwright/test';

test('retoma a lista sem prender a tela e mantém o aviso offline legível', async ({
  page,
}, info) => {
  await page.goto('/preview/prospeccao?retomada=1');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const abrir = page.getByRole('button', { name: 'Ver andamento' });
  await expect(abrir).toBeVisible();
  await page.context().setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: 'Montando sua lista' })).toContainText(
    'Sem conexão',
  );
  await abrir.click();
  const dialogo = page.getByRole('dialog', { name: 'Montando sua lista' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText(/Sem conexão/)).toBeVisible();
  await expect(dialogo.locator('[data-estado="concluida"]')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('prospeccao-offline.png') });
  await page.context().setOffline(false);
  await expect(dialogo.getByText(/Sem conexão/)).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialogo).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});

test('falha mantém o estorno e a ação de recuperação visíveis', async ({ page }, info) => {
  await page.goto('/preview/prospeccao?resultado=falhou');
  const dialogo = page.getByRole('alertdialog');
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText('10 devolvidos ao saldo')).toBeVisible();
  const acao = dialogo.getByRole('button', { name: 'Ajustar e tentar de novo' });
  await expect(acao).toBeVisible();
  const caixa = await acao.boundingBox();
  expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.screenshot({ path: info.outputPath('prospeccao-falha.png') });
});
