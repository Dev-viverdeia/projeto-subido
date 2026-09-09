'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import type { EstadoProjetoExecucao } from './actions';

const GestaoSchema = z.object({
  projeto: z.uuid(),
  acao: z.enum([
    'pontual',
    'recorrente',
    'concluir',
    'reabrir',
    'encerrar_recorrencia',
    'retomar_recorrencia',
  ]),
  atualizadoEm: z.iso.datetime({ offset: true }),
  confirmarPendencias: z.boolean(),
});

const AcompanhamentoSchema = z.object({
  projeto: z.uuid(),
  acao: z.uuid(),
  titulo: z.string().trim().min(3).max(500),
  prazo: z.iso.date(),
});

function revalidar(projeto: string) {
  revalidatePath(`/entregas/${projeto}`);
  revalidatePath('/entregas');
  revalidatePath('/vendas');
  revalidatePath('/portal/[codigo]', 'page');
  revalidarDirecaoOperacional();
}

export type EstadoGestaoEntrega = EstadoProjetoExecucao & { recuperacao?: 'atualizar' | 'entrar' };

function mensagemErro(erro: { code?: string; message?: string } | null): EstadoGestaoEntrega {
  if (erro?.code === '40001')
    return {
      erro: 'O projeto mudou em outra ação. Confira a versão atual antes de salvar.',
      recuperacao: 'atualizar',
    };
  if (erro?.message === 'pendencias_na_entrega')
    return { erro: 'Ainda há pendências. Revise e confirme antes de concluir.' };
  if (erro?.message === 'recorrencia_indisponivel')
    return {
      erro: 'O acompanhamento não está ativo. Atualize os dados para conferir.',
      recuperacao: 'atualizar',
    };
  if (erro?.code === 'P0002') return { erro: 'Este projeto não está disponível na sua conta.' };
  return { erro: 'Não conseguimos salvar agora. Tente novamente.' };
}

export async function gerenciarEntrega(
  _estado: EstadoProjetoExecucao,
  form: FormData,
): Promise<EstadoGestaoEntrega> {
  const dados = GestaoSchema.safeParse({
    projeto: form.get('projeto'),
    acao: form.get('acao'),
    atualizadoEm: form.get('atualizadoEm'),
    confirmarPendencias: form.get('confirmarPendencias') === 'sim',
  });
  if (!dados.success)
    return { erro: 'Revise a ação ou atualize os dados para continuar.', recuperacao: 'atualizar' };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return {
        erro: 'Sua sessão expirou. Entre em outra aba e depois retome esta confirmação.',
        recuperacao: 'entrar',
      };
    const { data, error } = await supabase.rpc('projeto_gerenciar_entrega', {
      p_projeto_id: dados.data.projeto,
      p_acao: dados.data.acao,
      p_atualizado_em: dados.data.atualizadoEm,
      p_confirmar_pendencias: dados.data.confirmarPendencias,
    });
    if (error || !data) return mensagemErro(error);
    revalidar(dados.data.projeto);
    return {
      sucesso: {
        pontual: 'Projeto definido como pontual.',
        recorrente: 'Projeto definido como recorrente.',
        concluir: 'Entrega concluída.',
        reabrir: 'Execução reaberta.',
        encerrar_recorrencia: 'Acompanhamento encerrado.',
        retomar_recorrencia: 'Acompanhamento retomado.',
      }[dados.data.acao],
    };
  } catch {
    return {
      erro: 'A conexão falhou. Confira os dados atuais antes de tentar novamente.',
      recuperacao: 'atualizar',
    };
  }
}

export async function agendarAcompanhamento(
  _estado: EstadoProjetoExecucao,
  form: FormData,
): Promise<EstadoProjetoExecucao> {
  const dados = AcompanhamentoSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: 'Preencha a próxima ação e uma data válida.' };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };
    const { data, error } = await supabase.rpc('projeto_agendar_acompanhamento', {
      p_projeto_id: dados.data.projeto,
      p_acao_id: dados.data.acao,
      p_titulo: dados.data.titulo,
      p_prazo: dados.data.prazo,
    });
    if (error || !data) return mensagemErro(error);
    revalidar(dados.data.projeto);
    return { sucesso: 'Próxima ação agendada.' };
  } catch {
    return { erro: 'A conexão falhou. Tente novamente; a ação não será duplicada.' };
  }
}
