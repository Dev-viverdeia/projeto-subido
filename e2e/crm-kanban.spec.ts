import { expect, test } from '@playwright/test';

test.describe('CRM Kanban', () => {
  test('separa ganho e perda e preserva o motivo no card', async ({ page }, testInfo) => {
    await page.goto('/preview/crm');

    await expect(page.getByRole('heading', { name: 'Preparar' })).toBeVisible();
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('tab', { name: 'Descobrir: 1' }).click();
      await expect(page.getByRole('heading', { name: 'Descobrir' })).toBeVisible();
      await page.getByRole('tab', { name: 'Propor: 1' }).click();
      await expect(page.getByRole('heading', { name: 'Propor' })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Descobrir' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Propor' })).toBeVisible();
    }
    await page.getByText('Oportunidades encerradas', { exact: true }).click();
    await expect(page.getByText('Momento inadequado', { exact: true })).toBeVisible();
    await expect(page.getByText('Fechados', { exact: true })).toHaveCount(0);
  });

  test('o card inteiro move a oportunidade e a perda exige contexto', async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== 'mobile') {
      await page.setViewportSize({ width: 1920, height: 1080 });
    }
    await page.goto('/preview/crm');

    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Ações de Automação do atendimento' }).click();
      await page.getByRole('menuitem', { name: 'Marcar como perdida' }).click();
    } else {
      const card = page.getByRole('group', {
        name: /Automação do atendimento, Clínica Aurora\. Arraste/,
      });
      const origem = await card.boundingBox();
      expect(origem).not.toBeNull();
      if (!origem) return;

      await page.mouse.move(origem.x + origem.width * 0.46, origem.y + origem.height * 0.46);
      await page.mouse.down();
      await page.mouse.move(origem.x + 18, origem.y + 18, { steps: 4 });
      const destino = page.getByRole('group', { name: 'Marcar oportunidade como perdida' });
      await expect(destino).toBeVisible();
      const chegada = await destino.boundingBox();
      expect(chegada).not.toBeNull();
      if (!chegada) return;
      await page.mouse.move(chegada.x + chegada.width / 2, chegada.y + chegada.height / 2, {
        steps: 16,
      });
      await page.mouse.up();
    }

    const dialogo = page.getByRole('dialog', { name: 'Registrar oportunidade perdida' });
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Registrar como perdida' }).click();
    await expect(dialogo.getByText('Escolha o motivo para concluir o registro.')).toBeVisible();
    await dialogo.getByText('Não é prioridade agora', { exact: true }).click();
    await expect(dialogo.getByRole('radio', { name: 'Não é prioridade agora' })).toBeChecked();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });
});
