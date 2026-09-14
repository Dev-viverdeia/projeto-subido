import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const modo of ['agendar', 'reagendar']) {
  test(`${modo}: conflito no formulário, escolha explícita e sem envio real`, async ({
    page,
  }, info) => {
    const posts: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST') posts.push(r.url());
    });
    await page.goto(`/preview/conflitos-agenda?modo=${modo}`);
    const botao = page.getByRole('button', {
      name: modo === 'agendar' ? 'Criar reunião e enviar convite' : 'Salvar novo horário',
      exact: true,
    });
    await botao.click();
    const aviso = page.getByRole('region', { name: 'Você já tem uma reunião neste horário' });
    await expect(aviso).toBeVisible();
    await expect(aviso).toBeFocused();
    expect(
      await aviso.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft)),
    ).toBeGreaterThanOrEqual(16);
    await expect(aviso.getByText('Kickoff do atendimento · Moura Imóveis')).toBeVisible();
    const aceite = aviso.getByRole('checkbox');
    await expect(aceite).not.toBeChecked();
    await expect(botao).toBeInViewport();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`${modo}-conflito.png`) });
    await aceite.focus();
    await aceite.press('Space');
    await expect(aceite).toBeChecked();
    await page.getByLabel('Duração (minutos)').fill('60');
    await expect(aviso).toHaveCount(0);
    await botao.click();
    await expect(aceite).toBeVisible();
    await expect(aceite).not.toBeChecked();
    await aceite.check();
    await botao.click();
    await expect(
      page.getByText(
        modo === 'agendar'
          ? 'Simulação concluída. Nenhum convite foi enviado.'
          : 'Horário atualizado',
        { exact: true },
      ),
    ).toBeVisible();
    expect(posts).toEqual([]);
  });
}

test('muitos conflitos em 320px mantêm leitura e ações alcançáveis', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/conflitos-agenda?modo=reagendar&varios=1');
  await page.getByRole('button', { name: 'Salvar novo horário' }).click();
  const aviso = page.getByRole('region', { name: '9 reuniões coincidem com este horário' });
  await expect(aviso).toBeVisible();
  await expect(aviso.locator('li')).toHaveCount(5);
  await expect(aviso.getByText('E mais 4 reuniões nesse intervalo.')).toBeVisible();
  await aviso.getByRole('checkbox').scrollIntoViewIfNeeded();
  await expect(aviso.getByRole('checkbox')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Salvar novo horário' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('conflitos-320.png') });
});
