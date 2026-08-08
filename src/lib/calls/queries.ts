import 'server-only';

import { cache } from 'react';
import { listarPipeline } from '@/lib/crm/queries';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
import { SegmentoLiveSchema, type SegmentoLive } from './coach-schema';
import type { StatusCall, TipoCall } from './tipos';
import { lerSalaPeloCodigo } from './admin';

type LinhaReuniao = Tables<'calls_reunioes'>;

export type ReuniaoCall = {
  id: string;
  titulo: string;
  tipo: TipoCall;
  status: StatusCall;
  agendadaPara: string;
  duracaoMinutos: number;
  codigoPublico: string;
  liveCoachAtivo: boolean;
  oportunidadeId: string;
  oportunidade: string;
  empresa: string;
  contato: string | null;
  criadaEm: string;
};

export type ConviteCall = {
  reuniaoId: string;
  titulo: string;
  agendadaPara: string;
  duracaoMinutos: number;
  status: StatusCall;
  liveCoachAtivo: boolean;
  salaProvedor: string;
  disponivel: boolean;
};

export type SugestaoCoachHistorico = {
  id: string;
  categoria: string;
  titulo: string;
  sugestao: string;
  metodologia: string | null;
  trechoGatilho: string | null;
  prioridade: number;
  status: string;
  segundoReuniao: number | null;
};

export type PosCall = {
  reuniao: {
    id: string;
    titulo: string;
    tipo: TipoCall;
    status: StatusCall;
    agendadaPara: string;
    iniciadaEm: string | null;
    encerradaEm: string | null;
    duracaoMinutos: number;
    liveCoachAtivo: boolean;
  };
  empresa: { nome: string; setor: string | null; porte: string | null };
  contato: { nome: string; cargo: string | null } | null;
  oportunidade: {
    id: string;
    titulo: string;
    etapa: string;
    proximaAcao: string | null;
    proximaAcaoEm: string | null;
  };
  analise: {
    status: string;
    resumo: string | null;
    dores: string[];
    objecoes: string[];
    decisoes: string[];
    compromissos: string[];
    proximosPassos: string[];
    oportunidadesProjeto: string[];
    lacunas: string[];
    sinaisCompra: string[];
    sentimento: string | null;
    notaComercial: number | null;
    erro: string | null;
    atualizadaEm: string;
  } | null;
  transcricao: {
    status: string;
    textoCompleto: string | null;
    segmentos: SegmentoLive[];
    duracaoSegundos: number | null;
    atualizadaEm: string;
  } | null;
  coach: SugestaoCoachHistorico[];
};

function listaDeTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function campoDeDados(valor: unknown, campo: string): string[] {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return [];
  return listaDeTextos((valor as Record<string, unknown>)[campo]);
}

export const listarReunioes = cache(async (): Promise<ReuniaoCall[]> => {
  const supabase = await createClient();
  const [reunioes, pipeline] = await Promise.all([
    supabase
      .from('calls_reunioes')
      .select(
        'id, titulo, tipo, status, agendada_para, duracao_minutos, codigo_publico, live_coach_ativo, oportunidade_id, criada_em',
      )
      .order('agendada_para', { ascending: true })
      .limit(200),
    listarPipeline(),
  ]);

  if (reunioes.error) throw handleError(reunioes.error, 'calls:listar');

  const oportunidadePorId = new Map(pipeline.map((item) => [item.id, item]));

  return (reunioes.data ?? []).map((linha) => {
    const oportunidade = oportunidadePorId.get(linha.oportunidade_id);
    return montarReuniao(linha, oportunidade);
  });
});

/**
 * Dossiê privado de uma reunião. A primeira leitura acontece com a sessão do
 * profissional; um UUID de outra conta devolve o mesmo resultado de um UUID
 * inexistente. As demais relações continuam protegidas pelas próprias RLS.
 */
export const obterPosCall = cache(async (id: string): Promise<PosCall | null> => {
  const supabase = await createClient();
  const { data: reuniao, error } = await supabase
    .from('calls_reunioes')
    .select(
      'id, titulo, tipo, status, agendada_para, iniciada_em, encerrada_em, duracao_minutos, live_coach_ativo, empresa_id, contato_id, oportunidade_id',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw handleError(error, 'calls:pos-call:reuniao');
  if (!reuniao) return null;

  const [empresa, contato, oportunidade, analise, transcricao, coach] = await Promise.all([
    supabase
      .from('crm_empresas')
      .select('nome, setor, porte')
      .eq('id', reuniao.empresa_id)
      .maybeSingle(),
    reuniao.contato_id
      ? supabase
          .from('crm_contatos')
          .select('nome, cargo')
          .eq('id', reuniao.contato_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('crm_oportunidades')
      .select('id, titulo, etapa, proxima_acao, proxima_acao_em')
      .eq('id', reuniao.oportunidade_id)
      .maybeSingle(),
    supabase
      .from('calls_analises')
      .select(
        'status, resumo, dores, objecoes, compromissos, proximos_passos, oportunidades_projeto, sentimento, nota_comercial, dados, erro, atualizada_em',
      )
      .eq('reuniao_id', reuniao.id)
      .maybeSingle(),
    supabase
      .from('calls_transcricoes')
      .select('status, texto_completo, segmentos, duracao_segundos, atualizada_em')
      .eq('reuniao_id', reuniao.id)
      .maybeSingle(),
    supabase
      .from('calls_coach_sugestoes')
      .select(
        'id, categoria, titulo, sugestao, metodologia, trecho_gatilho, prioridade, status, segundo_reuniao',
      )
      .eq('reuniao_id', reuniao.id)
      .neq('status', 'dispensada')
      .order('criada_em', { ascending: true })
      .limit(30),
  ]);

  if (empresa.error) throw handleError(empresa.error, 'calls:pos-call:empresa');
  if (contato.error) throw handleError(contato.error, 'calls:pos-call:contato');
  if (oportunidade.error) throw handleError(oportunidade.error, 'calls:pos-call:oportunidade');
  if (analise.error) throw handleError(analise.error, 'calls:pos-call:analise');
  if (transcricao.error) throw handleError(transcricao.error, 'calls:pos-call:transcricao');
  if (coach.error) throw handleError(coach.error, 'calls:pos-call:coach');
  if (!empresa.data || !oportunidade.data) return null;

  const segmentos = SegmentoLiveSchema.array().safeParse(transcricao.data?.segmentos);

  return {
    reuniao: {
      id: reuniao.id,
      titulo: reuniao.titulo,
      tipo: reuniao.tipo,
      status: reuniao.status,
      agendadaPara: reuniao.agendada_para,
      iniciadaEm: reuniao.iniciada_em,
      encerradaEm: reuniao.encerrada_em,
      duracaoMinutos: reuniao.duracao_minutos,
      liveCoachAtivo: reuniao.live_coach_ativo,
    },
    empresa: empresa.data,
    contato: contato.data,
    oportunidade: {
      id: oportunidade.data.id,
      titulo: oportunidade.data.titulo,
      etapa: oportunidade.data.etapa,
      proximaAcao: oportunidade.data.proxima_acao,
      proximaAcaoEm: oportunidade.data.proxima_acao_em,
    },
    analise: analise.data
      ? {
          status: analise.data.status,
          resumo: analise.data.resumo,
          dores: listaDeTextos(analise.data.dores),
          objecoes: listaDeTextos(analise.data.objecoes),
          decisoes: campoDeDados(analise.data.dados, 'decisoes'),
          compromissos: listaDeTextos(analise.data.compromissos),
          proximosPassos: listaDeTextos(analise.data.proximos_passos),
          oportunidadesProjeto: listaDeTextos(analise.data.oportunidades_projeto),
          lacunas: campoDeDados(analise.data.dados, 'lacunas'),
          sinaisCompra: campoDeDados(analise.data.dados, 'sinais_compra'),
          sentimento: analise.data.sentimento,
          notaComercial: analise.data.nota_comercial,
          erro: analise.data.erro,
          atualizadaEm: analise.data.atualizada_em,
        }
      : null,
    transcricao: transcricao.data
      ? {
          status: transcricao.data.status,
          textoCompleto: transcricao.data.texto_completo,
          segmentos: segmentos.success ? segmentos.data : [],
          duracaoSegundos: transcricao.data.duracao_segundos,
          atualizadaEm: transcricao.data.atualizada_em,
        }
      : null,
    coach: (coach.data ?? []).map((item) => ({
      id: item.id,
      categoria: item.categoria,
      titulo: item.titulo,
      sugestao: item.sugestao,
      metodologia: item.metodologia,
      trechoGatilho: item.trecho_gatilho,
      prioridade: item.prioridade,
      status: item.status,
      segundoReuniao: item.segundo_reuniao,
    })),
  };
});

function montarReuniao(
  linha: Pick<
    LinhaReuniao,
    | 'id'
    | 'titulo'
    | 'tipo'
    | 'status'
    | 'agendada_para'
    | 'duracao_minutos'
    | 'codigo_publico'
    | 'live_coach_ativo'
    | 'oportunidade_id'
    | 'criada_em'
  >,
  oportunidade: { titulo: string; empresa: string; contato: string | null } | undefined,
): ReuniaoCall {
  return {
    id: linha.id,
    titulo: linha.titulo,
    tipo: linha.tipo,
    status: linha.status,
    agendadaPara: linha.agendada_para,
    duracaoMinutos: linha.duracao_minutos,
    codigoPublico: linha.codigo_publico,
    liveCoachAtivo: linha.live_coach_ativo,
    oportunidadeId: linha.oportunidade_id,
    oportunidade: oportunidade?.titulo ?? 'Oportunidade não encontrada',
    empresa: oportunidade?.empresa ?? 'Empresa não encontrada',
    contato: oportunidade?.contato ?? null,
    criadaEm: linha.criada_em,
  };
}

/**
 * Lê somente a superfície pública liberada pela RPC. Mesmo que este caminho seja
 * chamado sem sessão, nenhuma tabela do CRM recebe SELECT anônimo.
 */
export async function obterConvitePublico(codigo: string): Promise<ConviteCall | null> {
  const sala = await lerSalaPeloCodigo(codigo);
  return sala?.convite ?? null;
}

export async function obterContextoDaSala(codigo: string) {
  const supabase = await createClient();
  const sala = await lerSalaPeloCodigo(codigo);
  if (!sala) return null;

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) {
    return {
      convite: sala.convite,
      dono: sala.dono,
      anfitriao: false,
      nomeSugerido: '',
      usuarioId: null,
    };
  }

  const metadata = claims.claims.user_metadata;
  const nome = typeof metadata?.nome === 'string' ? metadata.nome : '';
  const email = typeof claims.claims.email === 'string' ? claims.claims.email : '';

  return {
    convite: sala.convite,
    dono: sala.dono,
    anfitriao: claims.claims.sub === sala.dono,
    nomeSugerido: nome || email.split('@')[0] || '',
    usuarioId: typeof claims.claims.sub === 'string' ? claims.claims.sub : null,
  };
}
