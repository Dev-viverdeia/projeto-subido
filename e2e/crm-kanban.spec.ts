import { expect, test } from '@playwright/test';

test.describe('CRM Kanban', () => {
  test('separa ganho e perda e preserva o motivo no card', async ({ page }) => {
    await page.goto('/preview/crm');

    await expect(page.getByText('Concluir oportunidade', { exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Marcar oportunidade como ganha' })).toBeVisible();
    await expect(
      page.getByRole('group', { name: 'Marcar oportunidade como perdida' }),
    ).toBeVisible();
    await page.getByText('Histórico de desfechos', { exact: true }).click();
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
      const destino = page.getByRole('group', { name: 'Marcar oportunidade como perdida' });
      const origem = await card.boundingBox();
      const chegada = await destino.boundingBox();
      expect(origem).not.toBeNull();
      expect(chegada).not.toBeNull();
      if (!origem || !chegada) return;

      await page.mouse.move(origem.x + origem.width * 0.46, origem.y + origem.height * 0.46);
      await page.mouse.down();
      await page.mouse.move(origem.x + 18, origem.y + 18, { steps: 4 });
      await page.mouse.move(chegada.x + chegada.width / 2, chegada.y + chegada.height / 2, {
        steps: 16,
      });
      await page.mouse.up();
    }

    const dialogo = page.getByRole('dialog', { name: 'Por que a oportunidade foi perdida?' });
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Registrar como perdida' }).click();
    await expect(dialogo.getByText('Escolha o motivo para concluir o registro.')).toBeVisible();
    await dialogo.getByText('Não é prioridade agora', { exact: true }).click();
    await expect(dialogo.getByRole('radio', { name: 'Não é prioridade agora' })).toBeChecked();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });
});
