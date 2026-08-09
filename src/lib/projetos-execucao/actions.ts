'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const IniciarSchema = z.object({ proposta: z.uuid() });
const TarefaSchema = z.object({
  projeto: z.uuid(),
  tarefa: z.uuid(),
  status: z.enum(['pendente', 'em_andamento', 'concluida', 'bloqueada']),
  evidencia: z.string().trim().max(10_000),
});

const PrazoSchema = z.object({
  projeto: z.uuid(),
  prazo: z.preprocess(
    (valor) => (typeof valor === 'string' && valor.length ? valor : null),
    z.iso.date().nullable(),
  ),
});

export type EstadoProjetoExecucao = { erro?: string; sucesso?: string };

async function usuarioAtual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function iniciarProjetoExecucao(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = IniciarSchema.safeParse({ proposta: formData.get('proposta') });
  if (!validacao.success) return { erro: 'Não foi possível identificar esta proposta.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data, error } = await supabase.rpc('projeto_iniciar', {
    p_proposta_id: validacao.data.proposta,
  });

  if (error || !data) {
    console.error(
      `[projetos-execucao:iniciar] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return {
      erro:
        error?.message === 'proposta_precisa_estar_aceita'
          ? 'A proposta precisa estar aceita antes de iniciar a entrega.'
          : 'Não foi possível abrir a Sala de Entrega agora.',
    };
  }

  revalidatePath('/propostas');
  revalidatePath(`/propostas/${validacao.data.proposta}`);
  revalidatePath('/solucoes');
  redirect(`/solucoes/execucao/${data}`);
}

export async function atualizarTarefaProjeto(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = TarefaSchema.safeParse({
    projeto: formData.get('projeto'),
    tarefa: formData.get('tarefa'),
    status: formData.get('status'),
    evidencia: formData.get('evidencia') ?? '',
  });
  if (!validacao.success) return { erro: 'Revise a atualização desta tarefa.' };
  if (
    (validacao.data.status === 'concluida' || validacao.data.status === 'bloqueada') &&
    !validacao.data.evidencia
  ) {
    return {
      erro:
        validacao.data.status === 'concluida'
          ? 'Registre uma evidência antes de concluir.'
          : 'Descreva o bloqueio para saber como retomar.',
    };
  }

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data, error } = await supabase
    .from('projeto_tarefas')
    .update({
      status: validacao.data.status,
      evidencia: validacao.data.evidencia || null,
    })
    .eq('id', validacao.data.tarefa)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    console.error(
      `[projetos-execucao:tarefa] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível atualizar esta tarefa agora.' };
  }

  revalidatePath(`/solucoes/execucao/${validacao.data.projeto}`);
  revalidatePath('/solucoes');
  return { sucesso: 'Tarefa atualizada.' };
}

export async function definirPrazoProjeto(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = PrazoSchema.safeParse({
    projeto: formData.get('projeto'),
    prazo: formData.get('prazo'),
  });
  if (!validacao.success) return { erro: 'Informe uma data válida.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data, error } = await supabase
    .from('projetos_execucao')
    .update({
      prazo_em: validacao.data.prazo ? `${validacao.data.prazo}T12:00:00.000Z` : null,
    })
    .eq('id', validacao.data.projeto)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    console.error(
      `[projetos-execucao:prazo] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível salvar o prazo.' };
  }

  revalidatePath(`/solucoes/execucao/${validacao.data.projeto}`);
  revalidatePath('/solucoes');
  return { sucesso: 'Prazo atualizado.' };
}
