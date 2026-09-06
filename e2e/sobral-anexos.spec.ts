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
