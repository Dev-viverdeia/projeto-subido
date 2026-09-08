import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fixture from '../src/app/preview/prospeccao-projeto/fixture.json';
import { exemploPassoProspeccao, PROSPECCAO_SLUG } from '../src/lib/projetos/exemplos-prospeccao';

test('Prospecção: exemplos cabem na moldura real da plataforma', async ({ page }, info) => {
  for (const width of [1440, 1280, 1100, 900, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/preview/shell?tela=projeto&estado=prospeccao');
    await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
    const fluxo = page.getByRole('region', { name: 'Quem entra nesta lista?' });
    await expect(fluxo).toBeVisible();
    const navegacao = page.getByRole('navigation', { name: 'Como executar este passo' });
    expect(await navegacao.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    expect(
      await fluxo
        .locator('dd')
        .evaluateAll((els) => els.every((e) => e.scrollWidth <= e.clientWidth + 1)),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    if (width === 1280 || width === 390) {
      await fluxo.scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`prospeccao-projeto-shell-${width}.png`) });
    }
  }
});

test('Prospecção: dez exemplos, instruções preservadas e conclusão explícita', async ({
  page,
}, info) => {
  await page.goto('/preview/prospeccao-projeto');
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
        guia.getByRole('heading', {
          name: exemploPassoProspeccao(PROSPECCAO_SLUG, passo.id)!.titulo,
        }),
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
  await page.screenshot({ path: info.outputPath('prospeccao-projeto-ficha.png') });
  await page.getByRole('button', { name: 'Concluir: Documentar a rotina de prospecção' }).click();
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
    .getByRole('button', { name: /Documentar a rotina/ })
    .click();
  await expect(guia.getByRole('button', { name: 'Conferir', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('Prospecção: três aulas, cenários interativos e recursos acessíveis', async ({
  page,
}, info) => {
  await page.goto('/preview/prospeccao-projeto');
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  const aulas = page.getByRole('navigation', { name: 'Aulas do projeto' });
  for (const [i, aula] of fixture.roteiro.trilhaDidatica.aulas.entries()) {
    await aulas.getByRole('button', { name: `Aula ${i + 1}: ${aula.titulo}` }).click();
    await expect(page.getByText('Exemplo didático', { exact: true })).toBeVisible();
    await expect(page.getByText(aula.exercicio, { exact: true })).toBeVisible();
  }
  await page
    .getByRole('region', { name: 'Prioridade com a conta aberta' })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('prospeccao-score.png') });
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

test('Prospecção: 320px, teclado, alvos de toque e contraste', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/prospeccao-projeto');
  await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
  const guia = page.getByRole('region', { name: 'Guia de execução' });
  await guia.getByRole('heading', { name: 'Quem entra nesta lista?' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('prospeccao-projeto-fluxo-320.png') });
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
  const encaminhar = page.getByRole('button', { name: 'Dados incompletos', exact: true });
  await encaminhar.focus();
  await page.keyboard.press('Enter');
  await expect(encaminhar).toHaveAttribute('aria-pressed', 'true');
  expect((await encaminhar.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const conversa = await new AxeBuilder({ page }).include('main').analyze();
  expect(conversa.violations).toEqual([]);
});

test('Prospecção: abordagem e falhas são exemplos, sem envio ou gravação', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto('/preview/shell?tela=projeto&estado=prospeccao');
  const mutacoes: string[] = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) mutacoes.push(request.url());
  });
  await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
  const fases = page.getByRole('navigation', { name: 'Fases do projeto' });
  await fases.getByRole('button', { name: /Construir/ }).click();
  const fluxo = page.getByRole('list', { name: 'Caminho esperado' });
  await expect(fluxo).toBeVisible();
  expect(
    await fluxo
      .locator('li > div')
      .evaluateAll((els) => els.every((e) => e.scrollWidth <= e.clientWidth + 1)),
  ).toBe(true);
  await page.getByRole('button', { name: /Priorizar e gerar o briefing/ }).click();
  await page.getByRole('button', { name: 'Sem sinal recente', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sem sinal recente', exact: true })).toHaveCSS(
    'background-color',
    'rgb(10, 31, 59)',
  );
  await expect(
    page.getByText('Como funciona o atendimento pelo WhatsApp entre as unidades hoje?', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('region', { name: 'Do fato à primeira pergunta' }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath('prospeccao-abordagem.png'),
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Contato recusado', exact: true }).click();
  await expect(
    page.getByText('Não preparar um novo contato para envio.', { exact: true }),
  ).toBeVisible();
  await fases.getByRole('button', { name: /Validar/ }).click();
  await page.getByRole('button', { name: /Testar falhas e repetição/ }).click();
  await page.getByRole('button', { name: 'Fontes divergem', exact: true }).click();
  await expect(
    page.getByText('Guardar ambos os valores e encaminhar para revisão.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Progresso do projeto' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  expect(mutacoes).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
