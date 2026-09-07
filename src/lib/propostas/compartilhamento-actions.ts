'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { exigirRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';

const CompartilhamentoSchema = z.object({
  id: z.uuid(),
  codigoAtual: z.uuid(),
  operacao: z.enum(['desativar', 'renovar']),
});

export type EstadoCompartilhamento = {
  erro?: string;
  sucesso?: string;
  codigo?: string;
  ativo?: boolean;
};

export async function configurarLinkProposta(
  _estado: EstadoCompartilhamento,
  dados: FormData,
): Promise<EstadoCompartilhamento> {
  await exigirRecurso('propostas');
  const validacao = CompartilhamentoSchema.safeParse(Object.fromEntries(dados));
  if (!validacao.success) return { erro: 'Atualize a página e tente novamente.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente.' };

  const { id, codigoAtual, operacao } = validacao.data;
  const ativo = operacao === 'renovar';
  const codigo = ativo ? randomUUID() : codigoAtual;
  // A sessão/RLS e o dono limitam a escrita. O código anterior evita que uma
  // aba antiga desative um link recém-criado. Nenhum estado comercial é alterado.
  const { data, error } = await supabase
    .from('propostas')
    .update({ compartilhamento_ativo: ativo, compartilhamento_codigo: codigo })
    .eq('id', id)
    .eq('dono', user.id)
    .eq('compartilhamento_codigo', codigoAtual)
    .in('status', ['apresentada', 'aceita', 'recusada'])
    .select('id')
    .maybeSingle();

  if (error || !data) {
    return { erro: 'O link não foi alterado. Atualize a página e tente novamente.' };
  }

  revalidatePath(`/propostas/${id}`);
  revalidatePath(`/proposta/${codigoAtual}`);
  if (ativo) revalidatePath(`/proposta/${codigo}`);
  return {
    codigo,
    ativo,
    sucesso: ativo
      ? 'Novo link criado. Envie o novo endereço ao cliente.'
      : 'Link desativado. O status da proposta foi mantido.',
  };
}
