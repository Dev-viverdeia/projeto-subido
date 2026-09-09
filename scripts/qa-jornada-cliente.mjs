/* global document, innerWidth, window */
// Teste opt-in: somente uma conta descartável, sem IA, convites ou envio de propostas.
import { randomBytes } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium, expect as expectBase } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

if (!process.argv.includes('--confirmar-teste')) throw new Error('Use --confirmar-teste.');
const app = process.env.SUBIDO_APP_URL || 'http://localhost:3115';
if (!['localhost', '127.0.0.1', 'subido.viverdeia.ai'].includes(new URL(app).hostname))
  throw new Error('Destino de teste inválido.');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !key || !secret) throw new Error('Configuração ausente.');
const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const expect = expectBase.configure({ timeout: 30_000 });
const pasta = await mkdtemp(join(tmpdir(), 'subido-jornada-cliente-'));
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(30_000);
const erros = [];
page.on('pageerror', (erro) => erros.push(erro.message));
let usuario;
const exigir = ({ data, error }) => {
  if (error) throw new Error(`QA: ${error.code || 'erro'} ${error.message}`);
  return data;
};
async function conferir(nome) {
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page).toHaveTitle(/\S/);
  await page.screenshot({ path: join(pasta, `${nome}.png`), fullPage: false, caret: 'initial' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(
    axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(erros).toEqual([]);
  console.log(`OK: ${nome}`);
}
try {
  const email = `qa-jornada-cliente-${Date.now()}@example.invalid`;
  const password = randomBytes(24).toString('base64url');
  usuario = exigir(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { plano_subido: 'pro', qa_jornada_cliente: true },
      user_metadata: {
        nome: 'QA Jornada Cliente',
        introducao_subido_concluida_em: new Date().toISOString(),
      },
    }),
  ).user;
  const cookies = new Map();
  const db = createServerClient(url, key, {
    cookies: {
      getAll: () => [...cookies.values()],
      setAll: (novos) => {
        for (const c of novos) cookies.set(c.name, c);
      },
    },
  });
  exigir(await db.auth.signInWithPassword({ email, password }));
  expect(exigir(await db.from('user_roles').select('papel'))).toEqual([{ papel: 'membro' }]);
  await context.addCookies(
    [...cookies.values()].map(({ name, value }) => ({
      name,
      value,
      domain: new URL(app).hostname,
      path: '/',
      secure: app.startsWith('https:'),
      sameSite: 'Lax',
    })),
  );
  const slug = 'sdr-atendimento-qualificacao';
  await page.goto(`${app}/solucoes/${slug}`);
  await page.getByRole('button', { name: 'Usar com cliente', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Usar com cliente' })).toBeFocused();
  await conferir('01-projeto-cliente-mobile');
  await page.getByRole('link', { name: 'Adicionar empresa', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Adicionar oportunidade' });
  await expect(dialogo).toBeVisible();
  const titulo = await dialogo.getByLabel('Projeto de IA (opcional)').inputValue();
  expect(titulo.length).toBeGreaterThan(0);
  await dialogo.getByLabel('Empresa', { exact: true }).fill('QA Clínica Jornada');
  await dialogo.getByLabel('Contato principal', { exact: true }).fill('Contato de teste');
  await conferir('02-nova-oportunidade-mobile');
  await dialogo.getByRole('button', { name: 'Criar oportunidade', exact: true }).click();
  await page.waitForURL(/\/vendas\/[a-f0-9-]+\?/);
  const oportunidade = new URL(page.url()).pathname.split('/').at(-1);
  expect(new URL(page.url()).searchParams.get('projeto')).toBe(slug);
  const criar = page.getByRole('link', { name: 'Criar proposta', exact: true }).first();
  await expect(criar).toHaveAttribute(
    'href',
    new RegExp(`oportunidade=${oportunidade}.*projeto=${slug}`),
  );
  await conferir('03-ficha-mobile');
  await criar.click();
  await expect(page.getByRole('combobox', { name: /^Projeto-base/ })).toHaveValue(
    `projeto:${slug}`,
  );
  await expect(
    page.getByText('Reunião opcional. O rascunho não será enviado ao cliente.'),
  ).toBeVisible();
  await conferir('04-proposta-sem-reuniao-mobile');
  await page.getByRole('button', { name: 'Criar rascunho', exact: true }).click();
  await page.waitForURL(/\/propostas\/[a-f0-9-]+$/);
  const proposta = new URL(page.url()).pathname.split('/').at(-1);
  const registro = exigir(
    await db
      .from('propostas')
      .select('status,reuniao_id,projeto_id,documento')
      .eq('id', proposta)
      .single(),
  );
  expect(registro.status).toBe('rascunho');
  expect(registro.reuniao_id).toBeNull();
  expect(registro.projeto_id).toBeTruthy();
  // Fixture explícita: não simula aceite de cliente real nem envia mensagens.
  for (const status of ['pronta', 'apresentada', 'aceita']) {
    exigir(await db.from('propostas').update({ status }).eq('id', proposta).eq('dono', usuario.id));
  }
  const entrega = exigir(await db.rpc('projeto_iniciar', { p_proposta_id: proposta }));
  expect(entrega).toBeTruthy();
  await page.goto(`${app}/entregas`);
  await expect(
    page.getByRole('link', { name: 'Abrir entrega de QA Clínica Jornada' }),
  ).toBeVisible();
  const continuar = page.getByText('Continuar entrega', { exact: true });
  await expect(continuar).toBeInViewport({ ratio: 1 });
  expect(
    await continuar.evaluate((el) => {
      const { x, y, width, height } = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(x + width / 2, y + height / 2));
    }),
  ).toBe(true);
  await conferir('05-entregas-mobile');
  await page.getByRole('link', { name: 'Abrir entrega de QA Clínica Jornada' }).click();
  await expect(page).toHaveURL(`${app}/entregas/${entrega}`);
  await expect(
    page.getByText('O escopo aprovado já virou projeto. Confirme três pontos para começar.'),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await conferir('06-sala-entrega-mobile');
  await page.goto(`${app}/solucoes/${slug}`);
  await page.getByRole('button', { name: 'Usar com cliente', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Abrir entrega', exact: true })).toHaveAttribute(
    'href',
    `/entregas/${entrega}`,
  );
  await expect(page.getByRole('link', { name: 'Criar proposta', exact: true })).toHaveCount(0);
  await conferir('07-retomada-sem-duplicar-mobile');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await conferir('08-retomada-desktop');
  await page.goto(`${app}/admin`);
  await expect(
    page.getByRole('heading', { name: 'Este conteúdo não está disponível.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Gestão' }).getByRole('link', { name: 'Administração' }),
  ).toHaveCount(0);
  console.log('OK: conta comum sem acesso administrativo');
} catch (erro) {
  await page.screenshot({ path: join(pasta, 'falha.png'), fullPage: true }).catch(() => {});
  throw erro;
} finally {
  console.log(`Evidências: ${pasta}`);
  try {
    if (usuario) {
      // Cascatas do banco removem somente os registros deste usuário descartável.
      exigir(await admin.auth.admin.deleteUser(usuario.id));
      console.log('Conta de teste e seus registros removidos.');
    }
  } finally {
    await browser.close();
  }
}
