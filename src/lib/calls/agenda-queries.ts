import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';
import { TAMANHO_PAGINA_AGENDA, type FiltrosAgenda } from './agenda-filtros';
import { montarReuniao, type ReuniaoCall } from './reuniao-modelo';

export type PaginaAgenda = {
  reunioes: ReuniaoCall[];
  proximoCursor?: { data: string; id: string };
};

export async function listarPaginaAgenda(
  filtros: FiltrosAgenda,
  agora: Date,
): Promise<PaginaAgenda> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('calls_listar_agenda', {
    p_visao: filtros.visao,
    p_busca: filtros.busca,
    p_agora: agora.toISOString(),
    p_cursor_data: filtros.cursor?.data,
    p_cursor_id: filtros.cursor?.id,
  });
  if (error) throw handleError(error, 'calls:agenda');
  const reunioes = (data ?? []).slice(0, TAMANHO_PAGINA_AGENDA).map((linha) =>
    montarReuniao(linha, {
      titulo: linha.oportunidade ?? 'Oportunidade não encontrada',
      empresa: linha.empresa ?? 'Empresa não encontrada',
      contato: linha.contato,
    }),
  );
  const ultima = reunioes.at(-1);
  return {
    reunioes,
    proximoCursor:
      (data?.length ?? 0) > TAMANHO_PAGINA_AGENDA && ultima
        ? { data: ultima.agendadaPara, id: ultima.id }
        : undefined,
  };
}

// Retornos de agendamento e edição não dependem da busca nem da página visível.
export async function listarRetornosAgenda(ids: string[]): Promise<ReuniaoCall[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('calls_reunioes')
    .select(
      `
    id, titulo, tipo, status, agendada_para, duracao_minutos, codigo_publico,
    live_coach_ativo, oportunidade_id, convidado_email, google_sync_status,
    google_event_url, google_sync_erro, criada_em, atualizada_em,
    empresa:crm_empresas!calls_reunioes_empresa_fk(nome),
    contato:crm_contatos!calls_reunioes_contato_fk(nome),
    oportunidade:crm_oportunidades!calls_reunioes_oportunidade_fk(titulo)
  `,
    )
    .in('id', [...new Set(ids)].slice(0, 2));
  if (error) throw handleError(error, 'calls:retornos-agenda');
  return (data ?? []).map((linha) =>
    montarReuniao(linha, {
      titulo: linha.oportunidade?.titulo ?? 'Oportunidade não encontrada',
      empresa: linha.empresa?.nome ?? 'Empresa não encontrada',
      contato: linha.contato?.nome ?? null,
    }),
  );
}
