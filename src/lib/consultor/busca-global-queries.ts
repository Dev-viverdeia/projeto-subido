import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { termoHistorico } from './historico-contrato';
import { TAMANHO_PAGINA_MENSAGENS, trechoDaMensagem } from './busca-mensagens-contrato';
import type { PaginaBuscaGlobal } from './busca-global-contrato';

export async function buscarMensagensHistorico(
  donoEsperado: string,
  busca: string,
  pagina = 0,
): Promise<PaginaBuscaGlobal | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const dono = data?.claims.sub;
  if (!dono || dono !== donoEsperado) return null;
  const inicio = pagina * TAMANHO_PAGINA_MENSAGENS;
  // Owner da sessão + RLS. Os índices de dono/thread delimitam o histórico privado.
  // Uma linha extra indica a próxima página, sem contar todo o histórico a cada tecla.
  const { data: rows, error } = await supabase
    .from('consultor_mensagens')
    .select('id,thread_id,papel,conteudo,criado_em,consultor_threads!inner(dono,titulo)')
    .eq('consultor_threads.dono', dono)
    .ilike('conteudo', termoHistorico(busca))
    .order('criado_em', { ascending: false })
    .order('id', { ascending: true })
    .range(inicio, inicio + TAMANHO_PAGINA_MENSAGENS);
  if (error) throw new Error('Falha ao buscar no histórico');
  return {
    mensagens: (rows ?? []).slice(0, TAMANHO_PAGINA_MENSAGENS).map((m) => ({
      id: m.id,
      conversa: m.thread_id,
      titulo: m.consultor_threads.titulo,
      papel: m.papel as 'usuario' | 'consultor',
      trecho: trechoDaMensagem(m.conteudo, busca),
      criadoEm: m.criado_em,
    })),
    mais: (rows?.length ?? 0) > TAMANHO_PAGINA_MENSAGENS,
  };
}
