import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import nina from '../src/app/preview/nina/fixture.json';

// No runner Linux, auditoria e captura Retina do WebKit somaram mais de 30s
// mesmo com as interações aprovadas (run 34924051297). O orçamento maior é
// só desta suíte; cada interação continua limitada a 10s, sem novos retries.
test.use({ actionTimeout: 10_000 });
test.beforeEach(({ browserName }, info) => {
  if (browserName === 'webkit') info.setTimeout(60_000);
});

async function abrirAula(page: Page, indice = 0) {
  await page.goto('/preview/shell?tela=projeto&estado=nina');
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  for (let i = 0; i < indice; i++) {
    await page.getByRole('button', { name: 'Próxima aula', exact: true }).click();
  }
  return page.getByRole('region', { name: 'Recursos desta aula', exact: true });
}

test('recursos visíveis sem abertura adicional e foco real no mapa', async ({ page }) => {
  const recursos = await abrirAula(page);
  const abrir = recursos.locator('summary').filter({ hasText: 'Mapa da conversa da Nina' });
  await expect(abrir).toBeVisible();
  await expect(recursos.getByRole('list', { name: 'Etapas do mapa mental' })).not.toBeVisible();
  await abrir.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(abrir).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    recursos.getByText('identificar canal, contato e intenção', { exact: true }),
  ).toBeVisible();
  expect(await abrir.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(abrir).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Space');
  await expect(abrir).toBeFocused();
  await expect(recursos.getByRole('list', { name: 'Etapas do mapa mental' })).not.toBeVisible();
});

test('autoavaliação preserva respostas ao recolher e não conclui aula', async ({ page }) => {
  const recursos = await abrirAula(page);
  const abrir = recursos.getByText('Você desenhou uma conversa segura?', { exact: true });
  await abrir.click();
  // <details> também possui o papel implícito group. Conte somente as respostas.
  const grupos = recursos.getByRole('group', { name: /^Resposta:/ });
  const total = await grupos.count();
  expect(total).toBe(5);
  for (let i = 0; i < total; i++) {
    await grupos
      .nth(i)
      .getByRole('button', { name: i === 0 ? 'Ainda não' : 'Sim', exact: true })
      .click();
  }
  await expect(recursos.getByText('1 ponto para revisar.', { exact: true })).toBeVisible();
  await expect(
    recursos.getByText('Essa revisão não conclui a aula.', { exact: true }),
  ).toBeVisible();
  await abrir.click();
  await abrir.click();
  await expect(grupos.first().getByRole('button', { name: 'Ainda não' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('progressbar', { name: 'Progresso do aprendizado', exact: true }),
  ).toHaveAttribute('aria-valuenow', '0');
  await recursos.getByRole('button', { name: 'Refazer autoavaliação' }).click();
  await expect(recursos.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(recursos.getByRole('button', { pressed: true })).toHaveCount(0);
});

test('autoavaliação: contraste e semântica das respostas e do resultado', async ({ page }) => {
  const recursos = await abrirAula(page);
  await recursos.getByText('Você desenhou uma conversa segura?', { exact: true }).click();
  const respostas = recursos.getByRole('group', { name: /^Resposta:/ });
  for (let i = 0; i < 5; i++) {
    await respostas
      .nth(i)
      .getByRole('button', { name: i === 0 ? 'Ainda não' : 'Sim', exact: true })
      .click();
  }
  await expect(recursos.getByRole('status')).toBeVisible();
  const scan = await new AxeBuilder({ page }).include('[data-recursos-aula]').analyze();
  expect(scan.violations).toEqual([]);
});

test('modelo e guia baixam o texto original sem abrir nem concluir a aula', async ({ page }) => {
  const recursos = await abrirAula(page, 1);
  const material = nina.roteiro.trilhaDidatica.aulas[1]!.recursos[1]!;
  const ler = recursos.getByRole('button', { name: `Ler modelo: ${material.titulo}` });
  await expect(ler).toHaveAttribute('aria-expanded', 'false');
  await expect(recursos.getByRole('button', { name: `Copiar ${material.titulo}` })).toBeVisible();
  const baixar = recursos.getByRole('link', { name: `Baixar .txt: ${material.titulo}` });
  const evento = page.waitForEvent('download');
  await baixar.click();
  const download = await evento;
  expect(download.suggestedFilename()).toBe('matriz-de-qualificacao-copiavel.txt');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString('utf8')).toBe(material.conteudo);
  const guia = nina.roteiro.trilhaDidatica.aulas[1]!.recursos[0]!;
  const linkGuia = recursos.getByRole('link', { name: `Baixar .txt: ${guia.titulo}` });
  expect(decodeURIComponent((await linkGuia.getAttribute('href'))!.split(',')[1]!)).toBe(
    guia.conteudo,
  );
  await expect(ler).toHaveAttribute('aria-expanded', 'false');
  await expect(
    page.getByRole('progressbar', { name: 'Progresso do aprendizado', exact: true }),
  ).toHaveAttribute('aria-valuenow', '0');
});

for (const width of [320, 768, 1440]) {
  test(`${width}px: contraste e semântica do guia e do modelo abertos`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const recursos = await abrirAula(page, 1);
    await recursos.getByText('Guia prático de qualificação por fatos', { exact: true }).click();
    await recursos
      .getByRole('button', { name: 'Ler modelo: Matriz de qualificação copiável' })
      .click();
    const scan = await new AxeBuilder({ page }).include('[data-recursos-aula]').analyze();
    expect(scan.violations).toEqual([]);
  });

  test(`${width}px: toque e leitura sem corte`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const recursos = await abrirAula(page, 1);
    await recursos.getByText('Guia prático de qualificação por fatos', { exact: true }).click();
    await recursos
      .getByRole('button', { name: 'Ler modelo: Matriz de qualificação copiável' })
      .click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const alvos = await recursos
      .locator('button:visible, a:visible, summary:visible')
      .evaluateAll((els) =>
        els.map((el) => ({
          nome: el.textContent,
          altura: el.getBoundingClientRect().height,
          largura: el.getBoundingClientRect().width,
          cabe: el.scrollWidth <= el.clientWidth + 1,
        })),
      );
    for (const alvo of alvos) {
      expect(alvo.altura, alvo.nome ?? '').toBeGreaterThanOrEqual(44);
      expect(alvo.largura, alvo.nome ?? '').toBeGreaterThanOrEqual(44);
      expect(alvo.cabe, alvo.nome ?? '').toBe(true);
    }
    // A região aberta pode ser maior que a viewport. Enquadre seu início, não
    // tente centralizar todo o conteúdo para a captura no WebKit móvel.
    await recursos
      .getByRole('heading', { name: 'Recursos desta aula', exact: true })
      .scrollIntoViewIfNeeded();
    // Um pixel por CSS pixel mantém a evidência de layout sem gerar um PNG
    // nove vezes maior no iPhone emulado. O DPR do navegador não é alterado.
    await page.screenshot({
      path: info.outputPath(`recursos-${width}.png`),
      scale: 'css',
      timeout: 45_000,
    });
  });
}
