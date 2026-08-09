'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { EstadoProjetoExecucao } from './actions';

const AcaoPlanoSchema = z.object({
  projeto: z.uuid(),
  acao: z.uuid(),
  status: z.enum(['pendente', 'concluida']),
});

export async function atualizarAcaoPlano(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = AcaoPlanoSchema.safeParse({
    projeto: formData.get('projeto'),
    acao: formData.get('acao'),
    status: formData.get('status'),
  });
  if (!validacao.success) return { erro: 'Não foi possível identificar esta ação.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data, error } = await supabase
    .from('projeto_acoes')
    .update({ status: validacao.data.status })
    .eq('id', validacao.data.acao)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .eq('dono', user.id)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    console.error(
      `[projetos-execucao:plano] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível atualizar o plano agora.' };
  }

  revalidatePath(`/solucoes/execucao/${validacao.data.projeto}`);
  revalidatePath('/solucoes');
  return {
    sucesso:
      validacao.data.status === 'concluida' ? 'Compromisso concluído.' : 'Compromisso reaberto.',
  };
}
