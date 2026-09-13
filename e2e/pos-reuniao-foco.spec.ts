import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('decisões e compromissos aparecem antes do relatório, sem salvar pela leitura', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/pos-call');
  const mutacoes: string[] = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) mutacoes.push(request.url());
  });
  const central = page.getByRole('region', { name: 'Decisões e próximos passos' });
  await expect(
    central.getByText('O piloto ficará restrito ao WhatsApp de uma única unidade.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(central.getByLabel('Próxima ação da venda')).toHaveValue(
    'Enviar o diagnóstico do piloto para Marina e marcar uma apresentação de 30 minutos.',
  );
  await expect(central.getByRole('checkbox')).toHaveCount(2);
  await expect(central.getByLabel('Data combinada')).toHaveValue('');
  await expect(central.getByText('Sem data definida', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Criar proposta', exact: true })).toHaveAttribute(
    'href',
    '/propostas/nova?oportunidade=22222222-2222-4222-8222-222222222222&reuniao=11111111-1111-4111-8111-111111111111',
  );
  for (const titulo of ['Resumo da conversa', 'Análise completa', 'Transcrição e gravação']) {
    await expect(
      page
        .locator('details')
        .filter({ has: page.locator('summary', { hasText: titulo }) })
        .first(),
    ).not.toHaveAttribute('open', '');
  }
  await central.getByRole('checkbox').first().uncheck();
  await expect(central.getByText('1 de 2 selecionados')).toBeVisible();
  const resumo = page.locator('summary', { hasText: 'Resumo da conversa' });
  await resumo.focus();
  await page.keyboard.press('Enter');
  await expect(central.getByText(/A clínica confirmou que a troca de turno/)).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(central.getByRole('checkbox').first()).not.toBeChecked();
  expect(mutacoes).toEqual([]);
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('pos-reuniao-foco.png'), fullPage: true });
});

test('fontes privadas abrem diretamente e não dependem da análise completa', async ({ page }) => {
  await page.goto('/preview/pos-call');
  const fontes = page.locator('summary', { hasText: 'Transcrição e gravação' });
  await fontes.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('heading', { name: 'Gravação privada da reunião' })).toBeVisible();
  await expect(page.getByText('Somente sua conta')).toBeVisible();
  await expect(page.locator('audio')).toHaveAttribute('preload', 'none');
  await expect(page.getByRole('heading', { name: 'O que ainda falta saber' })).toBeHidden();
  await page.locator('summary', { hasText: 'Transcrição da reunião' }).click();
  await expect(page.getByText(/Hoje a gente recebe tudo no mesmo WhatsApp/)).toBeVisible();
  await page.locator('summary', { hasText: 'Análise completa' }).click();
  await expect(page.getByRole('heading', { name: 'O que ainda falta saber' })).toBeVisible();
  await expect(page.getByLabel('Leitura comercial 76 de 100')).toBeVisible();
});

test('320px: leitura, ações e campos permanecem inteiros', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/preview/pos-call');
  await expect(page.getByLabel('Próxima ação da venda')).toBeEnabled();
  const alvos = page.locator(
    'main a, main summary, main button, main textarea, main select, main input[type="date"]',
  );
  for (const alvo of await alvos.all()) {
    if (await alvo.isVisible())
      expect((await alvo.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await expect(page.getByLabel('Próxima ação da venda')).toHaveCSS('font-size', '17px');
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('pos-reuniao-320.png'), fullPage: true });
});

test('decisões adicionais são acessíveis sem perder texto nem inventar conclusão', async ({
  page,
}) => {
  await page.goto('/preview/pos-call?estado=extenso');
  const ultima = page
    .getByRole('region', { name: 'Decisões e próximos passos' })
    .getByText('Uma nova unidade só será incluída após a revisão dos resultados.', { exact: true });
  await expect(ultima).toBeHidden();
  await page.locator('summary', { hasText: 'Mais 2 decisões' }).click();
  await expect(ultima).toBeVisible();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
});

for (const [estado, mensagem] of [
  ['vazio', 'Nenhuma decisão explícita registrada. Defina o próximo passo com o cliente.'],
  ['falhou', 'Não foi possível concluir o resumo.'],
  ['cancelada', 'Esta reunião foi cancelada.'],
] as const) {
  test(`estado ${estado}: sem fatos fabricados e com revisão manual disponível`, async ({
    page,
  }) => {
    await page.goto(`/preview/pos-call?estado=${estado}`);
    await expect(page.getByText(mensagem, { exact: true })).toBeVisible();
    await expect(page.getByLabel('Próxima ação da venda')).toHaveValue('');
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  });
}

test('processamento não expõe decisões parciais ou formulário prematuro', async ({ page }) => {
  await page.goto('/preview/pos-call?estado=processando');
  await expect(page.getByRole('status')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Preparando o resumo da conversa.' }),
  ).toBeVisible();
  await expect(page.getByLabel('Próxima ação da venda')).toHaveCount(0);
  await expect(page.getByText('Análise completa', { exact: true })).toHaveCount(0);
});

for (const [estado, titulo] of [
  ['sem-resumo', 'Esta reunião ainda não tem resumo.'],
  ['demorada', 'O resumo está demorando mais que o esperado.'],
  ['indisponivel', 'Não conseguimos consultar o andamento.'],
] as const) {
  test(`${estado}: saída manual e suporte sem disparar IA ou cobrar`, async ({ page }, info) => {
    const mutacoes: string[] = [];
    page.on('request', (r) => {
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(r.method())) mutacoes.push(r.url());
    });
    await page.goto(`/preview/pos-call?estado=${estado}`);
    await expect(page.getByRole('heading', { name: titulo })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByLabel('Próxima ação da venda')).toBeEditable();
    await expect(page.getByText('Análise completa', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Pedir ajuda' })).toHaveAttribute(
      'href',
      '/suporte/novo?origem=%2Freunioes%2F11111111-1111-4111-8111-111111111111&contexto=resumo_reuniao',
    );
    const verificar = page.getByRole('button', { name: 'Verificar novamente' });
    await expect(verificar).toHaveCSS('font-family', /Geist/i);
    expect(
      await verificar.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius)),
    ).toBeGreaterThan(8);
    await verificar.focus();
    await page.keyboard.press('Enter');
    await expect(verificar).toBeEnabled();
    await expect(page.getByRole('heading', { name: titulo })).toBeVisible();
    expect(mutacoes).toEqual([]);
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`resumo-${estado}.png`), fullPage: true });
  });
}

for (const [estado, titulo] of [
  ['fila', 'Aguardando o processamento.'],
  ['retentativa', 'Uma nova tentativa já está na fila.'],
] as const) {
  test(`${estado}: status factual sem progresso simulado, também em 320px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(`/preview/pos-call?estado=${estado}`);
    await expect(page.getByRole('status')).toContainText(titulo);
    await expect(page.getByLabel('Etapas do processamento')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Abrir ficha do cliente' })).toBeVisible();
    for (const alvo of await page.locator('main a, main button').all()) {
      if (await alvo.isVisible())
        expect((await alvo.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath(`resumo-${estado}-320.png`), fullPage: true });
  });
}

for (const [params, acao, href] of [
  ['tipo=kickoff', 'Revisar acordo do projeto', '/entregas/projeto-preview#briefing-kickoff'],
  ['estado=ganha', 'Abrir entrega', '/entregas/projeto-preview'],
] as const) {
  test(`continuidade ${params} leva à entrega sem reabrir a venda`, async ({ page }) => {
    await page.goto(`/preview/pos-call?${params}`);
    await expect(page.getByRole('link', { name: acao, exact: true })).toHaveAttribute('href', href);
    await expect(page.getByRole('link', { name: 'Criar proposta' })).toHaveCount(0);
    if (params === 'tipo=kickoff') {
      await expect(page.getByLabel('Próximo marco do projeto')).toBeVisible();
      await expect(page.getByLabel('Próxima etapa da venda')).toHaveCount(0);
    }
  });
}
