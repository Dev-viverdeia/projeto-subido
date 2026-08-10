import 'server-only';

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/lib/supabase/types.generated';
import type { Database } from '@/lib/supabase/types.generated';
import type { ContextoRecomendacao, FatoDaRecomendacao } from './recomendacao';

function textoCurto(valor: unknown, limite = 260): string | null {
  if (typeof valor !== 'string') return null;
  const limpo = valor.replace(/\s+/g, ' ').trim();
  if (!limpo) return null;
  return limpo.length <= limite ? limpo : `${limpo.slice(0, limite - 1).trim()}…`;
}

function textosDoJson(valor: Json, limite = 4): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => {
      if (typeof item === 'string') return textoCurto(item);
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      return (
        textoCurto(item.acao) ??
        textoCurto(item.titulo) ??
        textoCurto(item.descricao) ??
        textoCurto(item.texto)
      );
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, limite);
}

function dataCurta(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(data);
}

export type ContextoProximoPasso = {
  contexto: ContextoRecomendacao;
  contextoHash: string;
};

export async function obterContextoProximoPasso(
  supabase: SupabaseClient<Database>,
  oportunidadeId: string,
): Promise<ContextoProximoPasso | null> {
  const momento = new Date().toISOString();
  const { data: oportunidade, error: erroOportunidade } = await supabase
    .from('crm_oportunidades')
    .select('id, empresa_id, titulo, etapa, proxima_acao, proxima_acao_em, atualizado_em')
    .eq('id', oportunidadeId)
    .maybeSingle();

  if (erroOportunidade) throw erroOportunidade;
  if (!oportunidade) return null;

  const [empresa, calls, propostas, acoes, eventos] = await Promise.all([
    supabase
      .from('crm_empresas')
      .select('nome, setor, porte, resumo')
      .eq('id', oportunidade.empresa_id)
      .maybeSingle(),
    supabase
      .from('calls_reunioes')
      .select('id, titulo, tipo, status, agendada_para, encerrada_em')
      .eq('oportunidade_id', oportunidade.id)
      .order('agendada_para', { ascending: false })
      .limit(6),
    supabase
      .from('propostas')
      .select('titulo, status, apresentada_em, aceita_em, atualizado_em')
      .eq('oportunidade_id', oportunidade.id)
      .order('atualizado_em', { ascending: false })
      .limit(4),
    supabase
      .from('projeto_acoes')
      .select('titulo, status, prazo_em, origem, atualizado_em')
      .eq('oportunidade_id', oportunidade.id)
      .order('atualizado_em', { ascending: false })
      .limit(6),
    supabase
      .from('crm_eventos')
      .select('tipo, titulo, descricao, fonte, ocorrido_em')
      .eq('oportunidade_id', oportunidade.id)
      .order('ocorrido_em', { ascending: false })
      .limit(6),
  ]);

  if (empresa.error) throw empresa.error;
  if (calls.error) throw calls.error;
  if (propostas.error) throw propostas.error;
  if (acoes.error) throw acoes.error;
  if (eventos.error) throw eventos.error;

  const reunioes = calls.data ?? [];
  const idsReunioes = reunioes.map((call) => call.id);
  const analises = idsReunioes.length
    ? await supabase
        .from('calls_analises')
        .select(
          'reuniao_id, status, resumo, objecoes, compromissos, proximos_passos, dados, atualizada_em',
        )
        .in('reuniao_id', idsReunioes)
        .eq('status', 'concluida')
        .order('atualizada_em', { ascending: false })
        .limit(6)
    : { data: [], error: null };

  if (analises.error) throw analises.error;

  const fatos: FatoDaRecomendacao[] = [];
  function adicionar(fonte: FatoDaRecomendacao['fonte'], texto: string | null) {
    if (!texto || fatos.length >= 20 || fatos.some((fato) => fato.texto === texto)) return;
    fatos.push({ id: fatos.length + 1, fonte, texto });
  }

  const nomeEmpresa = empresa.data?.nome ?? 'Empresa sem nome disponível';
  adicionar(
    'CRM',
    `A oportunidade “${oportunidade.titulo}” está em ${oportunidade.etapa} e ficou sem próxima ação após a conclusão.`,
  );
  if (empresa.data?.setor || empresa.data?.porte) {
    adicionar(
      'CRM',
      `${nomeEmpresa}: ${[empresa.data.setor, empresa.data.porte].filter(Boolean).join(' · ')}.`,
    );
  }
  adicionar('CRM', textoCurto(empresa.data?.resumo));

  const analisesPorReuniao = new Map(
    (analises.data ?? []).map((analise) => [analise.reuniao_id, analise]),
  );
  let proximoPassoDaCall: string | null = null;

  for (const call of reunioes) {
    const analise = analisesPorReuniao.get(call.id);
    if (!analise) continue;
    adicionar(
      'Call',
      textoCurto(analise.resumo)
        ? `${call.titulo} · ${textoCurto(analise.resumo)}`
        : `${call.titulo} concluída em ${dataCurta(call.encerrada_em ?? call.agendada_para)}.`,
    );
    const decisoes = textosDoJson(
      analise.dados && typeof analise.dados === 'object' && !Array.isArray(analise.dados)
        ? (analise.dados.decisoes ?? [])
        : [],
      2,
    );
    decisoes.forEach((decisao) => adicionar('Call', `Decisão: ${decisao}`));
    textosDoJson(analise.objecoes, 2).forEach((objecao) =>
      adicionar('Call', `Objeção: ${objecao}`),
    );
    textosDoJson(analise.compromissos, 2).forEach((compromisso) =>
      adicionar('Call', `Compromisso: ${compromisso}`),
    );
    const proximos = textosDoJson(analise.proximos_passos, 2);
    proximos.forEach((proximo) => adicionar('Call', `Próximo passo detectado: ${proximo}`));
    proximoPassoDaCall ??= proximos[0] ?? null;
  }

  const agoraMs = new Date(momento).getTime();
  const callFutura = [...reunioes]
    .filter(
      (call) =>
        ['agendada', 'aguardando', 'ao_vivo'].includes(call.status) &&
        new Date(call.agendada_para).getTime() >= agoraMs,
    )
    .sort((a, b) => a.agendada_para.localeCompare(b.agendada_para))[0];
  if (callFutura) {
    adicionar('Call', `${callFutura.titulo} marcada para ${dataCurta(callFutura.agendada_para)}.`);
  }

  const propostaMaisRecente = propostas.data?.[0] ?? null;
  for (const proposta of propostas.data ?? []) {
    adicionar('Proposta', `“${proposta.titulo}” está com status ${proposta.status}.`);
  }

  for (const acao of acoes.data ?? []) {
    adicionar(
      'Projeto',
      `${acao.status === 'concluida' ? 'Concluída' : 'Pendente'}: ${acao.titulo}${acao.prazo_em ? ` · ${dataCurta(acao.prazo_em)}` : ''}.`,
    );
  }

  for (const evento of eventos.data ?? []) {
    const descricao = textoCurto(evento.descricao, 180);
    adicionar(
      evento.fonte === 'calls' ? 'Call' : 'CRM',
      `${evento.titulo}${descricao ? ` · ${descricao}` : ''}`,
    );
  }

  const contexto: ContextoRecomendacao = {
    momento,
    oportunidadeId: oportunidade.id,
    empresa: nomeEmpresa,
    titulo: oportunidade.titulo,
    etapa: oportunidade.etapa,
    fatos: fatos.slice(0, 20),
    proximoPassoDaCall,
    propostaMaisRecente: propostaMaisRecente?.status ?? null,
    callFutura: callFutura?.agendada_para ?? null,
  };

  return {
    contexto,
    contextoHash: createHash('sha256').update(JSON.stringify(contexto)).digest('hex'),
  };
}

export function contextoProximoPassoParaModelo(contexto: ContextoRecomendacao): string {
  return JSON.stringify(
    {
      momento: contexto.momento,
      empresa: contexto.empresa,
      oportunidade: contexto.titulo,
      etapa: contexto.etapa,
      fatos_numerados: contexto.fatos.map((fato) => ({
        id: fato.id,
        fonte: fato.fonte,
        texto: fato.texto,
      })),
    },
    null,
    2,
  );
}
