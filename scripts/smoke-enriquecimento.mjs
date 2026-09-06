/** QA descartável: faz uma análise real e remove somente os dados desta conta. */
/* global document, window */
import { randomBytes } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium } from '@playwright/test';

if (!process.argv.includes('--confirmar-teste')) throw new Error('Use --confirmar-teste.');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !key || !secret) throw new Error('Configuração ausente.');
const app = process.env.SUBIDO_APP_URL;
if (app && !['localhost', '127.0.0.1', 'subido.viverdeia.ai'].includes(new URL(app).hostname))
  throw new Error('Destino de QA inválido.');
const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cookies = new Map();
const client = createServerClient(url, key, {
  cookies: {
    getAll: () => [...cookies.values()],
    setAll: (novos) => {
      for (const cookie of novos) cookies.set(cookie.name, cookie);
    },
  },
});
const email = `qa-enriquecimento-${Date.now()}@example.invalid`;
const password = randomBytes(24).toString('base64url');
const exigir = (resposta) => {
  if (resposta.error) throw new Error(resposta.error.message);
  return resposta.data;
};
let usuario;
let browser;
try {
  usuario = exigir(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome: 'QA Enriquecimento',
        introducao_subido_concluida_em: new Date().toISOString(),
      },
      app_metadata: { qa_enriquecimento: true, plano_subido: 'pro' },
    }),
  ).user.id;
  exigir(
    await admin.auth.admin.updateUserById(usuario, {
      app_metadata: { qa_enriquecimento: true, plano_subido: 'pro' },
    }),
  );
  exigir(await admin.from('prospeccao_carteiras').upsert({ dono: usuario, saldo: 30 }));
  exigir(await client.auth.signInWithPassword({ email, password }));
  const empresa = exigir(
    await client
      .from('crm_empresas')
      .insert({
        dono: usuario,
        nome: 'Clínica QA Subido',
        setor: 'Fisioterapia',
        cidade: 'Florianópolis',
        resumo:
          'Empresa fictícia para validação da plataforma. Atendimento por telefone, equipe de três pessoas. Quer avaliar agendamento assistido por IA.',
      })
      .select('id')
      .single(),
  );
  const oportunidade = exigir(
    await client
      .from('crm_oportunidades')
      .insert({ dono: usuario, empresa_id: empresa.id, titulo: 'Atendimento assistido por IA' })
      .select('id')
      .single(),
  );
  const inicio = Date.now();
  const pedido = { body: { oportunidade_id: oportunidade.id } };
  const [primeira, repetida] = await Promise.all([
    client.functions.invoke('enriquecimento', pedido),
    client.functions.invoke('enriquecimento', pedido),
  ]);
  const execucao = exigir(primeira);
  const duplicada = exigir(repetida);
  if (!execucao?.id || execucao.id !== duplicada?.id)
    throw new Error('Pedido repetido não reaproveitou a execução.');
  const patch = await client
    .from('crm_enriquecimentos')
    .update({ status: 'falhou' })
    .eq('id', execucao.id);
  if (!patch.error) throw new Error('Escrita direta não foi recusada.');
  console.log(
    'Início real confirmado; pedido duplicado reutilizou o ID; escrita direta bloqueada.',
  );
  if (app) {
    browser = await chromium.launch();
    const pasta = await mkdtemp(join(tmpdir(), 'subido-enriquecimento-qa-'));
    for (const [nome, width, height] of [
      ['desktop', 1440, 1000],
      ['mobile', 390, 844],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addCookies(
        [...cookies.values()].map(({ name, value }) => ({
          name,
          value,
          domain: new URL(app).hostname,
          path: '/',
          secure: new URL(app).protocol === 'https:',
          sameSite: 'Lax',
        })),
      );
      const page = await context.newPage();
      const erros = [];
      page.on('pageerror', (erro) => erros.push(erro.message));
      await page.goto(`${app}/vendas/${oportunidade.id}`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: 'Clínica QA Subido', exact: true }).waitFor();
      const dialogo = page.getByRole('dialog', { name: 'Atualizando a ficha do cliente' });
      if (await dialogo.count()) {
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Ver andamento' }).click();
      }
      if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1))
        throw new Error('Overflow horizontal.');
      await page.screenshot({ path: join(pasta, `${nome}.png`), fullPage: true });
      if (erros.length) throw new Error(`Erro de página: ${erros[0]}`);
      await context.close();
    }
    console.log(`Capturas: ${pasta}`);
  }
  let atual;
  do {
    atual = exigir(
      await client
        .from('crm_enriquecimentos')
        .select('status,etapa,erro,resultado')
        .eq('id', execucao.id)
        .single(),
    );
    if (['concluido', 'falhou'].includes(atual.status)) break;
    if (Date.now() - inicio > 180000) throw new Error('Execução ultrapassou a janela de QA.');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } while (!['concluido', 'falhou'].includes(atual.status));
  const carteira = exigir(await client.from('prospeccao_carteiras').select('saldo').single());
  const eventos = exigir(
    await client
      .from('crm_eventos')
      .select('id')
      .eq('fonte', 'enriquecimento')
      .eq('fonte_id', execucao.id),
  );
  console.log(
    JSON.stringify({
      status: atual.status,
      etapa: atual.etapa,
      segundos: Math.round((Date.now() - inicio) / 1000),
      saldo: carteira.saldo,
      eventos: eventos.length,
    }),
  );
  if (
    atual.status !== 'concluido' ||
    carteira.saldo !== 27 ||
    eventos.length !== 1 ||
    !atual.resultado?.resumo
  )
    throw new Error(`Análise não concluída corretamente: ${atual.erro ?? atual.status}`);
} finally {
  await browser?.close();
  if (usuario) {
    // Movimentos têm FK RESTRICT; remover primeiro somente os da fixture.
    exigir(await admin.from('prospeccao_movimentos').delete().eq('dono', usuario));
    exigir(await admin.auth.admin.deleteUser(usuario));
    console.log('Conta QA e dados descartáveis removidos.');
  }
}
