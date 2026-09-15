import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import nina from '../src/app/preview/nina/fixture.json';
import { resumirRequisito } from '../src/lib/projetos/kit-visual';

async function abrirKit(page: Page) {
  await page.goto('/preview/shell?tela=projeto&estado=nina');
  await page.getByRole('tab', { name: 'Pré-requisitos e materiais', exact: true }).click();
  return page.getByRole('region', { name: 'Pré-requisitos e materiais do projeto', exact: true });
}

test('requisitos resumidos conservam cada condição e não concluem passos', async ({ page }) => {
  const kit = await abrirKit(page);
  const lista = kit.getByRole('list', { name: 'Pré-requisitos do projeto' });
  for (const texto of nina.roteiro.escopo.preRequisitos) {
    await expect(lista.getByText(texto, { exact: true })).not.toBeVisible();
    const resumo = lista.locator('summary', { hasText: resumirRequisito(texto)!.titulo });
    await resumo.focus();
    await page.keyboard.press('Enter');
    await expect(lista.getByText(texto, { exact: true })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(lista.getByText(texto, { exact: true })).not.toBeVisible();
  }
  await expect(kit.getByRole('checkbox')).toHaveCount(0);
  await expect(
    page.getByRole('progressbar', { name: 'Progresso da implementação' }),
  ).toHaveAttribute('aria-valuenow', '0');
});

test('modelos e prompts têm acesso direto e texto completo sob demanda', async ({ page }) => {
  const kit = await abrirKit(page);
  await kit.getByRole('button', { name: 'Arquivos e ferramentas', exact: true }).click();
  for (const material of nina.roteiro.trilhaDidatica.materiais) {
    const card = kit.getByRole('article', { name: material.titulo });
    const abrir = card.getByRole('button', { name: `Ler modelo: ${material.titulo}` });
    await expect(abrir).toHaveAttribute('aria-expanded', 'false');
    await expect(card.getByRole('button', { name: `Copiar ${material.titulo}` })).toBeVisible();
    await expect(card.getByRole('link')).toHaveAttribute('download', /\.txt$/);
    await abrir.focus();
    await page.keyboard.press('Enter');
    expect(await card.getByRole('region').textContent()).toBe(material.conteudo);
    await expect(card.getByText(material.quandoUsar, { exact: true })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(abrir).toHaveAttribute('aria-expanded', 'false');
    await expect(abrir).toBeFocused();
  }
  const prompt = kit.getByRole('button', { name: 'Ler prompt: Atendimento inicial' });
  await prompt.click();
  await expect(
    kit.getByRole('region', { name: 'Texto do prompt: Atendimento inicial' }),
  ).toBeVisible();
});

test('download contém o material original e não muda a página', async ({ page }) => {
  const kit = await abrirKit(page);
  await kit.getByRole('button', { name: 'Arquivos e ferramentas', exact: true }).click();
  const material = nina.roteiro.trilhaDidatica.materiais[0]!;
  const baixar = kit.getByRole('link', { name: `Baixar .txt: ${material.titulo}` });
  const downloadPromise = page.waitForEvent('download');
  await baixar.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('briefing-de-atendimento.txt');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString('utf8')).toBe(material.conteudo);
  await expect(page).toHaveURL(/preview\/shell/);
  await expect(kit.getByRole('button', { name: `Ler modelo: ${material.titulo}` })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

test('ferramentas abrem apenas destinos oficiais e avisam nova aba', async ({ page }) => {
  const kit = await abrirKit(page);
  await kit.getByRole('button', { name: 'Arquivos e ferramentas', exact: true }).click();
  const supabase = kit.getByRole('link', { name: 'Abrir Supabase (nova aba)' });
  await expect(supabase).toHaveAttribute('href', 'https://supabase.com/dashboard');
  await expect(supabase).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(supabase).toHaveAttribute('target', '_blank');
  await expect(kit.getByRole('link', { name: 'Abrir OpenAI (nova aba)' })).toHaveAttribute(
    'href',
    'https://platform.openai.com/',
  );
});

test('320px: rótulos, contraste, toque e foco preservados nas duas áreas', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const kit = await abrirKit(page);
  for (const area of ['Antes de começar', 'Arquivos e ferramentas']) {
    await kit.getByRole('button', { name: area, exact: true }).click();
    const scan = await new AxeBuilder({ page }).include('#kit-projeto').analyze();
    expect(scan.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const alvos = await kit
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
  }
  const ler = kit.getByRole('button', { name: 'Ler modelo: Briefing de atendimento' });
  await ler.focus();
  await page.keyboard.press('Enter');
  await expect(ler).toBeFocused();
  expect(await ler.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  const scanAberto = await new AxeBuilder({ page }).include('#kit-projeto').analyze();
  expect(scanAberto.violations).toEqual([]);
});

test('larguras intermediárias mantêm conteúdo e botões sem corte', async ({ page }, info) => {
  for (const width of [390, 768, 1100, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const kit = await abrirKit(page);
    await kit.getByRole('button', { name: 'Arquivos e ferramentas', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const cards = await kit
      .getByRole('article')
      .evaluateAll((els) => els.every((el) => el.scrollWidth <= el.clientWidth + 1));
    expect(cards).toBe(true);
    if (width === 390 || width === 1440) {
      await kit.scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`kit-${width}.png`) });
    }
  }
});
