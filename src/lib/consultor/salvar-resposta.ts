'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { SalvarRespostaSchema, type ResultadoSalvarResposta } from './salvas-contrato';

export async function salvarResposta(entrada: unknown): Promise<ResultadoSalvarResposta> {
  const validacao = SalvarRespostaSchema.safeParse(entrada);
  if (!validacao.success) return { erro: 'Esta resposta não está disponível.' };
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const dono = data?.claims.sub;
    if (!dono || dono !== validacao.data.dono)
      return { erro: 'Entre novamente na mesma conta para salvar.' };
    const { mensagem, salvar } = validacao.data;
    const { data: origem, error: erroOrigem } = await supabase
      .from('consultor_mensagens')
      .select('id,thread_id,consultor_threads!inner(dono)')
      .eq('id', mensagem)
      .eq('papel', 'consultor')
      .eq('consultor_threads.dono', dono)
      .maybeSingle();
    if (erroOrigem || !origem) return { erro: 'Esta resposta não está disponível.' };

    // Estado desejado, não toggle: repetir um pedido não desfaz o que já foi salvo.
    const { error } = salvar
      ? await supabase
          .from('consultor_respostas_salvas')
          .upsert(
            { dono, mensagem_id: mensagem },
            { onConflict: 'dono,mensagem_id', ignoreDuplicates: true },
          )
      : await supabase
          .from('consultor_respostas_salvas')
          .delete()
          .eq('dono', dono)
          .eq('mensagem_id', mensagem);
    if (error) return { erro: 'Não foi possível atualizar. Tente novamente.' };
    revalidatePath('/consultor', 'layout');
    return { salva: salvar };
  } catch {
    return { erro: 'Não foi possível confirmar. Tente novamente para conferir.' };
  }
}
