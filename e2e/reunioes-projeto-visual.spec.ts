import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fixture from '../src/app/preview/reunioes-projeto/fixture.json';
import { exemploPassoReunioes, REUNIOES_SLUG } from '../src/lib/projetos/exemplos-reunioes';

test('Reuniões: 320px, teclado, contraste e ausência de envio nos exemplos', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/reunioes-projeto');
  const mutacoes: string[] = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) mutacoes.push(request.url());
  });
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  await page
    .getByRole('button', { name: 'Aula 3: Leve fatos confirmados ao CRM', exact: true })
    .click();
  const exemplo = page.getByRole('region', { name: 'O que foi dito vira o quê?' });
  for (const name of ['Combinado', 'Sem prazo', 'Só uma sugestão']) {
    const button = exemplo.getByRole('button', { name, exact: true });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(button).toHaveCSS('background-color', 'rgb(10, 31, 59)');
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await exemplo.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  }
  await expect(
    exemplo.getByText('Nenhuma tarefa combinada neste trecho', { exact: true }),
  ).toBeVisible();
  await expect(exemplo.getByRole('button', { name: /Enviar|Criar tarefa/ })).toHaveCount(0);
  await exemplo.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath('reunioes-sem-acordo-320.png'),
    animations: 'disabled',
  });
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  await expect(page.getByRole('progressbar', { name: 'Progresso do aprendizado' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  expect(mutacoes).toEqual([]);
});

test('Reuniões: coach demonstra silêncio e falhas sem alterar a conta', async ({ page }, info) => {
  await page.goto('/preview/reunioes-projeto');
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  const aulas = page.getByRole('navigation', { name: 'Aulas do projeto' });
  await aulas.getByRole('button', { name: /^Aula 2:/ }).click();
  await page.getByRole('button', { name: 'Já respondido', exact: true }).click();
  await expect(
    page.getByText('Nenhuma dica. O vendedor já avançou neste ponto.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Áudio incerto', exact: true }).click();
  await expect(
    page.getByText('Nenhuma dica baseada neste trecho. Sinalizar a falha de transcrição.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('region', { name: 'Uma dica, só quando ajuda' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('reunioes-coach.png'), animations: 'disabled' });
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  await aulas.getByRole('button', { name: /^Aula 3:/ }).click();
  await page.getByRole('button', { name: 'Só uma sugestão', exact: true }).click();
  await aulas.getByRole('button', { name: /^Aula 1:/ }).click();
  await aulas.getByRole('button', { name: /^Aula 3:/ }).click();
  await expect(page.getByRole('button', { name: 'Combinado', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('progressbar', { name: 'Progresso do aprendizado' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
});

test('Reuniões: exemplos cabem na moldura real da plataforma', async ({ page }, info) => {
  for (const width of [1440, 1280, 1100, 900, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/preview/shell?tela=projeto&estado=reunioes');
    await page.getByRole('tab', { name: 'Implementar', exact: true }).click();
    await page
      .getByRole('navigation', { name: 'Fases do projeto' })
      .getByRole('button', { name: /Construir/ })
      .click();
    await page.getByRole('button', { name: /Gerar fatos, tarefas e follow-up/ }).click();
    const fluxo = page.getByRole('region', { name: 'O que foi dito vira o quê?' });
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
      await page.screenshot({ path: info.outputPath(`reunioes-projeto-shell-${width}.png`) });
    }
  }
});

test('Reuniões: dez exemplos, instruções preservadas e conclusão explícita', async ({
  page,
}, info) => {
  await page.goto('/preview/reunioes-projeto');
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
          name: exemploPassoReunioes(REUNIOES_SLUG, passo.id)!.titulo,
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
  await page.screenshot({ path: info.outputPath('reunioes-projeto-ficha.png') });
  await page.getByRole('button', { name: 'Concluir: Entregar manual e revisão semanal' }).click();
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

test('Reuniões: três aulas, cenários interativos e recursos acessíveis', async ({ page }, info) => {
  await page.goto('/preview/reunioes-projeto');
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  const aulas = page.getByRole('navigation', { name: 'Aulas do projeto' });
  for (const [i, aula] of fixture.roteiro.trilhaDidatica.aulas.entries()) {
    await aulas.getByRole('button', { name: `Aula ${i + 1}: ${aula.titulo}` }).click();
    await expect(page.getByText('Exemplo didático', { exact: true })).toBeVisible();
    await expect(page.getByText(aula.exercicio, { exact: true })).toBeVisible();
  }
  await page.getByRole('region', { name: 'O que foi dito vira o quê?' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('reunioes-pos-call.png') });
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
