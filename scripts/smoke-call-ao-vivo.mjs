#!/usr/bin/env node

/**
 * Smoke opt-in da call ao vivo em um ambiente publicado.
 *
 * Cria uma conta e uma oportunidade descartáveis, abre a mesma sala em dois
 * navegadores, publica áudio e vídeo reais do Chromium, espera transcrição e
 * Live Coach, encerra a call e comprova o dossiê pós-call no banco e na tela.
 * Nenhum convite externo é enviado.
 */

import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import process from 'node:process';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const CONFIRMACAO = '--confirmar-producao';
const executar = process.argv.includes(CONFIRMACAO);
const manterConta = process.argv.includes('--manter-conta');
const audioArgumento = process.argv.find((argumento) => argumento.startsWith('--audio='));
const audio = audioArgumento?.slice('--audio='.length) || process.env.SUBIDO_SMOKE_CALL_AUDIO;

if (!executar) {
  console.log(`Uso: npm run smoke:call-ao-vivo -- ${CONFIRMACAO} --audio=/caminho/fala.wav`);
  console.log('O teste abre uma sala real, usa LiveKit/OpenAI e apaga a conta criada ao terminar.');
  process.exit(0);
}

if (!audio || !existsSync(audio)) {
  throw new Error('Informe um arquivo WAV com fala em --audio para validar a transcrição real.');
}

const necessario = (nome) => {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`Variável obrigatória ausente: ${nome}`);
  return valor;
};

const supabaseUrl = necessario('NEXT_PUBLIC_SUPABASE_URL');
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  necessario('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || necessario('SUPABASE_SECRET_KEY');
const appUrl = (process.env.SUBIDO_APP_URL || 'https://subido.viverdeia.ai').replace(/\/$/, '');
const bypassVercel = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const teste = {
  usuario: null,
  empresa: null,
  oportunidade: null,
  reuniao: null,
  codigo: null,
};
const iniciadoEm = Date.now();
let ultimaEtapaEm = iniciadoEm;
let browser = null;
let host = null;
let convidado = null;

function etapa(nome, dados = {}) {
  const agora = Date.now();
  console.log(
    JSON.stringify({
      etapa: nome,
      ...dados,
      duracaoEtapaMs: agora - ultimaEtapaEm,
      duracaoTotalMs: agora - iniciadoEm,
    }),
  );
  ultimaEtapaEm = agora;
}

function erroSe(error, contexto) {
  if (error) throw new Error(`${contexto}: ${error.code || 'erro'} ${error.message}`);
}

async function esperar({ ler, pronto, limiteMs, intervaloMs = 2_000, contexto }) {
  const inicio = Date.now();
  let ultimo;
  while (Date.now() - inicio < limiteMs) {
    ultimo = await ler();
    if (pronto(ultimo)) return ultimo;
    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
  throw new Error(`${contexto}: tempo limite excedido · último estado ${JSON.stringify(ultimo)}`);
}

async function criarCenario() {
  const sufixo = `${Date.now()}-${randomBytes(3).toString('hex')}`;
  const email = `qa-call-ao-vivo-${sufixo}@example.invalid`;
  const password = `Subido!${randomBytes(18).toString('base64url')}`;
  const criacao = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { plano_subido: 'pro', qa_call_ao_vivo: true },
    user_metadata: {
      nome: 'Anfitrião QA',
      introducao_subido_concluida_em: new Date().toISOString(),
    },
  });
  erroSe(criacao.error, 'criar conta');
  if (!criacao.data.user) throw new Error('criar conta: usuário não retornado');
  teste.usuario = criacao.data.user.id;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const login = await client.auth.signInWithPassword({ email, password });
  erroSe(login.error, 'autenticar conta');

  const empresa = await client
    .from('crm_empresas')
    .insert({
      dono: teste.usuario,
      nome: 'Clínica Horizonte QA',
      setor: 'Saúde',
      porte: 'Pequena empresa',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      resumo: 'Clínica que recebe leads por WhatsApp e quer reduzir o tempo de resposta.',
    })
    .select('id')
    .single();
  erroSe(empresa.error, 'criar empresa');
  teste.empresa = empresa.data.id;

  const oportunidade = await client
    .from('crm_oportunidades')
    .insert({
      dono: teste.usuario,
      empresa_id: teste.empresa,
      titulo: 'SDR de atendimento com IA · Clínica Horizonte QA',
      etapa: 'novo_lead',
      origem: 'qa_call_ao_vivo',
      proxima_acao: 'Realizar call de descoberta',
    })
    .select('id')
    .single();
  erroSe(oportunidade.error, 'criar oportunidade');
  teste.oportunidade = oportunidade.data.id;

  const agenda = await client.rpc('calls_agendar_reuniao', {
    p_oportunidade: teste.oportunidade,
    p_tipo: 'descoberta',
    p_agendada_para: new Date(Date.now() + 15_000).toISOString(),
    p_duracao_minutos: 30,
    p_titulo: 'Descoberta · Clínica Horizonte QA',
    p_live_coach_ativo: true,
  });
  erroSe(agenda.error, 'agendar reunião');
  const reuniao = Array.isArray(agenda.data) ? agenda.data[0] : agenda.data;
  teste.reuniao = reuniao?.reuniao_id;
  teste.codigo = reuniao?.codigo_publico;
  if (!teste.reuniao || !teste.codigo) throw new Error('agendar reunião: sala não retornada');

  etapa('cenario_criado');
  return { email, password };
}

async function cookiesDaSessao(email, password) {
  const cookies = [];
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookies,
      setAll: (novos) => {
        for (const novo of novos) {
          const indice = cookies.findIndex((item) => item.name === novo.name);
          if (indice >= 0) cookies[indice] = novo;
          else cookies.push(novo);
        }
      },
    },
  });
  const login = await supabase.auth.signInWithPassword({ email, password });
  erroSe(login.error, 'autenticar navegador');
  return cookies.map(({ name, value }) => ({ name, value, url: appUrl }));
}

function observarPagina(page, papel, eventos) {
  page.on('pageerror', (erro) => eventos.push(`${papel}:pageerror:${erro.message}`));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/calls/')) return;
    eventos.push(`${papel}:${response.request().method()}:${url.pathname}:${response.status()}`);
  });
}

async function entrarNaSala(page, nome) {
  const url = new URL(`/sala/${teste.codigo}`, appUrl);
  if (bypassVercel) {
    url.searchParams.set('x-vercel-protection-bypass', bypassVercel);
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true');
  }
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Seu nome').fill(nome);
  await page.getByRole('checkbox').check();
  const entrar = page.getByRole('button', { name: 'Entrar na reunião' });
  await page.waitForTimeout(250);
  if (await entrar.isDisabled()) {
    await page.screenshot({
      path: `/private/tmp/subido-call-bloqueada-${nome}.png`,
      fullPage: true,
    });
    const aviso = await page
      .locator('[class*="aviso"]')
      .allTextContents()
      .catch(() => []);
    const diagnostico = {
      nome: await page.getByLabel('Seu nome').inputValue(),
      consentiu: await page.getByRole('checkbox').isChecked(),
      estado: await page.locator('body').innerText(),
    };
    throw new Error(
      `A sala não liberou a entrada para ${nome}. ${aviso.join(' ').trim() || 'Nenhum motivo foi exibido.'} ${JSON.stringify(diagnostico)}`,
    );
  }
  await entrar.click();
  await page.locator('.lk-video-conference').waitFor({ state: 'visible', timeout: 45_000 });
}

async function exercitarSala({ email, password }) {
  const eventos = [];
  browser = await chromium.launch({
    headless: true,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${audio}`,
    ],
  });
  host = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['camera', 'microphone'],
  });
  convidado = await browser.newContext({
    viewport: { width: 1180, height: 780 },
    permissions: ['camera', 'microphone'],
  });
  await host.addCookies(await cookiesDaSessao(email, password));

  const paginaHost = await host.newPage();
  const paginaConvidado = await convidado.newPage();
  observarPagina(paginaHost, 'host', eventos);
  observarPagina(paginaConvidado, 'convidado', eventos);

  await entrarNaSala(paginaHost, 'Anfitrião QA');
  await entrarNaSala(paginaConvidado, 'Cliente QA');
  await paginaHost.locator('.lk-participant-tile').nth(1).waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  etapa('dois_participantes_conectados', { participantesVisiveis: 2 });

  try {
    await paginaHost.waitForFunction(
      () => !globalThis.document.body.innerText.includes('Aguardando a primeira fala'),
      undefined,
      { timeout: 70_000 },
    );
  } catch {
    await paginaHost.screenshot({
      path: '/private/tmp/subido-call-smoke-sem-transcricao.png',
      fullPage: true,
    });
    throw new Error(
      `A transcrição não apareceu. APIs: ${JSON.stringify(eventos)}. Tela: ${(await paginaHost.locator('body').innerText()).slice(0, 2_000)}`,
    );
  }
  await paginaHost.screenshot({ path: '/private/tmp/subido-call-smoke-host.png', fullPage: true });
  etapa('transcricao_ao_vivo_visivel');

  await esperar({
    contexto: 'aguardar Live Coach',
    limiteMs: 90_000,
    intervaloMs: 3_000,
    ler: async () => {
      const resultado = await admin
        .from('calls_coach_sugestoes')
        .select('id,status,categoria,titulo')
        .eq('dono', teste.usuario)
        .eq('reuniao_id', teste.reuniao);
      erroSe(resultado.error, 'ler Live Coach');
      return resultado.data || [];
    },
    pronto: (valor) => valor.length > 0,
  });
  etapa('live_coach_respondeu');

  const sairConvidado = paginaConvidado.locator('.lk-disconnect-button');
  await sairConvidado.click();
  await paginaConvidado.getByRole('heading', { name: 'Obrigado por participar' }).waitFor({
    timeout: 20_000,
  });

  const sairHost = paginaHost.locator('.lk-disconnect-button');
  await sairHost.click();
  await paginaHost.waitForURL(new RegExp(`/reunioes/${teste.reuniao}$`), { timeout: 30_000 });
  etapa('sala_encerrada', { eventos });

  return paginaHost;
}

async function validarPosCall(paginaHost) {
  const resultado = await esperar({
    contexto: 'aguardar dossiê pós-call',
    limiteMs: 180_000,
    intervaloMs: 4_000,
    ler: async () => {
      const [reuniao, transcricao, coach, analise, gravacao, participantes] = await Promise.all([
        admin
          .from('calls_reunioes')
          .select('status,iniciada_em,encerrada_em')
          .eq('id', teste.reuniao)
          .single(),
        admin
          .from('calls_transcricoes')
          .select('status,texto_completo,segmentos')
          .eq('reuniao_id', teste.reuniao)
          .maybeSingle(),
        admin.from('calls_coach_sugestoes').select('id,status').eq('reuniao_id', teste.reuniao),
        admin
          .from('calls_analises')
          .select('status,resumo,proximos_passos')
          .eq('reuniao_id', teste.reuniao)
          .maybeSingle(),
        admin
          .from('calls_gravacoes')
          .select('status,duracao_segundos,tamanho_bytes,erro')
          .eq('reuniao_id', teste.reuniao)
          .maybeSingle(),
        admin.from('calls_participantes').select('id,papel').eq('reuniao_id', teste.reuniao),
      ]);
      for (const [nome, consulta] of [
        ['reunião', reuniao],
        ['transcrição', transcricao],
        ['coach', coach],
        ['análise', analise],
        ['gravação', gravacao],
        ['participantes', participantes],
      ]) {
        erroSe(consulta.error, `ler ${nome}`);
      }
      return {
        reuniao: reuniao.data,
        transcricao: transcricao.data,
        coach: coach.data || [],
        analise: analise.data,
        gravacao: gravacao.data,
        participantes: participantes.data || [],
      };
    },
    pronto: (valor) =>
      valor.reuniao.status === 'concluida' &&
      valor.analise?.status === 'concluida' &&
      valor.gravacao?.status === 'concluida',
  });

  const texto = resultado.transcricao?.texto_completo?.trim() || '';
  if (texto.length < 80) throw new Error('A transcrição final ficou curta demais.');
  if (resultado.coach.length === 0) throw new Error('O Live Coach não registrou nenhuma leitura.');
  if (resultado.participantes.length < 2)
    throw new Error('A sala não registrou os dois participantes.');
  if (!resultado.analise?.resumo) throw new Error('O pós-call não gerou resumo.');
  if (!resultado.gravacao?.tamanho_bytes) throw new Error('A gravação terminou sem arquivo.');

  await paginaHost.reload({ waitUntil: 'domcontentloaded' });
  await paginaHost.getByText('Resumo da conversa').waitFor({ timeout: 30_000 });
  await paginaHost.getByText('Transcrição').waitFor({ timeout: 30_000 });
  await paginaHost.screenshot({
    path: '/private/tmp/subido-call-smoke-pos-call.png',
    fullPage: true,
  });

  etapa('pos_call_validado', {
    caracteresTranscritos: texto.length,
    segmentos: Array.isArray(resultado.transcricao?.segmentos)
      ? resultado.transcricao.segmentos.length
      : 0,
    leiturasCoach: resultado.coach.length,
    participantes: resultado.participantes.length,
    gravacaoSegundos: resultado.gravacao.duracao_segundos,
    gravacaoBytes: resultado.gravacao.tamanho_bytes,
  });
}

async function limpar() {
  await convidado?.close().catch(() => null);
  await host?.close().catch(() => null);
  await browser?.close().catch(() => null);
  if (teste.usuario && !manterConta) {
    const exclusao = await admin.auth.admin.deleteUser(teste.usuario);
    erroSe(exclusao.error, 'remover conta descartável');
    etapa('conta_descartavel_removida');
  }
}

let falha;
try {
  const sessao = await criarCenario();
  const paginaHost = await exercitarSala(sessao);
  await validarPosCall(paginaHost);
  etapa('call_ao_vivo_aprovada');
} catch (causa) {
  falha = causa;
  console.error(causa);
} finally {
  await limpar().catch((causa) => console.error('Falha na limpeza:', causa));
}

if (falha) process.exit(1);
