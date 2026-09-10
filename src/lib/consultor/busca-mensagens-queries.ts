import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { termoHistorico } from './historico-contrato';
import {
  TAMANHO_PAGINA_MENSAGENS,
  trechoDaMensagem,
  type PaginaBuscaMensagens,
} from './busca-mensagens-contrato';

export async function buscarMensagensConversa(
  conversa: string,
  donoEsperado: string,
  busca: string,
  pagina = 0,
): Promise<PaginaBuscaMensagens | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const dono = data?.claims.sub;
  if (!dono || dono !== donoEsperado) return null;
  const inicio = pagina * TAMANHO_PAGINA_MENSAGENS;
  // RLS + dono da sessão + thread. Usa o índice da thread antes da busca textual.
  // Nunca pesquisa em outra conta, nem em anexos, direções ou metadados internos.
  const {
    data: rows,
    count,
    error,
  } = await supabase
    .from('consultor_mensagens')
    .select('id,papel,conteudo,criado_em,consultor_threads!inner(dono)', { count: 'exact' })
    .eq('thread_id', conversa)
    .eq('consultor_threads.dono', dono)
    .ilike('conteudo', termoHistorico(busca))
    .order('criado_em', { ascending: false })
    .order('id', { ascending: true })
    .range(inicio, inicio + TAMANHO_PAGINA_MENSAGENS - 1);
  if (error) throw new Error('Falha ao buscar mensagens');
  return {
    mensagens: (rows ?? []).map((m) => ({
      id: m.id,
      papel: m.papel as 'usuario' | 'consultor',
      trecho: trechoDaMensagem(m.conteudo, busca),
      criadoEm: m.criado_em,
    })),
    total: count ?? 0,
    mais: inicio + TAMANHO_PAGINA_MENSAGENS < (count ?? 0),
  };
}
