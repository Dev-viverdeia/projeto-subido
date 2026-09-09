/** Capturas reais de componentes, somente com dados fictícios da rota de preview local. */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 920 },
    deviceScaleFactor: 1,
  });
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3113';
  if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
    throw Error('Somente preview local');
  await mkdir('public/ajuda', { recursive: true });
  await page.goto(`${base}/preview/suporte?tela=pedido-cliente`);
  await page.addStyleTag({ content: 'nextjs-portal { display: none; }' });
  await page.getByLabel('O que você precisa resolver?').fill('Ajuda para conectar minha agenda');
  await page
    .getByLabel('Descreva o que aconteceu')
    .fill('Escolhi minha conta no Google, mas a agenda ainda não aparece conectada.');
  await page.getByRole('heading', { name: 'Pedir ajuda', exact: true }).click();
  await page
    .locator('form')
    .screenshot({ path: 'public/ajuda/pedir-ajuda.png', animations: 'disabled' });
  await page.goto(`${base}/preview/suporte?tela=conversa`);
  await page.addStyleTag({ content: 'nextjs-portal { display: none; }' });
  await page
    .locator('[aria-label="Mensagens do atendimento"]')
    .screenshot({ path: 'public/ajuda/acompanhar-resposta.png', animations: 'disabled' });
  console.log('Duas capturas reais com dados demonstrativos, sem envios.');
} finally {
  await browser.close();
}
