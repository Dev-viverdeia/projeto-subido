/** Valida páginas reais com conta descartável. Não inicia checkout nem concede créditos. */
/* global document, window -- executados apenas dentro de page.evaluate no navegador */
import { randomBytes } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium } from '@playwright/test';

if (!process.argv.includes('--confirmar-teste'))
  throw new Error('Use --confirmar-teste para criar e apagar uma conta de QA.');
const url = process.env.SUBIDO_APP_URL || 'http://localhost:3131';
const origem = new URL(url);
if (!['localhost', '127.0.0.1', 'subido.viverdeia.ai'].includes(origem.hostname))
  throw new Error('Destino fora da lista de QA.');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !publishable || !secret) throw new Error('Configuração Supabase ausente.');
const admin = createClient(supabaseUrl, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = `qa-cobranca-${Date.now()}@example.invalid`;
const password = randomBytes(24).toString('base64url');
const cookies = new Map();
const ssr = createServerClient(supabaseUrl, publishable, {
  cookies: {
    getAll: () => [...cookies.values()],
    setAll: (novos) => {
      for (const cookie of novos) cookies.set(cookie.name, cookie);
    },
  },
});
let usuario;
let browser;
try {
  const criado = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { qa_cobranca: true, plano_subido: 'starter' },
    user_metadata: {
      nome: 'QA Cobrança',
      introducao_subido_concluida_em: new Date().toISOString(),
    },
  });
  if (criado.error) throw criado.error;
  usuario = criado.data.user.id;
  const login = await ssr.auth.signInWithPassword({ email, password });
  if (login.error) throw login.error;
  const pasta = await mkdtemp(join(tmpdir(), 'subido-cobranca-qa-'));
  browser = await chromium.launch();
  for (const [nome, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addCookies(
      [...cookies.values()].map(({ name, value }) => ({
        name,
        value,
        domain: origem.hostname,
        path: '/',
        secure: origem.protocol === 'https:',
        sameSite: 'Lax',
      })),
    );
    const page = await context.newPage();
    const erros = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    for (const [caminho, titulo] of [
      ['/conta/assinatura', 'Plano e créditos'],
      ['/conta/creditos', 'Seus créditos'],
    ]) {
      await page.goto(`${url}${caminho}`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { level: 1, name: titulo }).waitFor();
      const medidas = await page.evaluate(() => ({
        largura: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      if (medidas.largura > medidas.viewport + 1) throw new Error(`Overflow ${nome} ${caminho}`);
      await page.screenshot({
        path: join(pasta, `${nome}-${caminho.split('/').at(-1)}.png`),
        fullPage: true,
      });
      console.log(JSON.stringify({ viewport: nome, rota: caminho, ok: true }));
    }
    await page.goto(`${url}/conta/assinatura?checkout=sucesso`, { waitUntil: 'networkidle' });
    await page.getByText('Não foi possível identificar este pagamento.').waitFor();
    const response = await context.request.get(`${url}/api/billing/checkout?session_id=forjado`);
    if (response.status() !== 400) throw new Error('Checkout inválido não foi rejeitado.');
    if (erros.length) throw new Error(`Erro de renderização: ${erros.join('; ')}`);
    await context.close();
  }
  const [assinaturas, pedidos] = await Promise.all([
    admin
      .from('billing_assinaturas')
      .select('usuario_id', { count: 'exact', head: true })
      .eq('usuario_id', usuario),
    admin
      .from('billing_pedidos_creditos')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', usuario),
  ]);
  if (assinaturas.error || pedidos.error || assinaturas.count !== 0 || pedidos.count !== 0)
    throw new Error('O teste não deveria criar operações financeiras.');
  console.log(
    JSON.stringify({ capturas: pasta, assinaturas: 0, pedidos: 0, cobrancas_iniciadas: 0 }),
  );
} finally {
  await browser?.close().catch(() => {
    process.exitCode = 1;
  });
  if (usuario) {
    const { error } = await admin.auth.admin.deleteUser(usuario);
    if (error) {
      console.error('Falha ao limpar a conta QA. Verificar pelo identificador qa_cobranca.');
      process.exitCode = 1;
    } else console.log('Conta descartável removida.');
  }
}
