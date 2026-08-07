import 'server-only';

import { cache } from 'react';
import { listarPipeline } from '@/lib/crm/queries';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
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
