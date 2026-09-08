import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fixture from '../src/app/preview/nina/fixture.json';
import { exemploPassoNina, NINA_SLUG } from '../src/lib/projetos/exemplos-nina';

test('Nina: exemplos cabem na moldura real da plataforma', async ({ page }, info) => {
  for (const width of [1440, 1280, 1100, 900, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/preview/shell?tela=projeto&estado=nina');
    await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
    const fluxo = page.getByRole('list', { name: 'Caminho esperado' });
    await expect(fluxo).toBeVisible();
    expect(
      await fluxo
        .locator('li > div')
        .evaluateAll((els) => els.every((e) => e.scrollWidth <= e.clientWidth + 1)),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    if (width === 1280 || width === 390) {
      await fluxo.scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`nina-shell-${width}.png`) });
    }
  }
});

test('Nina: dez exemplos, instruções preservadas e conclusão explícita', async ({ page }, info) => {
  await page.goto('/preview/nina');
  await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
  const guia = page.getByRole('region', { name: 'Guia de execução' });
  for (const fase of fixture.roteiro.fases) {
    await page
      .getByRole('navigation', { name: 'Fases do projeto' })
      .getByRole('button', { name: new RegExp(fase.titulo) })
      .click();
    for (const passo of fase.passos) {
      await page
        .getByRole('navigation', { name: `Passos da fase ${fase.titulo}` })
        .getByRole('button', { name: new RegExp(passo.titulo) })
        .click();
      await expect(guia.getByRole('button', { name: 'Exemplo', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(
        guia.getByRole('heading', { name: exemploPassoNina(NINA_SLUG, passo.id)!.titulo }),
      ).toBeVisible();
      await guia.getByRole('button', { name: 'Executar', exact: true }).click();
      await expect(guia.getByRole('region', { name: 'Ação em foco' })).toHaveText(
        new RegExp(passo.execucao[0]!.slice(0, 20)),
      );
      await guia.getByRole('button', { name: 'Conferir', exact: true }).click();
      await expect(guia.getByText(passo.concluidoQuando, { exact: true })).toBeVisible();
      await guia.getByRole('button', { name: 'Exemplo', exact: true }).click();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
    }
  }
  await expect(page.getByRole('progressbar', { name: 'Progresso do projeto' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await guia.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('nina-ficha.png') });
  await page.getByRole('button', { name: 'Concluir: Entregar manual e indicadores' }).click();
  await expect(page.getByRole('progressbar', { name: 'Progresso do projeto' })).toHaveAttribute(
    'aria-valuenow',
    '10',
  );
  await page.reload();
  await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Fases do projeto' })
    .getByRole('button', { name: /Entregar/ })
    .click();
  await page
    .getByRole('navigation', { name: 'Passos da fase Entregar' })
    .getByRole('button', { name: /Entregar manual/ })
    .click();
  await expect(guia.getByRole('button', { name: 'Conferir', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('Nina: três aulas, cenários interativos e recursos acessíveis', async ({ page }, info) => {
  await page.goto('/preview/nina');
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  const aulas = page.getByRole('navigation', { name: 'Aulas do projeto' });
  for (const [i, aula] of fixture.roteiro.trilhaDidatica.aulas.entries()) {
    await aulas.getByRole('button', { name: `Aula ${i + 1}: ${aula.titulo}` }).click();
    await expect(page.getByText('Exemplo didático', { exact: true })).toBeVisible();
    await expect(page.getByText(aula.exercicio, { exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Agenda indisponível', exact: true }).click();
  await expect(page.getByText('A consulta à agenda falhou.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pedido de pessoa', exact: true }).click();
  await expect(page.getByText('Quero falar com uma pessoa.', { exact: true })).toBeVisible();
  await page
    .getByRole('region', { name: 'Teste também quando algo dá errado' })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('nina-conversa.png') });
  await page.locator('summary', { hasText: 'Recursos desta aula' }).click();
  await expect(
    page.getByText(fixture.roteiro.trilhaDidatica.aulas[2]!.recursos[0]!.titulo, { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Progresso do aprendizado' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await page.getByRole('button', { name: 'Concluir aula', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Progresso do aprendizado' })).toHaveAttribute(
    'aria-valuenow',
    '33',
  );
});

test('Nina: 320px, teclado, alvos de toque e contraste', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/nina');
  await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
  const guia = page.getByRole('region', { name: 'Guia de execução' });
  await guia
    .getByRole('heading', { name: 'Da primeira mensagem à reunião' })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('nina-fluxo-320.png') });
  for (const name of ['Exemplo', 'Separar', 'Executar', 'Conferir']) {
    const button = guia.getByRole('button', { name, exact: true });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await guia.getByRole('button', { name: 'Exemplo', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const fluxo = await new AxeBuilder({ page }).include('main').analyze();
  expect(fluxo.violations).toEqual([]);
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  const encaminhar = page.getByRole('button', { name: 'Encaminhar', exact: true });
  await encaminhar.focus();
  await page.keyboard.press('Enter');
  await expect(encaminhar).toHaveAttribute('aria-pressed', 'true');
  expect((await encaminhar.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const conversa = await new AxeBuilder({ page }).include('main').analyze();
  expect(conversa.violations).toEqual([]);
});
