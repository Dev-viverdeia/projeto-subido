import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3115';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('Capturas permitidas somente no preview local.');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 1000 },
    deviceScaleFactor: 1,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });
  await mkdir('public/ajuda', { recursive: true });
  // Os exemplos não podem disparar ações de servidor, OAuth ou integrações externas.
  await page.route('**/*', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (
      req.method() !== 'GET' ||
      url.pathname.startsWith('/api/') ||
      !['localhost', '127.0.0.1'].includes(url.hostname)
    )
      return route.abort();
    return route.continue();
  });
  async function abrir(path) {
    await page.goto(`${base}${path}`);
    await page.addStyleTag({ content: 'nextjs-portal { display: none; }' });
    await page.locator('body').evaluate(async (el) => {
      await el.ownerDocument.fonts.ready;
    });
  }
  async function capturar(locator, nome) {
    await locator.screenshot({ path: `public/ajuda/${nome}.png`, animations: 'disabled' });
    console.log(nome);
  }
  for (const estado of ['desconectado', 'conectado']) {
    await abrir(`/preview/agenda-conta?estado=${estado}`);
    await capturar(page.getByRole('region', { name: 'Google Calendar' }), `agenda-${estado}`);
  }
  await abrir('/preview/proposta-nova?estado=sem-reuniao');
  await page.getByRole('combobox', { name: /Projeto-base/ }).selectOption('sem-base');
  await page.getByRole('heading', { name: 'Criar proposta', exact: true }).click();
  await capturar(page.locator('form'), 'proposta-sem-reuniao');
  await abrir('/preview/calls?calendar=1&modal=1');
  await page
    .getByRole('combobox', { name: 'Cliente em negociação' })
    .selectOption('33333333-3333-4333-8333-333333333333');
  await page.getByLabel('Data e horário', { exact: true }).fill('2026-10-15T14:00');
  await page.getByLabel('E-mail do cliente', { exact: true }).fill('cliente@example.test');
  await page.getByRole('heading', { name: 'Agendar reunião', exact: true }).click();
  await capturar(page.getByRole('dialog'), 'agendar-reuniao');
  await abrir('/preview/sala-entrega?estado=execucao');
  await capturar(page.getByRole('region', { name: 'Gestão da entrega' }), 'entrega-gestao');
  await page.getByRole('button', { name: 'Pontual', exact: true }).click();
  await capturar(page.getByRole('dialog'), 'entrega-tipo');
  console.log(
    'Seis capturas reais. Dados demonstrativos; nenhuma alteração, convite ou consumo de créditos.',
  );
} finally {
  await browser.close();
}
