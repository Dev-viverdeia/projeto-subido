import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('roteiro em foco mantém personalização e não inicia mídia ou análise', async ({
  page,
}, info) => {
  const mutacoes: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' || r.url().includes('/api/calls/')) mutacoes.push(r.url());
  });
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('/preview/call-preparo');
  const roteiro = page.getByRole('region', { name: 'Roteiro da reunião', exact: true });
  await expect(roteiro.getByRole('heading', { level: 3 })).toHaveText(
    'Qual resultado mais importante você quer melhorar no atendimento?',
  );
  await expect(roteiro.getByText('Entender o resultado que orienta a conversa.')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Entrar na reunião', exact: true })).toHaveAttribute(
    'href',
    '/sala/preview-clinica-horizonte',
  );
  await page.getByRole('button', { name: 'Próxima pergunta', exact: true }).click();
  await expect(roteiro.getByRole('heading', { level: 3 })).toHaveText(
    'Como as mensagens são distribuídas quando há troca de turno?',
  );
  await roteiro.getByText('O que entender', { exact: true }).click();
  await expect(roteiro.getByText('Projeto em análise: SDR de atendimento com IA')).toBeVisible();
  await page.getByRole('button', { name: 'Como abrir', exact: true }).click();
  await expect(roteiro.locator('blockquote')).toHaveText(
    'Quero entender como o atendimento funciona hoje e avaliar se um piloto pequeno faz sentido para a operação.',
  );
  await page.getByRole('button', { name: 'Como fechar', exact: true }).click();
  await expect(roteiro.getByText('Desenhar um piloto para uma unidade.')).toBeVisible();
  await page.getByRole('button', { name: 'Perguntas', exact: true }).click();
  await expect(roteiro.getByText('2 de 4')).toBeVisible();
  expect(mutacoes).toEqual([]);
  expect(erros).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('preparacao.png'), fullPage: true });
});

test('lista completa permite escolher a pergunta e devolve foco por teclado', async ({ page }) => {
  await page.goto('/preview/call-preparo');
  const todas = page.locator('summary').filter({ hasText: 'Ver todas as perguntas' });
  await todas.focus();
  await page.keyboard.press('Enter');
  const lista = page.getByRole('list', { name: 'Todas as perguntas' });
  await expect(lista.getByRole('button')).toHaveCount(4);
  const ultima = lista.getByRole('button').last();
  await ultima.focus();
  await page.keyboard.press('Enter');
  const pergunta = page.getByRole('heading', {
    name: 'Quem precisa participar da decisão para aprovar um piloto?',
  });
  await expect(pergunta).toBeFocused();
  await expect(lista).toBeHidden();
  await expect(page.getByText('4 de 4')).toBeVisible();
  await page.getByRole('button', { name: 'Ver fechamento' }).click();
  await expect(page.getByRole('heading', { name: 'Combinar o próximo passo' })).toBeVisible();
});

test('informações adicionais preservam fatos, hipóteses e projetos separados', async ({ page }) => {
  await page.goto('/preview/call-preparo');
  const cliente = page.getByRole('complementary', {
    name: 'Informações do cliente para a reunião',
  });
  await expect(cliente.getByText('Unidades: duas')).toBeHidden();
  await cliente.locator('summary').filter({ hasText: 'Mais informações' }).click();
  await expect(cliente.getByText('Unidades: duas')).toBeVisible();
  await expect(cliente.getByText('Contatos sem responsável durante a troca de turno')).toBeHidden();
  await cliente.locator('summary').filter({ hasText: 'Hipóteses a confirmar' }).click();
  await expect(
    cliente.getByText('Contatos sem responsável durante a troca de turno'),
  ).toBeVisible();
  await cliente.locator('summary').filter({ hasText: 'Projetos em análise' }).click();
  await expect(cliente.getByText('Valide a necessidade antes de propor.')).toBeVisible();
  await expect(cliente.getByText('SDR de atendimento com IA', { exact: true })).toBeVisible();
});

test('320px mantém textos completos, botões legíveis e nenhum scroll horizontal', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/preview/call-preparo?estado=extenso');
  const roteiro = page.getByRole('region', { name: 'Roteiro da reunião' });
  await roteiro.getByText('O que entender', { exact: true }).click();
  await expect(roteiro.getByRole('heading', { level: 3 })).toContainText(
    'Considere os turnos da manhã e da noite',
  );
  for (const label of ['Como abrir', 'Perguntas', 'Como fechar', 'Próxima pergunta']) {
    const botao = roteiro.getByRole('button', { name: label, exact: true });
    const caixa = await botao.boundingBox();
    expect(caixa!.height).toBeGreaterThanOrEqual(44);
    expect(
      await botao.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(15);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('preparacao-320.png'), fullPage: true });
});

test('sem enriquecimento ou sem perguntas a sala e o restante do roteiro continuam acessíveis', async ({
  page,
}) => {
  await page.goto('/preview/call-preparo?estado=essencial');
  await expect(page.getByText('A ficha ainda não foi enriquecida.')).toBeVisible();
  await expect(page.getByText(/Live Coach ativado/)).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Enriquecer na ficha' })).toHaveAttribute(
    'href',
    '/vendas/22222222-2222-4222-8222-222222222222',
  );
  await expect(page.getByRole('button', { name: 'Próxima pergunta' })).toBeEnabled();
  await page.goto('/preview/call-preparo?estado=vazio');
  await expect(page.getByText(/Não há perguntas neste roteiro/)).toBeVisible();
  await expect(page.getByText('Ainda não há informações no roteiro.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Entrar na reunião' })).toBeVisible();
  await page.getByRole('button', { name: 'Como fechar' }).click();
  await expect(page.getByRole('heading', { name: 'Combinar o próximo passo' })).toBeVisible();
});

test('kickoff preserva o projeto e o próximo passo de entrega', async ({ page }) => {
  await page.goto('/preview/call-preparo?tipo=kickoff');
  await expect(page.getByRole('heading', { name: 'Acordos essenciais' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Entrar no kickoff' })).toHaveAttribute(
    'href',
    '/sala/preview-kickoff-clinica-horizonte',
  );
  await expect(page.getByRole('link', { name: 'Abrir projeto' })).toHaveAttribute(
    'href',
    '/entregas/33333333-3333-4333-8333-333333333333',
  );
  await page.getByRole('button', { name: 'Como fechar' }).click();
  await expect(page.getByText('Confirmar o acordo e iniciar a primeira tarefa.')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('tipos de reunião mantêm objetivos e perguntas próprios', async ({ page }) => {
  for (const [tipo, pergunta] of [
    ['proposta', 'O resultado esperado continua sendo o mesmo que alinhamos?'],
    ['follow_up', 'O que mudou desde a nossa última conversa?'],
    ['entrega', 'O que já mudou na operação desde que a solução entrou em uso?'],
  ]) {
    await page.goto(`/preview/call-preparo?tipo=${tipo}`);
    await expect(page.getByRole('heading', { name: pergunta, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar na reunião' })).toBeVisible();
  }
});

test('foco visível e cores forçadas preservam seleção e navegação', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/preview/call-preparo');
  const abrir = page.getByRole('button', { name: 'Como abrir', exact: true });
  await abrir.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(abrir).toHaveAttribute('aria-pressed', 'true');
  expect(await abrir.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('preparacao-contraste.png'), fullPage: true });
});
