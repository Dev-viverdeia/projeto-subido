import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('reunião: pergunta em foco, roteiro inteiro acessível e acordo separado', async ({
  page,
}, info) => {
  await page.goto('/preview/crm-dossie');
  await page.getByRole('tab', { name: 'Preparar reunião' }).click();
  const roteiro = page.getByRole('region', { name: 'Roteiro da reunião' });
  await expect(roteiro.getByRole('heading', { level: 4 })).toHaveCount(1);
  await expect(roteiro.getByRole('button', { name: 'Pergunta anterior' })).toBeDisabled();
  await roteiro.getByRole('button', { name: 'Próxima pergunta' }).click();
  await expect(roteiro.getByText('2 de 6')).toBeVisible();
  await roteiro.getByRole('button', { name: /Dimensionar/ }).click();
  await expect(roteiro.getByRole('heading', { level: 4 })).toContainText('semana comum');
  await roteiro.locator('summary', { hasText: 'Ver todas as perguntas' }).press('Enter');
  await expect(
    roteiro.getByRole('list', { name: 'Todas as perguntas' }).getByRole('listitem'),
  ).toHaveCount(6);
  await roteiro
    .getByRole('list', { name: 'Todas as perguntas' })
    .getByRole('button')
    .last()
    .click();
  await expect(roteiro.getByText('6 de 6')).toBeVisible();
  await expect(roteiro.getByRole('button', { name: 'Próxima pergunta' })).toBeDisabled();
  await page.getByRole('button', { name: 'Combinar próximo passo', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Saia com um próximo passo combinado' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Abrir a conversa', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Abertura da reunião' }).getByRole('blockquote'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Explorar perguntas', exact: true }).click();
  await roteiro.scrollIntoViewIfNeeded();
  const axe = await new AxeBuilder({ page }).include('[id^="painel-pesquisa-"]').analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  await page.screenshot({ path: info.outputPath('reuniao-visual.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});

test('leitura guiada: 320px, teclado e movimento reduzido sem recortes', async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/shell?tela=projeto');
  await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
  const guia = page.getByRole('region', { name: 'Guia de execução' });
  const separar = guia.getByRole('button', { name: 'Separar', exact: true });
  await separar.focus();
  await page.keyboard.press('Enter');
  await expect(separar).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(guia.getByRole('button', { name: 'Executar', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  expect((await separar.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const executarAxe = await new AxeBuilder({ page }).include('main').analyze();
  expect(
    executarAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
  await page.getByRole('tab', { name: 'Pré-requisitos e materiais', exact: true }).click();
  await page.locator('summary', { hasText: 'Escopo e limites do projeto' }).click();
  await page.getByRole('button', { name: /Fora do piloto/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const escopoAxe = await new AxeBuilder({ page }).include('main').analyze();
  expect(
    escopoAxe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
  ).toEqual([]);
  await page.goto('/preview/crm-dossie');
  await page.getByRole('tab', { name: 'Preparar reunião' }).click();
  await page.getByRole('button', { name: 'Próxima pergunta' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('projeto: executar, consultar e conferir não alteram a conclusão', async ({ page }, info) => {
  await page.goto('/preview/shell?tela=projeto');
  await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
  const guia = page.getByRole('region', { name: 'Guia de execução' });
  await expect(guia.getByRole('button', { name: 'Executar', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(guia.getByRole('region', { name: 'Ação em foco' })).toBeVisible();
  await guia.getByRole('button', { name: 'Separar', exact: true }).click();
  await expect(guia.getByRole('heading', { name: 'Separe antes de começar' })).toBeVisible();
  await guia.getByRole('button', { name: 'Conferir', exact: true }).click();
  await expect(guia.getByText('Pronto quando', { exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Progresso do projeto' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await guia.getByRole('button', { name: 'Executar', exact: true }).click();
  await page.getByRole('navigation', { name: 'Fases do projeto' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('projeto-executar.png') });
  await page.getByRole('tab', { name: 'Pré-requisitos e materiais', exact: true }).click();
  await page.locator('summary', { hasText: 'Escopo e limites do projeto' }).click();
  const escopo = page.getByRole('region', { name: 'Escopo do piloto' });
  await expect(escopo.getByRole('button', { name: /O cliente precisa ter/ })).toBeVisible();
  await escopo.getByRole('button', { name: /Fora do piloto/ }).click();
  await expect(escopo.getByRole('list', { name: 'Fora do piloto' })).toBeVisible();
  await expect(escopo.getByText('Primeiro teste', { exact: true })).toBeVisible();
  await escopo.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('projeto-escopo.png') });
  await page.getByRole('button', { name: 'Arquivos e ferramentas', exact: true }).click();
  await page.locator('summary', { hasText: 'Documentos para entregar ao cliente' }).click();
  await expect(page.getByRole('heading', { name: 'Arquivos da entrega' })).toBeVisible();
  await page.getByRole('button', { name: 'Aplicar no cliente', exact: true }).click();
  await expect(page.getByRole('link', { name: /Personalizar no Estúdio/ })).toBeVisible();
  const axe = await new AxeBuilder({ page }).include('main').analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
