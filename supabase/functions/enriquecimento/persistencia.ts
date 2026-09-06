import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.110.9';

type Etapa = 'ler_contexto' | 'ler_site' | 'gerar_dossie' | 'concluido' | 'falhou';

/** A credencial só autoriza esta RPC; leituras continuam com o JWT e a RLS. */
export async function avancar(
  supabase: SupabaseClient,
  id: string,
  chave: string,
  etapa: Etapa,
  resultado?: { resultado: unknown; fontes: unknown; modelo: string },
  erro?: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('crm_worker_avancar', {
    p_id: id,
    p_chave: chave,
    p_etapa: etapa,
    p_resultado: resultado?.resultado ?? null,
    p_fontes: resultado?.fontes ?? [],
    p_modelo: resultado?.modelo ?? null,
    p_erro: erro ?? null,
  });
  // Não incluir a requisição nem o objeto do SDK: podem conter a prova do worker.
  if (error) throw new Error(`persistencia_enriquecimento:${error.code ?? 'indisponivel'}`);
  return data === true;
}
