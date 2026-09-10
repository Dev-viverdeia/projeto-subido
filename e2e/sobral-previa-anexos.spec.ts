import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export function pdfDeTeste() {
  const textos = ['Plano do projeto de IA', 'Segunda pagina: entrega e validacao'];
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',
    '',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  textos.forEach((texto, i) => {
    const stream = `BT /F1 22 Tf 40 760 Td (${texto}) Tj ET`;
    objetos[3 + i * 2] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objetos.forEach((objeto, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objeto}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 8\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/consultor/**', (route) =>
    route.fulfill({ status: 401, json: { erro: 'IA bloqueada no teste' } }),
  );
  await page.route('**/*.supabase.co/**', (route) => route.abort());
  await page.goto('/preview/consultor');
  await page.getByRole('textbox').fill('Meu rascunho continua aqui.');
});

test('imagem abre no chat, amplia e devolve foco sem perder rascunho', async ({
  page,
  context,
}, info) => {
  await page.getByLabel('Selecionar arquivos para a conversa').setInputFiles({
    name: 'referencia.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXxkAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  const abrir = page.getByRole('button', { name: 'Visualizar referencia.png' });
  await abrir.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Ver imagem' });
  await expect(dialog.getByRole('img')).toBeVisible();
  await dialog.getByRole('button', { name: 'Ampliar imagem' }).click();
  await expect(dialog.getByRole('button', { name: 'Ajustar à tela' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(context.pages()).toHaveLength(1);
  await page.screenshot({ path: info.outputPath('imagem-ampliada.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(abrir).toBeFocused();
  await expect(page.getByRole('textbox')).toHaveValue('Meu rascunho continua aqui.');
});

test('PDF renderiza páginas reais, tem texto acessível, zoom e download', async ({
  page,
}, info) => {
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page
    .getByLabel('Selecionar arquivos para a conversa')
    .setInputFiles({ name: 'plano.pdf', mimeType: 'application/pdf', buffer: pdfDeTeste() });
  await page.getByRole('button', { name: 'Visualizar plano.pdf' }).click();
  const dialog = page.getByRole('dialog', { name: 'Ler PDF' });
  await expect(dialog.locator('canvas')).toBeVisible({ timeout: 30000 });
  // Verifica tinta renderizada, não só a existência de um canvas vazio.
  expect(
    await dialog.locator('canvas').evaluate((el: HTMLCanvasElement) => {
      const pixels = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data;
      let tinta = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 150 && pixels[i + 3] > 0) tinta++;
      return tinta;
    }),
  ).toBeGreaterThan(50);
  await expect(dialog.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
  await dialog.locator('summary').click();
  await expect(dialog.getByText('Plano do projeto de IA', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Próxima página' }).click();
  await expect(dialog.locator('canvas')).toBeVisible();
  await dialog.locator('summary').click();
  await expect(
    dialog.getByText('Segunda pagina: entrega e validacao', { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Próxima página' })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Ampliar PDF' }).click();
  await expect(dialog.locator('canvas')).toBeVisible();
  await expect(dialog.getByText('150%')).toBeVisible();
  await dialog.getByRole('button', { name: 'Diminuir PDF' }).click();
  await expect(dialog.locator('canvas')).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const fechar = dialog.getByRole('button', { name: 'Fechar diálogo' });
  await fechar.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: 'Baixar arquivo' })).toBeFocused();
  const download = page.waitForEvent('download');
  await dialog.getByRole('link', { name: 'Baixar arquivo' }).click();
  expect((await download).suggestedFilename()).toBe('plano.pdf');
  await page.screenshot({ path: info.outputPath('pdf-no-chat.png') });
  await fechar.click();
  await expect(page.getByRole('button', { name: 'Visualizar plano.pdf' })).toBeFocused();
  await expect(page.getByRole('textbox')).toHaveValue('Meu rascunho continua aqui.');
});

test('PDF inválido oferece recuperação e fechar continua funcionando', async ({ page }) => {
  await page.getByLabel('Selecionar arquivos para a conversa').setInputFiles({
    name: 'incompleto.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('PDF incompleto'),
  });
  await page.getByRole('button', { name: 'Visualizar incompleto.pdf' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Não foi possível abrir o PDF',
  );
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Não foi possível abrir o PDF',
  );
  await page.getByRole('button', { name: 'Fechar diálogo' }).click();
  await expect(page.getByRole('textbox')).toHaveValue('Meu rascunho continua aqui.');
});

test('falha do leitor não derruba a conversa nem perde o rascunho', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.route('**/vendor/pdfjs/**/pdf.worker.min.mjs', (route) => route.abort());
  await page.getByLabel('Selecionar arquivos para a conversa').setInputFiles({
    name: 'plano.pdf',
    mimeType: 'application/pdf',
    buffer: pdfDeTeste(),
  });
  await page.getByRole('button', { name: 'Visualizar plano.pdf' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Não foi possível abrir o PDF',
  );
  await page.getByRole('button', { name: 'Fechar diálogo' }).click();
  await expect(page.getByRole('textbox')).toHaveValue('Meu rascunho continua aqui.');
  expect(erros).toEqual([]);
});
