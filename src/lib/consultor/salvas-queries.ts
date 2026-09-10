import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { termoHistorico } from './historico-contrato';
import { trechoDaMensagem } from './busca-mensagens-contrato';
import { TAMANHO_SALVAS, type PaginaSalvas } from './salvas-contrato';

export async function buscarRespostasSalvas(
  donoEsperado: string,
  busca = '',
  pagina = 0,
): Promise<PaginaSalvas | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const dono = data?.claims.sub;
  if (!dono || dono !== donoEsperado) return null;
  let query = supabase
    .from('consultor_respostas_salvas')
    .select(
      'mensagem_id,criado_em,consultor_mensagens!inner(thread_id,papel,conteudo,consultor_threads!inner(titulo,dono))',
      { count: 'exact' },
    )
    .eq('dono', dono)
    .eq('consultor_mensagens.papel', 'consultor')
    .eq('consultor_mensagens.consultor_threads.dono', dono)
    .order('criado_em', { ascending: false })
    .order('mensagem_id', { ascending: true });
  if (busca) query = query.ilike('consultor_mensagens.conteudo', termoHistorico(busca));
  const inicio = pagina * TAMANHO_SALVAS;
  const { data: rows, error, count } = await query.range(inicio, inicio + TAMANHO_SALVAS - 1);
  if (error) throw new Error('Falha ao consultar respostas salvas');
  return {
    respostas: (rows ?? []).map((r) => ({
      id: r.mensagem_id,
      conversa: r.consultor_mensagens.thread_id,
      titulo: r.consultor_mensagens.consultor_threads.titulo,
      trecho: trechoDaMensagem(r.consultor_mensagens.conteudo, busca),
      salvaEm: r.criado_em,
    })),
    total: count ?? 0,
    mais: inicio + TAMANHO_SALVAS < (count ?? 0),
  };
}
