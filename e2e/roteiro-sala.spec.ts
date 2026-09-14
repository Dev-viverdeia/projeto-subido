import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('consulta roteiro sem Coach, preserva pergunta e não inicia APIs ou mídia', async ({
  page,
}, info) => {
  const chamadas: string[] = [];
  const erros: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' || r.url().includes('/api/calls/')) chamadas.push(r.url());
  });
  page.on('pageerror', (e) => erros.push(e.message));
  await page.addInitScript(() => {
    const auditoriaMidia = { chamadas: 0 };
    Object.assign(window, { auditoriaMidia });
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      writable: true,
      value: () => {
        auditoriaMidia.chamadas += 1;
        throw new Error('Permissão de mídia não deveria ser solicitada');
      },
    });
  });
  await page.goto('/preview/roteiro-sala');
  const painel = page.getByRole('complementary', { name: 'Apoio privado da reunião' });
  await expect(painel.getByText('Live Coach desligado')).toBeVisible();
  await painel.getByRole('button', { name: 'Próxima pergunta' }).click();
  const pergunta = await painel
    .getByRole('region', { name: 'Roteiro da reunião' })
    .getByRole('heading', { level: 3 })
    .innerText();
  await painel.getByRole('button', { name: 'Ao vivo', exact: true }).click();
  await expect(painel.getByRole('region', { name: 'Roteiro da reunião' })).toBeHidden();
  await expect(painel.getByRole('status')).toHaveText('Gravação indisponível');
  await painel.getByRole('button', { name: 'Roteiro', exact: true }).click();
  await expect(painel.getByRole('heading', { name: pergunta, exact: true })).toBeVisible();
  const perguntaCaixa = await painel
    .getByRole('heading', { name: pergunta, exact: true })
    .boundingBox();
  const consultasCaixa = await painel
    .getByRole('navigation', { name: 'Consultar durante a reunião' })
    .boundingBox();
  expect(perguntaCaixa!.y).toBeGreaterThanOrEqual(consultasCaixa!.y + consultasCaixa!.height);
  expect(perguntaCaixa!.y + perguntaCaixa!.height).toBeLessThanOrEqual(
    (await painel.getByRole('status').boundingBox())!.y,
  );
  expect(chamadas).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as Window & { auditoriaMidia: { chamadas: number } }).auditoriaMidia.chamadas,
    ),
  ).toBe(0);
  expect(erros).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('roteiro-sala.png'), fullPage: true });
});

test('rolagem do painel preserva controles da sala em 320px e perguntas completas', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/preview/roteiro-sala?estado=extenso');
  const roteiro = page.getByRole('region', { name: 'Roteiro da reunião' });
  await expect(roteiro.getByRole('heading', { level: 3 })).toContainText('Considere os turnos');
  await roteiro.getByText('Ver todas as perguntas', { exact: true }).click();
  const ultima = roteiro
    .getByRole('list', { name: 'Todas as perguntas' })
    .getByRole('button')
    .last();
  await ultima.click();
  await expect(roteiro.getByRole('list', { name: 'Todas as perguntas' })).toBeHidden();
  await expect(roteiro.getByRole('heading', { level: 3 })).toBeFocused();
  for (const label of ['Como abrir', 'Perguntas', 'Como fechar', 'Roteiro', 'Ao vivo']) {
    const button = page.getByRole('button', { name: label, exact: true });
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(
      await button.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(15);
  }
  const sair = page.getByRole('button', { name: 'Sair da reunião', exact: true });
  await expect(sair).toBeInViewport();
  for (const video of await page.getByRole('article').all()) {
    const caixa = await video.boundingBox();
    expect(caixa!.y + caixa!.height).toBeLessThanOrEqual((await sair.boundingBox())!.y);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(
    true,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('roteiro-sala-320.png'), fullPage: true });
});

test('convidado fica só com a sala, sem roteiro nem dados no HTML', async ({ page }) => {
  const resposta = await page.goto('/preview/roteiro-sala?papel=convidado');
  await expect(page.getByRole('button', { name: 'Sair da reunião', exact: true })).toBeVisible();
  await expect(page.getByRole('complementary')).toHaveCount(0);
  expect(await resposta!.text()).not.toContain('Atendimento com IA');
  await expect(page.getByRole('button', { name: 'Roteiro', exact: true })).toHaveCount(0);
});

test('kickoff tem acordos, e ausência de roteiro não bloqueia a sala', async ({ page }) => {
  await page.goto('/preview/roteiro-sala?tipo=kickoff&coach=ligado');
  await expect(page.getByRole('heading', { name: 'Acordos essenciais' })).toBeVisible();
  await page.getByRole('button', { name: 'Como fechar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Confirmar o acordo' })).toBeVisible();
  await page.goto('/preview/roteiro-sala?estado=indisponivel');
  await expect(page.getByRole('heading', { name: 'Roteiro indisponível' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver acompanhamento ao vivo' }).click();
  await expect(page.getByRole('heading', { name: 'Memória da reunião', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole('complementary', { name: 'Live Coach privado' })).toBeVisible();
  await page.goto('/preview/roteiro-sala?estado=vazio');
  await expect(page.getByText(/Não há perguntas neste roteiro/)).toBeVisible();
});

test('teclado, redução de movimento e privacidade do compartilhamento', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/preview/roteiro-sala');
  const vivo = page.getByRole('button', { name: 'Ao vivo', exact: true });
  await vivo.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await vivo.focus();
  await page.keyboard.press('Enter');
  await expect(vivo).toHaveAttribute('aria-pressed', 'true');
  expect(await vivo.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
  await page.getByText('Privado', { exact: true }).click();
  await expect(page.getByText(/Se compartilhar a tela inteira/)).toBeVisible();
  await page.screenshot({ path: info.outputPath('roteiro-sala-contraste.png'), fullPage: true });
});
