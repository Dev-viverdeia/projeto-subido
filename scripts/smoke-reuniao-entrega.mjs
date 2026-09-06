/** QA opt-in: reunião fictícia, jornada real pela UI, nenhum convite ou e-mail externo. */
/* global document, innerWidth */
import { randomBytes } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { chromium, expect } from '@playwright/test';

if (!process.argv.includes('--confirmar-teste')) throw new Error('Use --confirmar-teste.');
const app = process.env.SUBIDO_APP_URL || 'https://subido.viverdeia.ai';
if (!['127.0.0.1', 'localhost', 'subido.viverdeia.ai'].includes(new URL(app).hostname))
  throw new Error('Destino inválido.');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !key || !secret) throw new Error('Configuração ausente.');
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
function exigir(resposta) {
  if (resposta.error) throw new Error(`Operação de QA falhou: ${resposta.error.code || 'erro'}`);
  return resposta.data;
}
const pasta = await mkdtemp(join(tmpdir(), 'subido-reuniao-entrega-qa-'));
const email = `qa-reuniao-entrega-${Date.now()}@example.invalid`;
const password = randomBytes(24).toString('base64url');
let usuario;
let browser;
let page;
try {
  usuario = exigir(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome: 'QA Jornada',
        introducao_subido_concluida_em: new Date().toISOString(),
      },
    }),
  ).user.id;
  exigir(
    await admin.auth.admin.updateUserById(usuario, {
      app_metadata: { plano_subido: 'pro', qa_reuniao_entrega: true },
    }),
  );
  exigir(await client.auth.signInWithPassword({ email, password }));
  const empresa = exigir(
    await client
      .from('crm_empresas')
      .insert({ dono: usuario, nome: 'Clínica QA Jornada', setor: 'Saúde' })
      .select('id')
      .single(),
  );
  const oportunidade = exigir(
    await client
      .from('crm_oportunidades')
      .insert({
        dono: usuario,
        empresa_id: empresa.id,
        titulo: 'Atendimento com IA',
        etapa: 'descoberta',
      })
      .select('id')
      .single(),
  );
  const reuniao = exigir(
    await admin
      .from('calls_reunioes')
      .insert({
        dono: usuario,
        empresa_id: empresa.id,
        oportunidade_id: oportunidade.id,
        titulo: 'Descoberta QA Jornada',
        tipo: 'descoberta',
        status: 'concluida',
        agendada_para: new Date().toISOString(),
        iniciada_em: new Date(Date.now() - 1_800_000).toISOString(),
        encerrada_em: new Date().toISOString(),
        duracao_minutos: 30,
        live_coach_ativo: false,
      })
      .select('id')
      .single(),
  );
  exigir(
    await admin.from('calls_analises').insert({
      dono: usuario,
      reuniao_id: reuniao.id,
      status: 'concluida',
      resumo:
        'A recepção confirmou demora no atendimento e quer validar a triagem assistida por IA.',
      dores: ['Demora na primeira resposta'],
      compromissos: ['Cliente enviará uma amostra', 'Revisar escopo com a equipe'],
      proximos_passos: ['Apresentar o escopo revisado'],
      oportunidades_projeto: ['Atendimento com IA'],
      dados: {
        decisoes: ['Começar pelo atendimento de uma unidade'],
        sinais_compra: ['Direção confirmou a prioridade'],
        qa_reuniao_entrega: true,
      },
    }),
  );
  browser = await chromium.launch();
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  contexto.setDefaultTimeout(30_000);
  await contexto.addCookies(
    [...cookies.values()].map(({ name, value }) => ({
      name,
      value,
      domain: new URL(app).hostname,
      path: '/',
      secure: new URL(app).protocol === 'https:',
      sameSite: 'Lax',
    })),
  );
  page = await contexto.newPage();
  const erros = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto(`${app}/reunioes/${reuniao.id}`);
  const acao = page.getByLabel('Próxima ação da venda');
  await acao.fill('Apresentar o escopo revisado com a direção');
  await page.getByLabel('Data combinada').fill('2020-01-01');
  await page.getByLabel('Próxima etapa da venda').selectOption('proposta');
  await page.getByRole('checkbox').last().uncheck();
  await page.getByRole('button', { name: 'Confirmar e atualizar a venda' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'O plano não foi salvo' })).toContainText(
    'Escolha uma data de hoje',
  );
  await expect(acao).toHaveValue('Apresentar o escopo revisado com a direção');
  await expect(page.getByRole('checkbox').last()).not.toBeChecked();
  const data = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel('Data combinada').fill(data);
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    await page.getByRole('button', { name: 'Confirmar e atualizar a venda' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Plano salvo na ficha' }),
    ).toBeVisible();
  }
  const acoes = exigir(
    await client.from('projeto_acoes').select('id,categoria').eq('reuniao_id', reuniao.id),
  );
  if (acoes.length !== 2) throw new Error('O plano repetido duplicou ações.');
  console.log('Plano: erro recuperado, revisão preservada, repetição sem duplicação.');
  await page.getByRole('link', { name: /Preparar proposta/ }).click();
  await expect(page.getByText('Dados da reunião incluídos')).toBeVisible();
  await page.getByRole('combobox', { name: /Projeto-base/ }).selectOption('sem-base');
  await page.getByRole('button', { name: 'Criar rascunho' }).click();
  await expect(page).toHaveURL(/\/propostas\/[a-f0-9-]{36}$/);
  const propostaId = new URL(page.url()).pathname.split('/').at(-1);
  const proposta = exigir(
    await client.from('propostas').select('id,reuniao_id,documento').eq('id', propostaId).single(),
  );
  if (
    proposta.reuniao_id !== reuniao.id ||
    proposta.documento.desafio !==
      'A recepção confirmou demora no atendimento e quer validar a triagem assistida por IA.' ||
    !proposta.documento.observacoes.includes('Cliente enviará uma amostra')
  )
    throw new Error('Contexto da reunião não chegou à proposta.');
  await page.getByRole('button', { name: 'Marcar como pronta', exact: true }).click();
  await page.getByRole('button', { name: 'Marcar como enviada', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar venda e abrir entrega', exact: true }).click();
  await expect(page).toHaveURL(/\/entregas\/[a-f0-9-]{36}$/);
  await expect(page.getByRole('heading', { name: 'Prepare o projeto' })).toBeVisible();
  const entregaId = new URL(page.url()).pathname.split('/').at(-1);
  const execucoes = exigir(
    await client.from('projetos_execucao').select('id').eq('proposta_id', propostaId),
  );
  if (execucoes.length !== 1 || execucoes[0].id !== entregaId)
    throw new Error('Entrega duplicada ou desconectada.');
  const recuperada = exigir(await client.rpc('projeto_iniciar', { p_proposta_id: propostaId }));
  if (recuperada !== entregaId) throw new Error('Repetição não reaproveitou a entrega.');
  console.log('Proposta: contexto preservado; aceite abriu uma única entrega.');
  for (const [nome, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${app}/propostas/${propostaId}`);
    const proximo = page.getByRole('region', { name: 'Próximo passo da proposta aceita' });
    await expect(proximo.getByRole('link', { name: /Abrir entrega/ })).toBeInViewport();
    if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)))
      throw new Error(`Overflow: ${nome}`);
    await page.screenshot({ path: join(pasta, `${nome}-aceita.png`) });
    await proximo.getByRole('link', { name: /Abrir entrega/ }).click();
    await expect(page.getByRole('link', { name: 'Agendar kickoff' })).toHaveAttribute(
      'href',
      `/reunioes?nova=1&oportunidade=${oportunidade.id}&tipo=kickoff`,
    );
    await page.screenshot({ path: join(pasta, `${nome}-entrega.png`) });
    await page.goto(`${app}/reunioes/${reuniao.id}`);
    await expect(page.locator('#proximo-passo-pos-call')).toHaveAttribute(
      'href',
      `/entregas/${entregaId}`,
    );
  }
  if (erros.length) throw new Error(`Erros no navegador: ${erros.join('; ')}`);
  console.log(
    JSON.stringify({
      resultado: 'aprovado',
      desktop: true,
      mobile: true,
      errosJs: 0,
      propostas: 1,
      entregas: 1,
      convitesExternos: 0,
      reuniao: 'fixture controlada; sem chamada ou IA real',
      capturas: pasta,
    }),
  );
} catch (erro) {
  if (page) {
    await page.screenshot({ path: join(pasta, 'falha.png') }).catch(() => {});
    console.error(`QA interrompido em ${new URL(page.url()).pathname}; capturas: ${pasta}`);
  }
  throw erro;
} finally {
  await browser?.close();
  if (usuario) {
    exigir(await admin.from('prospeccao_movimentos').delete().eq('dono', usuario));
    exigir(await admin.auth.admin.deleteUser(usuario));
    console.log('Conta e dados descartáveis removidos.');
  }
}
