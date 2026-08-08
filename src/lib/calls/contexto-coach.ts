import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types.generated';

export type ContextoCoach = {
  reuniaoId: string;
  dono: string;
  titulo: string;
  tipo: string;
  liveCoachAtivo: boolean;
  iniciadaEm: string | null;
  empresa: {
    nome: string;
    setor: string | null;
    porte: string | null;
    resumo: string | null;
  };
  oportunidade: {
    titulo: string;
    etapa: string;
    proximaAcao: string | null;
  };
  contato: {
    nome: string;
    cargo: string | null;
  } | null;
};

/**
 * Toda leitura passa pelo cliente do usuário. Se o id pertencer a outro dono,
 * a RLS devolve zero linhas e o restante do fluxo nunca recebe service role.
 */
export async function obterContextoCoach(
  supabase: SupabaseClient<Database>,
  reuniaoId: string,
): Promise<ContextoCoach | null> {
  const { data: reuniao, error } = await supabase
    .from('calls_reunioes')
    .select(
      'id, dono, titulo, tipo, live_coach_ativo, iniciada_em, empresa_id, oportunidade_id, contato_id',
    )
    .eq('id', reuniaoId)
    .maybeSingle();
  if (error) throw error;
  if (!reuniao) return null;

  const [empresa, oportunidade, contato] = await Promise.all([
    supabase
      .from('crm_empresas')
      .select('nome, setor, porte, resumo')
      .eq('id', reuniao.empresa_id)
      .maybeSingle(),
    supabase
      .from('crm_oportunidades')
      .select('titulo, etapa, proxima_acao')
      .eq('id', reuniao.oportunidade_id)
      .maybeSingle(),
    reuniao.contato_id
      ? supabase
          .from('crm_contatos')
          .select('nome, cargo')
          .eq('id', reuniao.contato_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (empresa.error) throw empresa.error;
  if (oportunidade.error) throw oportunidade.error;
  if (contato.error) throw contato.error;
  if (!empresa.data || !oportunidade.data) return null;

  return {
    reuniaoId: reuniao.id,
    dono: reuniao.dono,
    titulo: reuniao.titulo,
    tipo: reuniao.tipo,
    liveCoachAtivo: reuniao.live_coach_ativo,
    iniciadaEm: reuniao.iniciada_em,
    empresa: empresa.data,
    oportunidade: {
      titulo: oportunidade.data.titulo,
      etapa: oportunidade.data.etapa,
      proximaAcao: oportunidade.data.proxima_acao,
    },
    contato: contato.data,
  };
}

export function contextoCoachParaTexto(contexto: ContextoCoach): string {
  const linhas = [
    `Reunião: ${contexto.titulo}`,
    `Tipo: ${contexto.tipo}`,
    `Empresa: ${contexto.empresa.nome}`,
    contexto.empresa.setor ? `Setor: ${contexto.empresa.setor}` : null,
    contexto.empresa.porte ? `Porte: ${contexto.empresa.porte}` : null,
    contexto.empresa.resumo ? `Contexto registrado: ${contexto.empresa.resumo}` : null,
    `Oportunidade: ${contexto.oportunidade.titulo}`,
    `Etapa do CRM: ${contexto.oportunidade.etapa}`,
    contexto.oportunidade.proximaAcao
      ? `Próxima ação já registrada: ${contexto.oportunidade.proximaAcao}`
      : null,
    contexto.contato
      ? `Contato: ${contexto.contato.nome}${contexto.contato.cargo ? `, ${contexto.contato.cargo}` : ''}`
      : null,
  ];

  return linhas.filter(Boolean).join('\n');
}

/** Contexto mínimo para melhorar nomes próprios sem enviar o dossiê do CRM. */
export function contextoTranscricaoParaTexto(contexto: ContextoCoach): string {
  return [
    `Reunião: ${contexto.titulo}`,
    `Empresa: ${contexto.empresa.nome}`,
    contexto.contato
      ? `Contato: ${contexto.contato.nome}${contexto.contato.cargo ? `, ${contexto.contato.cargo}` : ''}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}
