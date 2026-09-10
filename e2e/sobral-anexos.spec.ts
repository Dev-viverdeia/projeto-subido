import { expect, test } from '@playwright/test';

test('o áudio mantém o player e a recuperação ocupa o lugar da saudação', async ({ page }) => {
  await page.goto('/preview/consultor');
  const saudacao = page.getByRole('heading', { name: /Vamos ao que importa/ });
  await expect(saudacao).toBeVisible();
  await page.getByLabel('Selecionar arquivos para a conversa').setInputFiles({
    name: 'duvida.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.from('UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA', 'base64'),
  });
  await expect(page.getByRole('button', { name: 'Reproduzir áudio' })).toBeVisible();
  await expect(page.getByText('Pronto para enviar')).toBeVisible();
  // Preview não tem sessão: falha antes de upload/IA, exercitando recuperação real.
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retomar envio' })).toBeVisible();
  await expect(saudacao).toBeHidden();
  await expect(page.getByText('Envio pausado')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0');
  await expect(page.getByRole('textbox')).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath('audio-recuperavel.png') });
  await page.getByRole('button', { name: 'Voltar à edição' }).click();
  await expect(saudacao).toBeVisible();
  await expect(page.getByText('Pronto para enviar')).toBeVisible();
  await expect(page.getByRole('textbox')).toBeEnabled();
});

test('imagem e documento ficam no rascunho quando a conexão cai', async ({ page, context }) => {
  await page.goto('/preview/consultor');
  await page.getByRole('textbox').fill('Confira estes dados antes da reunião.');
  await page.getByLabel('Selecionar arquivos para a conversa').setInputFiles([
    {
      name: 'referencia.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXxkAAAAASUVORK5CYII=',
        'base64',
      ),
    },
    { name: 'resumo.txt', mimeType: 'text/plain', buffer: Buffer.from('Resumo da reunião') },
  ]);
  await expect(page.getByRole('img', { name: 'referencia.png' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Visualizar referencia.png' })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Nova conversa' }).getByRole('alert'),
  ).toContainText('Sem conexão');
  await expect(page.getByRole('textbox')).toHaveValue('Confira estes dados antes da reunião.');
  await expect(page.getByText('resumo.txt', { exact: true })).toBeVisible();
  const enviar = await page
    .getByRole('button', { name: 'Enviar mensagem', exact: true })
    .boundingBox();
  expect(enviar!.y + enviar!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.screenshot({ path: test.info().outputPath('anexos-rascunho-offline.png') });
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Remover referencia.png' }).click();
  await expect(page.getByRole('img', { name: 'referencia.png' })).toHaveCount(0);
  await expect(page.getByText('resumo.txt', { exact: true })).toBeVisible();
});
