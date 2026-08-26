#!/usr/bin/env node

/* eslint-disable max-lines -- O fluxo reúne todas as fronteiras da Jornada de Ouro em um único comando auditável. */

/**
 * Smoke test opt-in da Jornada de Ouro em um ambiente publicado.
 *
 * O teste cria uma conta descartável, percorre Prospecção -> Vendas ->
 * Enriquecimento -> Reunião -> Proposta -> Projeto e apaga a conta no final.
 * Ele usa provedores reais e, por isso, nunca roda automaticamente no CI.
 */

import { randomBytes } from 'node:crypto';
import process from 'node:process';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const CONFIRMACAO = '--confirmar-producao';
const executar = process.argv.includes(CONFIRMACAO);
const manterConta = process.argv.includes('--manter-conta');

if (!executar) {
  console.log(`Uso: npm run smoke:jornada-ouro -- ${CONFIRMACAO}`);
  console.log(
    'Este teste usa provedores reais, consome créditos e apaga a conta criada ao terminar.',
  );
  process.exit(0);
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
const cronSecret = necessario('CRON_SECRET');
const appUrl = (process.env.SUBIDO_APP_URL || 'https://subido.viverdeia.ai').replace(/\/$/, '');
const quantidade = 5;
const segmento = process.env.SUBIDO_SMOKE_SEGMENTO || 'clínicas odontológicas';
const localizacao = process.env.SUBIDO_SMOKE_LOCALIZACAO || 'Belo Horizonte, MG';
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const teste = {
  usuario: null,
  lista: null,
  job: null,
  lead: null,
  oportunidade: null,
  enriquecimento: null,
  reuniao: null,
  proposta: null,
  projeto: null,
};

function etapa(nome, dados = {}) {
  console.log(JSON.stringify({ etapa: nome, ...dados }));
}

function erroSe(error, contexto) {
  if (error) throw new Error(`${contexto}: ${error.code || 'erro'} ${error.message}`);
}

async function esperar({ ler, pronto, limiteMs, intervaloMs = 2_500, contexto }) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    const valor = await ler();
    if (pronto(valor)) return valor;
    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
  throw new Error(`${contexto}: tempo limite excedido`);
}

async function criarConta() {
  const sufixo = `${Date.now()}-${randomBytes(3).toString('hex')}`;
  const email = `qa-jornada-ouro-${sufixo}@example.invalid`;
  const password = `Subido!${randomBytes(18).toString('base64url')}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { plano_subido: 'pro', qa_jornada_ouro: true },
    user_metadata: {
      nome: 'Teste Jornada de Ouro',
      introducao_subido_concluida_em: new Date().toISOString(),
    },
  });
  erroSe(error, 'criar conta');
  if (!data.user) throw new Error('criar conta: usuário não retornado');
  teste.usuario = data.user.id;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const login = await client.auth.signInWithPassword({ email, password });
  erroSe(login.error, 'autenticar conta');
  return { client, email, password };
}

async function criarLista() {
  const saldo = await admin.rpc('prospeccao_sistema_obter_saldo', { p_dono: teste.usuario });
  erroSe(saldo.error, 'obter saldo');
  if ((saldo.data ?? 0) < quantidade) throw new Error('saldo inicial insuficiente');

  const lista = await admin.rpc('prospeccao_sistema_criar_lista', {
    p_dono: teste.usuario,
    p_nome: `${segmento} · ${localizacao}`,
    p_segmento: segmento,
    p_localizacao: localizacao,
    p_termos: [],
    p_quantidade: quantidade,
    p_filtros: { arquitetura: 'smoke-jornada-ouro-v1' },
  });
  erroSe(lista.error, 'criar lista');
  teste.lista = lista.data;

  const job = await admin
    .from('operacoes_jobs')
    .insert({
      dono: teste.usuario,
      tipo: 'prospeccao',
      chave_idempotencia: `smoke:prospeccao:${teste.lista}`,
      referencia_tipo: 'prospeccao_lista',
      referencia_id: teste.lista,
      payload: {
        dono: teste.usuario,
        lista: teste.lista,
        busca: { segmento, localizacao, quantidade },
      },
      prioridade: 10,
      max_tentativas: 3,
    })
    .select('id')
    .single();
  erroSe(job.error, 'enfileirar prospecção');
  teste.job = job.data.id;

  const rodada = await fetch(`${appUrl}/api/operacoes/processar`, {
    headers: { authorization: `Bearer ${cronSecret}` },
    cache: 'no-store',
  });
  if (!rodada.ok) throw new Error(`processar prospecção: HTTP ${rodada.status}`);

  const concluida = await esperar({
    contexto: 'aguardar prospecção',
    limiteMs: 180_000,
    intervaloMs: 5_000,
    ler: async () => {
      const resultado = await admin
        .from('prospeccao_listas')
        .select('status,quantidade_encontrada')
        .eq('id', teste.lista)
        .eq('dono', teste.usuario)
        .single();
      erroSe(resultado.error, 'ler prospecção');
      return resultado.data;
    },
    pronto: (valor) => valor.status === 'concluida' || valor.status === 'falhou',
  });
  if (concluida.status !== 'concluida' || concluida.quantidade_encontrada < 1) {
    throw new Error('prospecção não retornou empresas');
  }

  const leads = await admin
    .from('prospeccao_leads')
    .select('id,telefones,emails,site_url,decisores')
    .eq('dono', teste.usuario)
    .eq('lista_id', teste.lista);
  erroSe(leads.error, 'ler leads');
  const melhor = (leads.data || [])
    .map((lead) => ({
      ...lead,
      pontos:
        (Array.isArray(lead.telefones) && lead.telefones.length ? 2 : 0) +
        (Array.isArray(lead.emails) && lead.emails.length ? 2 : 0) +
        (lead.site_url ? 1 : 0) +
        (Array.isArray(lead.decisores) && lead.decisores.length ? 2 : 0),
    }))
    .sort((a, b) => b.pontos - a.pontos)[0];
  if (!melhor) throw new Error('nenhum lead qualificável');
  teste.lead = melhor.id;
  etapa('prospeccao_concluida', { empresas: concluida.quantidade_encontrada });
}

async function enviarAoCrm() {
  const oportunidade = await admin.rpc('prospeccao_sistema_enviar_lead_crm', {
    p_dono: teste.usuario,
    p_lead: teste.lead,
  });
  erroSe(oportunidade.error, 'enviar lead ao CRM');
  teste.oportunidade = oportunidade.data;
  if (!teste.oportunidade) throw new Error('oportunidade não retornada');
  etapa('vendas_criada');
}

async function enriquecer(client) {
  const resposta = await client.functions.invoke('enriquecimento', {
    body: { oportunidade_id: teste.oportunidade },
  });
  erroSe(resposta.error, 'iniciar enriquecimento');
  teste.enriquecimento = resposta.data?.id;
  if (!teste.enriquecimento) throw new Error('enriquecimento não retornado');

  const resultado = await esperar({
    contexto: 'aguardar enriquecimento',
    limiteMs: 120_000,
    intervaloMs: 3_000,
    ler: async () => {
      const execucao = await admin
        .from('crm_enriquecimentos')
        .select('status,modelo,resultado,erro')
        .eq('id', teste.enriquecimento)
        .eq('dono', teste.usuario)
        .single();
      erroSe(execucao.error, 'ler enriquecimento');
      return execucao.data;
    },
    pronto: (valor) => valor.status === 'concluido' || valor.status === 'falhou',
  });
  if (resultado.status !== 'concluido' || !resultado.resultado) {
    throw new Error(`enriquecimento falhou: ${resultado.erro || 'sem resultado'}`);
  }
  etapa('enriquecimento_concluido', { modelo: resultado.modelo || 'não informado' });
}

async function concluirReuniao(client) {
  const agenda = await client.rpc('calls_agendar_reuniao', {
    p_oportunidade: teste.oportunidade,
    p_tipo: 'descoberta',
    p_agendada_para: new Date(Date.now() + 86_400_000).toISOString(),
    p_duracao_minutos: 45,
    p_titulo: 'Descoberta · teste da Jornada de Ouro',
    p_live_coach_ativo: true,
  });
  erroSe(agenda.error, 'agendar reunião');
  const reuniao = Array.isArray(agenda.data) ? agenda.data[0] : agenda.data;
  teste.reuniao = reuniao?.reuniao_id;
  if (!teste.reuniao) throw new Error('reunião não retornada');

  const concluida = await admin
    .from('calls_reunioes')
    .update({
      status: 'concluida',
      iniciada_em: new Date(Date.now() - 3_600_000).toISOString(),
      encerrada_em: new Date(Date.now() - 900_000).toISOString(),
    })
    .eq('id', teste.reuniao)
    .eq('dono', teste.usuario);
  erroSe(concluida.error, 'concluir reunião');

  const analise = await admin.from('calls_analises').insert({
    dono: teste.usuario,
    reuniao_id: teste.reuniao,
    status: 'concluida',
    resumo: 'A empresa quer reduzir o tempo de resposta e organizar o primeiro atendimento com IA.',
    dores: ['Respostas manuais demoram', 'Leads chegam por canais diferentes'],
    objecoes: ['Precisa validar segurança e rotina da equipe'],
    compromissos: ['Mapear o fluxo atual', 'Apresentar implantação por etapas'],
    proximos_passos: ['Enviar proposta do projeto de atendimento com IA'],
    oportunidades_projeto: [{ titulo: 'SDR de atendimento com IA', aderencia: 'alta' }],
    sentimento: 'positivo',
    nota_comercial: 84,
    dados: { qa_jornada_ouro: true, convite_externo_enviado: false },
  });
  erroSe(analise.error, 'registrar análise da reunião');
  etapa('reuniao_concluida', { conviteExternoEnviado: false });
}

async function aceitarPropostaEIniciarProjeto(client) {
  const oportunidade = await admin
    .from('crm_oportunidades')
    .select('empresa_id,contato_principal_id')
    .eq('id', teste.oportunidade)
    .eq('dono', teste.usuario)
    .single();
  erroSe(oportunidade.error, 'ler oportunidade');
  const empresa = await admin
    .from('crm_empresas')
    .select('nome')
    .eq('id', oportunidade.data.empresa_id)
    .single();
  erroSe(empresa.error, 'ler empresa');
  const solucao = await admin
    .from('solucoes')
    .select('id,titulo,resumo')
    .eq('status', 'publicado')
    .order('ordem', { ascending: true })
    .limit(1)
    .single();
  erroSe(solucao.error, 'ler projeto do catálogo');

  const documento = {
    cliente: { empresa: empresa.data.nome, contato: null, cargo: null, email: null },
    projeto: {
      titulo: solucao.data.titulo,
      resumo: solucao.data.resumo,
      origem: 'catalogo',
    },
    desafio:
      'Reduzir o tempo de resposta sem perder contexto, qualidade ou visibilidade comercial.',
    objetivo:
      'Implantar um atendimento com IA que qualifique contatos e encaminhe a próxima ação correta.',
    escopo: [
      {
        titulo: 'Mapeamento e implantação',
        descricao:
          'Mapear o atendimento, configurar a solução e validar os principais cenários com a equipe.',
      },
    ],
    entregaveis: ['Fluxo configurado', 'Base inicial', 'Roteiro de validação'],
    cronograma: [
      {
        fase: 'Preparação e construção',
        duracao: '2 semanas',
        descricao: 'Mapeamento, configuração e primeiros testes controlados.',
      },
    ],
    investimento: { valorCentavos: 750000, condicoes: '50% no início e 50% na entrega.' },
    validadeDias: 10,
    proximosPassos: ['Confirmar escopo', 'Agendar kick-off após o aceite'],
    observacoes: 'Proposta do teste interno da Jornada de Ouro.',
  };
  const proposta = await client
    .from('propostas')
    .insert({
      dono: teste.usuario,
      empresa_id: oportunidade.data.empresa_id,
      oportunidade_id: teste.oportunidade,
      projeto_id: solucao.data.id,
      reuniao_id: teste.reuniao,
      titulo: `${solucao.data.titulo} · ${empresa.data.nome}`,
      documento,
    })
    .select('id')
    .single();
  erroSe(proposta.error, 'criar proposta');
  teste.proposta = proposta.data.id;

  for (const status of ['pronta', 'apresentada', 'aceita']) {
    const atualizacao = await client
      .from('propostas')
      .update({ status })
      .eq('id', teste.proposta)
      .eq('dono', teste.usuario);
    erroSe(atualizacao.error, `marcar proposta como ${status}`);
  }

  const projeto = await client.rpc('projeto_iniciar', { p_proposta_id: teste.proposta });
  erroSe(projeto.error, 'iniciar projeto');
  teste.projeto = projeto.data;
  const tarefas = await admin
    .from('projeto_tarefas')
    .select('id', { count: 'exact', head: true })
    .eq('dono', teste.usuario)
    .eq('projeto_execucao_id', teste.projeto);
  erroSe(tarefas.error, 'contar tarefas');
  if (!tarefas.count) throw new Error('projeto criado sem roteiro de execução');
  etapa('projeto_iniciado', { tarefas: tarefas.count });
}

async function verificarRotas(email, password) {
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
  erroSe(login.error, 'autenticar SSR');
  const cookie = cookies.map(({ name, value }) => `${name}=${value}`).join('; ');
  const rotas = [
    '/inicio',
    '/prospeccao',
    '/vendas',
    `/vendas/${teste.oportunidade}`,
    '/reunioes',
    '/propostas',
    '/solucoes',
    '/metricas',
  ];
  for (const rota of rotas) {
    const resposta = await fetch(`${appUrl}${rota}`, {
      headers: { cookie },
      redirect: 'manual',
      cache: 'no-store',
    });
    const corpo = await resposta.text();
    if (
      resposta.status !== 200 ||
      /Application error|Internal Server Error|A plataforma perdeu o fio/i.test(corpo)
    ) {
      throw new Error(`rota inválida: ${rota} (HTTP ${resposta.status})`);
    }
  }
  etapa('rotas_validadas', { total: rotas.length });
}

let credenciais;
try {
  credenciais = await criarConta();
  etapa('conta_criada');
  await criarLista();
  await enviarAoCrm();
  await enriquecer(credenciais.client);
  await concluirReuniao(credenciais.client);
  await aceitarPropostaEIniciarProjeto(credenciais.client);
  await verificarRotas(credenciais.email, credenciais.password);
  etapa('jornada_ouro_aprovada', {
    contaDescartavel: true,
    conviteExternoEnviado: false,
  });
} catch (error) {
  console.error(
    JSON.stringify({ etapa: 'jornada_ouro_reprovada', erro: String(error.message || error) }),
  );
  process.exitCode = 1;
} finally {
  if (teste.usuario && !manterConta) {
    const remocao = await admin.auth.admin.deleteUser(teste.usuario);
    if (remocao.error) {
      console.error(JSON.stringify({ etapa: 'limpeza_falhou', erro: remocao.error.message }));
      process.exitCode = 1;
    } else {
      etapa('conta_descartavel_removida');
    }
  } else if (teste.usuario) {
    etapa('conta_mantida_para_inspecao', { usuario: teste.usuario });
  }
}
