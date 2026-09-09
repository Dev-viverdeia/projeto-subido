/* global document, innerWidth */
import { randomBytes } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium, expect as expectBase } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const expect = expectBase.configure({ timeout: 30_000 });
export function exigir(r) {
  if (r.error) throw new Error(`QA: ${r.error.code || 'erro'} ${r.error.message}`);
  return r.data;
}
export async function criarHarness() {
  if (!process.argv.includes('--confirmar-teste')) throw new Error('Use --confirmar-teste.');
  const app = process.env.SUBIDO_APP_URL || 'http://127.0.0.1:3012';
  if (!['127.0.0.1', 'localhost', 'subido.viverdeia.ai'].includes(new URL(app).hostname))
    throw new Error('Destino inválido');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || !secret) throw new Error('Configuração ausente');
  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const publico = app.startsWith('https:');
  if (publico) {
    const equipeAtiva = exigir(
      await admin.from('suporte_agentes').select('usuario').eq('notificar', true).limit(1),
    );
    if (equipeAtiva.length)
      throw new Error('Use um ambiente isolado: há atendentes reais recebendo avisos.');
  }
  const emailQA = (nome) =>
    publico
      ? `delivered+qa-suporte-${nome}-${Date.now()}@resend.dev`
      : `qa-suporte-${nome}-${Date.now()}@example.invalid`;
  const browser = await chromium.launch();
  const usuarios = [],
    casos = [],
    caminhos = [];
  const erros = [];
  const pasta = await mkdtemp(join(tmpdir(), 'subido-suporte-qa-'));
  async function conta(nome, agente = false) {
    const email = emailQA(nome);
    const password = randomBytes(24).toString('base64url');
    const user = exigir(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nome: `QA ${nome}`,
          introducao_subido_concluida_em: new Date().toISOString(),
        },
        app_metadata: { plano_subido: 'starter', qa_suporte: true },
      }),
    ).user;
    usuarios.push(user.id);
    if (agente)
      exigir(
        await admin
          .from('suporte_agentes')
          .insert({ usuario: user.id, nome: 'QA Atendimento', notificar: false }),
      );
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
    const contexto = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      timezoneId: 'America/Sao_Paulo',
    });
    await contexto.addCookies(
      [...cookies.values()].map(({ name, value }) => ({
        name,
        value,
        domain: new URL(app).hostname,
        path: '/',
        secure: app.startsWith('https:'),
        sameSite: 'Lax',
      })),
    );
    contexto.setDefaultTimeout(30_000);
    const page = await contexto.newPage();
    page.on('pageerror', (e) => erros.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' && /hydration|hydrated|server rendered/i.test(m.text()))
        erros.push(m.text());
    });
    return { db, user, page, contexto };
  }
  async function visual(page, nome) {
    expect(erros).toEqual([]);
    for (const [formato, width, height] of [
      ['desktop', 1440, 1000],
      ['mobile', 390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      // Não altera atributos inline antes da hidratação do React.
      await page.screenshot({
        path: join(pasta, `${nome}-${formato}.png`),
        fullPage: true,
        caret: 'initial',
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect(erros).toEqual([]);
  }
  async function limpar() {
    if (caminhos.length) exigir(await admin.storage.from('suporte-privado').remove(caminhos));
    if (casos.length) exigir(await admin.from('suporte_atendimentos').delete().in('id', casos));
    for (const id of usuarios) exigir(await admin.auth.admin.deleteUser(id));
    await browser.close();
  }
  return { app, admin, anon, browser, conta, visual, limpar, pasta, casos, caminhos, emailQA };
}
