import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('coach prioriza a pergunta, revela evidência e mantém histórico ao ocultar', async ({
  page,
}, info) => {
  await page.goto('/preview/live-coach');
  const painel = page.getByRole('complementary', { name: 'Live Coach privado' });
  const pergunta = painel.getByRole('heading');
  await expect(pergunta).toHaveText(
    'Quando um paciente espera duas horas, o que costuma acontecer com o agendamento?',
  );
  expect(
    await pergunta.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(20);
  await expect(painel.getByText('Dimensione o custo da espera.')).toBeHidden();
  const motivo = painel.getByText('Por que perguntar', { exact: true });
  await motivo.focus();
  await page.keyboard.press('Enter');
  await expect(painel.getByText('Dimensione o custo da espera.')).toBeVisible();
  await expect(painel.locator('blockquote')).toContainText('duas horas');
  await motivo.click();
  await page.screenshot({ path: info.outputPath('coach-pergunta.png') });
  await painel.getByRole('button', { name: 'Ocultar orientação atual' }).click();
  await expect(pergunta).toHaveText('Dê espaço para o cliente.');
  await expect(pergunta).toBeFocused();
  await painel.getByText('Orientações anteriores').click();
  await expect(painel.getByRole('listitem')).toContainText('Quando um paciente espera duas horas');
  await painel.getByText('Última fala', { exact: true }).click();
  await expect(painel.getByRole('region', { name: 'Trecho da conversa' })).toContainText(
    'quarenta mensagens',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).include('aside').analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
});

test('respeita movimento reduzido e mantém a pergunta inteira com zoom de texto', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/live-coach');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '24px';
  });
  const painel = page.getByRole('complementary');
  await expect(painel.getByRole('heading')).toBeVisible();
  expect(
    await painel
      .locator('i')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  expect(await painel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await painel.getByRole('button', { name: 'Ocultar orientação atual' }).scrollIntoViewIfNeeded();
  await expect(painel.getByRole('button', { name: 'Ocultar orientação atual' })).toBeInViewport();
});
