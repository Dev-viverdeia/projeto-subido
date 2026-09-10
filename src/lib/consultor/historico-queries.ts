import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { TAMANHO_HISTORICO, termoHistorico, type PaginaConversas } from './historico-contrato';

export const obterHistorico = cache(
  async (busca = '', pagina = 0, donoEsperado?: string): Promise<PaginaConversas | null> => {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const dono = data?.claims.sub;
    if (!dono || (donoEsperado && donoEsperado !== dono)) return null;
    let query = supabase
      .from('consultor_threads')
      .select('id,titulo,criado_em,atualizado_em', { count: 'exact' })
      .eq('dono', dono)
      .order('atualizado_em', { ascending: false })
      .order('id', { ascending: true });
    if (busca) query = query.ilike('titulo', termoHistorico(busca));
    const inicio = pagina * TAMANHO_HISTORICO;
    const { data: rows, error, count } = await query.range(inicio, inicio + TAMANHO_HISTORICO - 1);
    if (error) throw new Error('Falha ao consultar histórico');
    return {
      threads: (rows ?? []).map((t) => ({
        id: t.id,
        titulo: t.titulo,
        criadoEm: t.criado_em,
        atualizadoEm: t.atualizado_em,
      })),
      total: count ?? 0,
      mais: inicio + TAMANHO_HISTORICO < (count ?? 0),
    };
  },
);
