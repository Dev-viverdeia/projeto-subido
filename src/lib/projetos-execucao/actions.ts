'use server';

import { randomUUID } from 'node:crypto';
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

const PortalSchema = z.object({
  projeto: z.uuid(),
  operacao: z.enum(['ativar', 'desativar', 'renovar']),
});

const EntregaClienteSchema = z.object({
  projeto: z.uuid(),
  tarefa: z.uuid(),
  operacao: z.enum(['salvar', 'solicitar']),
  nota: z.string().trim().max(4000),
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((valor) => !valor || /^https?:\/\/[^\s]+$/i.test(valor), 'Link inválido.'),
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

export async function configurarPortalCliente(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = PortalSchema.safeParse({
    projeto: formData.get('projeto'),
    operacao: formData.get('operacao'),
  });
  if (!validacao.success) return { erro: 'Não foi possível configurar o portal.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const agora = new Date().toISOString();
  const alteracao =
    validacao.data.operacao === 'desativar'
      ? { portal_ativo: false }
      : validacao.data.operacao === 'renovar'
        ? { portal_ativo: true, portal_codigo: randomUUID(), portal_ativado_em: agora }
        : { portal_ativo: true, portal_ativado_em: agora };

  const { data, error } = await supabase
    .from('projetos_execucao')
    .update(alteracao)
    .eq('id', validacao.data.projeto)
    .eq('dono', user.id)
    .select('portal_codigo')
    .maybeSingle();

  if (error || !data) {
    console.error(
      `[projetos-execucao:portal] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível configurar o portal agora.' };
  }

  revalidatePath(`/solucoes/execucao/${validacao.data.projeto}`);
  revalidatePath(`/portal/${data.portal_codigo}`);
  return {
    sucesso:
      validacao.data.operacao === 'desativar'
        ? 'Portal pausado.'
        : validacao.data.operacao === 'renovar'
          ? 'Novo link criado. O anterior deixou de funcionar.'
          : 'Portal do cliente ativado.',
  };
}

export async function prepararEntregaCliente(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = EntregaClienteSchema.safeParse({
    projeto: formData.get('projeto'),
    tarefa: formData.get('tarefa'),
    operacao: formData.get('operacao'),
    nota: formData.get('nota') ?? '',
    url: formData.get('url') ?? '',
  });
  if (!validacao.success) {
    const linkInvalido = validacao.error.issues.some((item) => item.path[0] === 'url');
    return {
      erro: linkInvalido ? 'Use um link completo começando com http.' : 'Revise a entrega.',
    };
  }

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data: projeto, error: erroProjeto } = await supabase
    .from('projetos_execucao')
    .select('portal_ativo, portal_codigo')
    .eq('id', validacao.data.projeto)
    .eq('dono', user.id)
    .maybeSingle();

  if (erroProjeto || !projeto) return { erro: 'Este projeto não está disponível.' };
  if (validacao.data.operacao === 'solicitar' && !projeto.portal_ativo) {
    return { erro: 'Ative o Portal do Cliente antes de solicitar a aprovação.' };
  }

  const atualizacao = {
    cliente_nota: validacao.data.nota || null,
    entregavel_url: validacao.data.url || null,
    ...(validacao.data.operacao === 'solicitar' ? { cliente_status: 'aguardando' as const } : {}),
  };

  let consulta = supabase
    .from('projeto_tarefas')
    .update(atualizacao)
    .eq('id', validacao.data.tarefa)
    .eq('projeto_execucao_id', validacao.data.projeto)
    .eq('dono', user.id);
  if (validacao.data.operacao === 'solicitar') consulta = consulta.eq('status', 'concluida');

  const { data, error } = await consulta.select('id').maybeSingle();
  if (error || !data) {
    console.error(
      `[projetos-execucao:entrega-cliente] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return {
      erro:
        validacao.data.operacao === 'solicitar'
          ? 'Conclua a tarefa antes de pedir a aprovação.'
          : 'Não foi possível salvar esta apresentação agora.',
    };
  }

  revalidatePath(`/solucoes/execucao/${validacao.data.projeto}`);
  revalidatePath(`/portal/${projeto.portal_codigo}`);
  return {
    sucesso:
      validacao.data.operacao === 'solicitar'
        ? 'Entrega enviada para aprovação.'
        : 'Apresentação do cliente salva.',
  };
}
