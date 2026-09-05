import { expect, test } from '@playwright/test';

test('reagendamento fica inteiro na viewport e cancelamento exige confirmação', async ({
  page,
}, testInfo) => {
  await page.goto('/preview/calls?calendar=1&editar=1');
  const dialogo = page.getByRole('dialog', { name: 'Alterar reunião', exact: true });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByLabel('Data e horário')).toBeVisible();
  await expect(dialogo.getByRole('button', { name: 'Salvar novo horário' })).toBeInViewport();
  const caixa = await dialogo.boundingBox();
  expect(caixa!.x).toBeGreaterThanOrEqual(0);
  expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(
    await dialogo
      .getByLabel('Data e horário')
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await dialogo.screenshot({ path: `/tmp/subido-agenda-${testInfo.project.name}-20260905.png` });
  await dialogo.getByRole('button', { name: 'Cancelar reunião', exact: true }).click();
  const confirmar = page.getByRole('dialog', { name: 'Cancelar esta reunião?' });
  await expect(confirmar).toBeVisible();
  await expect(
    confirmar.getByRole('button', { name: 'Cancelar reunião', exact: true }),
  ).toBeInViewport();
  await confirmar.getByRole('button', { name: 'Manter reunião' }).click();
  await expect(dialogo.getByLabel('Duração (minutos)')).toHaveValue('45');
  await dialogo.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(dialogo).not.toBeVisible();
});

test('convite pendente permanece visível ao recarregar a agenda', async ({ page }) => {
  await page.goto('/preview/calls?calendar=1&convite=falhou');
  await expect(page.getByText('Convite pendente', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Atualizar convite' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('retorno do Google recupera rascunho e o apaga ao cancelar', async ({ page }) => {
  await page.goto('/preview/calls?calendar=1');
  await page.evaluate(() =>
    sessionStorage.setItem(
      'subido:agenda:rascunho:preview-agenda',
      JSON.stringify({
        salvoEm: Date.now(),
        campos: {
          oportunidade: '22222222-2222-4222-8222-222222222222',
          tipo: 'descoberta',
          titulo: 'Retorno da reunião QA',
          agendadaPara: '2099-10-10T15:00',
          duracao: '60',
          convidadoEmail: 'cliente@example.com',
          liveCoach: '',
        },
      }),
    ),
  );
  await page.goto('/preview/calls?calendar=1&modal=1');
  const dialogo = page.getByRole('dialog', { name: 'Agendar reunião', exact: true });
  await expect(dialogo.getByLabel('Título (opcional)')).toHaveValue('Retorno da reunião QA');
  await expect(dialogo.getByLabel('E-mail do cliente')).toHaveValue('cliente@example.com');
  await expect(dialogo.getByRole('checkbox')).not.toBeChecked();
  await dialogo.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(
    await page.evaluate(() => sessionStorage.getItem('subido:agenda:rascunho:preview-agenda')),
  ).toBeNull();
});
