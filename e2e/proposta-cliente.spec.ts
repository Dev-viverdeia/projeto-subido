import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('proposta permite ler escopo e prazo por teclado sem perder as condições', async ({
  page,
}) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') erros.push(msg.text());
  });
  await page.goto('/preview/proposta-cliente');
  await expect(
    page.getByRole('heading', { name: 'Atendimento com IA para sua clínica' }),
  ).toBeVisible();
  await expect(page.getByText('50% no início e 50% após a validação do projeto.')).toBeVisible();
  await page.getByRole('link', { name: 'Escopo e prazo' }).click();
  await expect(page.getByRole('heading', { name: 'O que será feito' })).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'O que será feito' })).toBeFocused();
  await page.locator('summary').filter({ hasText: 'Assistente no WhatsApp' }).press('Enter');
  await expect(
    page.getByText(
      'Configuração da base de conhecimento e das respostas, com limites definidos e transferência para uma pessoa.',
    ),
  ).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Ver atividades' }).first().press('Enter');
  await expect(
    page.getByText('Mapear perguntas, definir as regras e aprovar o fluxo com a equipe.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Decidir', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sua decisão' })).toBeInViewport();
  const decisaoAuditada = await new AxeBuilder({ page }).analyze();
  expect(
    decisaoAuditada.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  await page.getByRole('link', { name: 'Rever condições' }).click();
  await expect(page.getByRole('heading', { name: 'Investimento' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(
    auditoria.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
  ).toEqual([]);
  expect(erros).toEqual([]);
});

test('documento longo se adapta a telas estreitas e tablet', async ({ page }) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/preview/proposta-cliente?estado=longo');
    await page.getByRole('link', { name: 'Decidir', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Sua decisão' })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page
      .getByLabel('Comentário', { exact: false })
      .fill('Preciso revisar o escopo antes de decidir.');
    await expect(page.getByRole('button', { name: 'Aprovar proposta', exact: true })).toBeEnabled();
  }
});

test('erro de envio conserva os dados e a concordância do cliente', async ({ page }) => {
  await page.goto('/preview/proposta-cliente?estado=erro#decisao');
  await page.getByLabel('Seu nome', { exact: true }).fill('Camila Souza');
  await page.getByLabel('Comentário', { exact: false }).fill('Iniciar na segunda-feira.');
  await page.getByRole('checkbox').check();
  await expect(page.getByLabel('Seu nome', { exact: true })).toHaveValue('Camila Souza');
  await page.getByRole('button', { name: 'Aprovar proposta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aprovando…' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Não aprovar proposta' })).toBeDisabled();
  await expect(page.getByRole('form').getByRole('alert')).toContainText(
    'Não foi possível registrar',
  );
  await expect(page.getByRole('form').getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('Seu nome', { exact: true })).toHaveValue('Camila Souza');
  await expect(page.getByLabel('Comentário', { exact: false })).toHaveValue(
    'Iniciar na segunda-feira.',
  );
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.getByRole('button', { name: 'Aprovar proposta', exact: true })).toBeEnabled();
});

test('conexão lenta só libera a edição quando pode preservar os dados', async ({ page }) => {
  let liberar!: () => void;
  const javascriptDisponivel = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  await page.route(/\/_next\/static\/chunks\/.*\.js(?:\?.*)?$/, async (route) => {
    await javascriptDisponivel;
    await route.continue();
  });
  try {
    await page.goto('/preview/proposta-cliente?estado=erro#decisao', { waitUntil: 'commit' });
    await expect(page.getByLabel('Seu nome', { exact: true })).toHaveAttribute('readonly');
    await expect(
      page.getByRole('button', { name: 'Aprovar proposta', exact: true }),
    ).toBeDisabled();
    await expect(page.getByRole('checkbox')).toBeDisabled();
  } finally {
    liberar();
  }
  await page.getByLabel('Seu nome', { exact: true }).fill('Camila Souza');
  await page.getByLabel('Seu e-mail', { exact: true }).fill('camila.souza@example.com');
  await page.getByLabel('Comentário', { exact: false }).fill('Revisar na segunda-feira.');
  await page.getByRole('button', { name: 'Não aprovar proposta' }).click();
  await expect(page.getByRole('form').getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('Seu nome', { exact: true })).toHaveValue('Camila Souza');
  await expect(page.getByLabel('Seu e-mail', { exact: true })).toHaveValue(
    'camila.souza@example.com',
  );
  await expect(page.getByLabel('Comentário', { exact: false })).toHaveValue(
    'Revisar na segunda-feira.',
  );
});

test('aprovação simulada exige aceite e só então oferece o pagamento', async ({ page }) => {
  await page.goto('/preview/proposta-cliente#decisao');
  await page.getByRole('button', { name: 'Aprovar proposta', exact: true }).click();
  await expect(page.getByRole('form').getByRole('alert')).toContainText('Confirme que leu');
  await expect(page.getByRole('link', { name: 'Abrir pagamento' })).toHaveCount(0);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Aprovar proposta', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Proposta aprovada');
  await expect(page.getByRole('link', { name: 'Abrir pagamento' })).toHaveAttribute(
    'href',
    'https://example.com/pagamento',
  );
});

test('recusa simulada fica explícita e não pede aceite nem pagamento', async ({ page }) => {
  await page.goto('/preview/proposta-cliente#decisao');
  await page.getByRole('button', { name: 'Não aprovar proposta' }).click();
  await expect(page.getByRole('status')).toContainText('Proposta não aprovada');
  await expect(page.getByRole('link', { name: 'Abrir pagamento' })).toHaveCount(0);
});

for (const estado of ['aceita', 'recusada', 'sem-valor', 'longo']) {
  test(`proposta ${estado} mantém leitura e navegação no tamanho da tela`, async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/preview/proposta-cliente?estado=${estado}`);
    if (estado === 'aceita' || estado === 'recusada') {
      await expect(page.getByRole('form')).toHaveCount(0);
      await page.getByRole('link', { name: 'Ver decisão', exact: true }).click();
      await expect(
        page.getByRole('heading', {
          name: estado === 'aceita' ? 'Proposta aprovada' : 'Proposta não aprovada',
          exact: true,
        }),
      ).toBeInViewport();
    } else if (estado === 'sem-valor') {
      await expect(page.getByText('A definir').first()).toBeVisible();
    } else {
      await expect(page.locator('summary').filter({ hasText: /^Frente/ })).toHaveCount(10);
      await page
        .locator('summary')
        .filter({ hasText: /^Frente 10:/ })
        .press('Enter');
      await page.getByRole('link', { name: 'Decidir', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Sua decisão' })).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(erros).toEqual([]);
  });
}
