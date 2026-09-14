import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const modo of ['agendar', 'reagendar']) {
  test(`${modo}: conflito no formulário, escolha explícita e sem envio real`, async ({
    page,
  }, info) => {
    const posts: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST') posts.push(r.url());
    });
    await page.goto(`/preview/conflitos-agenda?modo=${modo}`);
    const botao = page.getByRole('button', {
      name: modo === 'agendar' ? 'Criar reunião e enviar convite' : 'Salvar novo horário',
      exact: true,
    });
    await botao.click();
    const aviso = page.getByRole('region', { name: 'Você já tem uma reunião neste horário' });
    await expect(aviso).toBeVisible();
    await expect(aviso).toBeFocused();
    expect(
      await aviso.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft)),
    ).toBeGreaterThanOrEqual(16);
    await expect(aviso.getByText('Kickoff do atendimento · Moura Imóveis')).toBeVisible();
    const aceite = aviso.getByRole('checkbox');
    await expect(aceite).not.toBeChecked();
    await expect(botao).toBeInViewport();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`${modo}-conflito.png`) });
    await aceite.focus();
    await aceite.press('Space');
    await expect(aceite).toBeChecked();
    await page.getByLabel('Duração (minutos)').fill('60');
    await expect(aviso).toHaveCount(0);
    await botao.click();
    await expect(aceite).toBeVisible();
    await expect(aceite).not.toBeChecked();
    await aceite.check();
    await botao.click();
    await expect(
      page.getByText(
        modo === 'agendar'
          ? 'Simulação concluída. Nenhum convite foi enviado.'
          : 'Horário atualizado',
        { exact: true },
      ),
    ).toBeVisible();
    expect(posts).toEqual([]);
  });
}

test('muitos conflitos em 320px mantêm leitura e ações alcançáveis', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/conflitos-agenda?modo=reagendar&varios=1');
  await page.getByRole('button', { name: 'Salvar novo horário' }).click();
  const aviso = page.getByRole('region', { name: '9 reuniões coincidem com este horário' });
  await expect(aviso).toBeVisible();
  await expect(aviso.locator('li')).toHaveCount(5);
  await expect(aviso.getByText('E mais 4 reuniões nesse intervalo.')).toBeVisible();
  await aviso.getByRole('checkbox').scrollIntoViewIfNeeded();
  await expect(aviso.getByRole('checkbox')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Salvar novo horário' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('conflitos-320.png') });
});

for (const modo of ['agendar', 'reagendar']) {
  test(`${modo}: escolher alternativa preenche sem enviar e preserva os demais campos`, async ({
    page,
  }, info) => {
    const posts: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST') posts.push(r.url());
    });
    await page.goto(`/preview/conflitos-agenda?modo=${modo}&alternativas=sim`);
    const botao = page.getByRole('button', {
      name: modo === 'agendar' ? 'Criar reunião e enviar convite' : 'Salvar novo horário',
      exact: true,
    });
    const data = page.getByLabel('Data e horário', { exact: true });
    const antes = await data.inputValue();
    await page.getByLabel('Duração (minutos)').fill('60');
    if (modo === 'agendar')
      await page.getByLabel('Título (opcional)').fill('Conversa de diagnóstico');
    await botao.click();
    const grupo = page.getByRole('group', { name: 'Escolher outro horário' });
    await expect(grupo.getByRole('button')).toHaveCount(3);
    await grupo.scrollIntoViewIfNeeded();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath(`${modo}-alternativas.png`) });
    const opcao = grupo.getByRole('button').first();
    await opcao.focus();
    await opcao.press('Enter');
    await expect(data).not.toHaveValue(antes);
    await expect(data).toBeFocused();
    await expect(grupo).toHaveCount(0);
    await expect(page.locator('[name="confirmacaoHorario"]')).toHaveCount(0);
    await expect(page.getByLabel('Duração (minutos)')).toHaveValue('60');
    await expect(page.getByLabel('Consultas simuladas')).toHaveText('1');
    if (modo === 'agendar') {
      await expect(page.getByLabel('Título (opcional)')).toHaveValue('Conversa de diagnóstico');
      await expect(page.locator('[name="convidadoEmail"]')).toHaveValue('camila@example.test');
    }
    await botao.click();
    await expect(page.getByLabel('Consultas simuladas')).toHaveText('2');
    await expect(
      page.getByText(
        modo === 'agendar'
          ? 'Simulação concluída. Nenhum convite foi enviado.'
          : 'Horário atualizado',
        { exact: true },
      ),
    ).toBeVisible();
    expect(posts).toEqual([]);
  });
}

test('alternativa ocupada depois da consulta exige nova decisão', async ({ page }) => {
  await page.goto('/preview/conflitos-agenda?modo=reagendar&alternativas=ocupou');
  const salvar = page.getByRole('button', { name: 'Salvar novo horário' });
  await salvar.click();
  await page
    .getByRole('group', { name: 'Escolher outro horário' })
    .getByRole('button')
    .first()
    .click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await salvar.click();
  await expect(
    page.getByRole('region', { name: 'Você já tem uma reunião neste horário' }),
  ).toBeVisible();
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await expect(page.getByText('Horário atualizado', { exact: true })).toHaveCount(0);
});

for (const [modo, mensagem] of [
  ['vazio', 'Sem alternativas nesse período. Você pode escolher outra data.'],
  ['falha', 'Não foi possível buscar alternativas. Você pode ajustar o horário.'],
]) {
  test(`alternativas ${modo}: permite edição manual sem apagar o conflito`, async ({ page }) => {
    await page.goto(`/preview/conflitos-agenda?modo=reagendar&alternativas=${modo}`);
    await page.getByRole('button', { name: 'Salvar novo horário' }).click();
    await expect(page.getByText(mensagem, { exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox')).not.toBeChecked();
    await page.getByLabel('Data e horário', { exact: true }).fill('2099-10-15T11:00');
    await expect(
      page.getByRole('region', { name: 'Você já tem uma reunião neste horário' }),
    ).toHaveCount(0);
  });
}

test('alternativas em 320px: opções legíveis e tocáveis, rodapé alcançável', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/conflitos-agenda?modo=reagendar&alternativas=sim');
  const salvar = page.getByRole('button', { name: 'Salvar novo horário' });
  await salvar.click();
  const grupo = page.getByRole('group', { name: 'Escolher outro horário' });
  await grupo.scrollIntoViewIfNeeded();
  for (const botao of await grupo.getByRole('button').all()) {
    expect((await botao.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('alternativas-320.png') });
  await expect(salvar).toBeInViewport();
});

test.describe('fuso da data escolhida', () => {
  test.use({ timezoneId: 'America/New_York' });
  test('offset acompanha o horário de verão, não a data atual', async ({ page }) => {
    await page.goto('/preview/conflitos-agenda?modo=reagendar');
    const data = page.getByLabel('Data e horário', { exact: true });
    await expect(page.locator('[name="fusoHorario"]')).toHaveValue('America/New_York');
    await data.fill('2099-01-12T09:00');
    await expect(page.locator('[name="offsetMinutos"]')).toHaveValue('300');
    await data.fill('2099-07-12T09:00');
    await expect(page.locator('[name="offsetMinutos"]')).toHaveValue('240');
  });
});
