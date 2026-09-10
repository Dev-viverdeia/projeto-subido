'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { NomeConversaSchema, type ResultadoNome } from './historico-contrato';

export async function renomearConversa(entrada: unknown): Promise<ResultadoNome> {
  const validacao = NomeConversaSchema.safeParse(entrada);
  if (!validacao.success) return { erro: 'Use um nome de 1 a 120 caracteres.' };
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const { id, dono, anterior, titulo } = validacao.data;
    if (data?.claims.sub !== dono) return { erro: 'Entre novamente na mesma conta para salvar.' };
    // RLS + dono explícito. A comparação evita sobrescrever uma edição de outra aba.
    const { data: atualizada, error } = await supabase
      .from('consultor_threads')
      .update({ titulo })
      .eq('id', id)
      .eq('dono', dono)
      .eq('titulo', anterior)
      .select('titulo')
      .maybeSingle();
    if (error) return { erro: 'Não foi possível salvar o nome. Tente novamente.' };
    if (!atualizada)
      return { erro: 'A conversa mudou ou não está disponível. Reabra o histórico.' };
    revalidatePath('/consultor');
    revalidatePath(`/consultor/${id}`);
    return { titulo: atualizada.titulo };
  } catch {
    return { erro: 'Não foi possível confirmar o nome. Reabra o histórico para conferir.' };
  }
}
