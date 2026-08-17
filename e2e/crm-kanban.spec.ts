import { expect, test } from '@playwright/test';

test.describe('CRM Kanban', () => {
  test('separa ganho e perda e preserva o motivo no card', async ({ page }) => {
    await page.goto('/preview/crm');

    await expect(page.getByRole('heading', { name: 'Desfecho' })).toBeVisible();
    await expect(page.getByText('Ganhas', { exact: true })).toBeVisible();
    await expect(page.getByText('Perdidas', { exact: true })).toBeVisible();
    await expect(page.getByText('Momento inadequado', { exact: true })).toBeVisible();
    await expect(page.getByText('Fechados', { exact: true })).toHaveCount(0);
  });

  test('arrastar para Perdidas exige contexto antes de encerrar', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile',
      'O celular usa o menu Mover como rota principal.',
    );
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/preview/crm');

    const alca = page.getByRole('button', { name: 'Arrastar Automação do atendimento' });
    const destino = page.getByText('Perdidas', { exact: true });
    const origem = await alca.boundingBox();
    const chegada = await destino.boundingBox();
    expect(origem).not.toBeNull();
    expect(chegada).not.toBeNull();
    if (!origem || !chegada) return;

    await page.mouse.move(origem.x + origem.width / 2, origem.y + origem.height / 2);
    await page.mouse.down();
    await page.mouse.move(origem.x + 18, origem.y + 18, { steps: 4 });
    await page.mouse.move(chegada.x + chegada.width / 2, chegada.y + chegada.height / 2, {
      steps: 16,
    });
    await page.mouse.up();

    const dialogo = page.getByRole('dialog', { name: 'Registrar oportunidade perdida' });
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Registrar perda' }).click();
    await expect(dialogo.getByText('Escolha o motivo para concluir o registro.')).toBeVisible();
    await dialogo.getByText('Não é prioridade agora', { exact: true }).click();
    await expect(dialogo.getByRole('radio', { name: 'Não é prioridade agora' })).toBeChecked();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });
});
