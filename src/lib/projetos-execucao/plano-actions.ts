'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { createClient } from '@/lib/supabase/server';
import { lerBriefingKickoff } from './briefing';
import type { EstadoProjetoExecucao } from './actions';

const AcaoPlanoSchema = z.object({
  projeto: z.uuid(),
  acao: z.uuid(),
  status: z.enum(['pendente', 'concluida', 'cancelada']),
});

const DependenciaSchema = z.object({
  projeto: z.uuid(),
  acao: z.preprocess(
    (valor) => (typeof valor === 'string' && valor ? valor : null),
    z.uuid().nullable(),
  ),
  titulo: z.string().trim().min(3).max(500),
  categoria: z.enum(['acesso', 'dependencia']),
  responsavelTipo: z.enum(['cliente', 'prestador']),
  prazo: z.union([z.literal(''), z.iso.date()]),
});

function revalidarProjeto(id: string, portalCodigo?: string) {
  revalidatePath(`/entregas/${id}`);
  revalidatePath('/entregas');
  if (portalCodigo) revalidatePath(`/portal/${portalCodigo}`);
  revalidarDirecaoOperacional();
}

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

  revalidarProjeto(validacao.data.projeto);
  return {
    sucesso: {
      concluida: 'Item concluído.',
      pendente: 'Item reaberto.',
      cancelada: 'Item removido da lista.',
    }[validacao.data.status],
  };
}

export async function salvarDependenciaProjeto(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = DependenciaSchema.safeParse({
    projeto: formData.get('projeto'),
    acao: formData.get('acao'),
    titulo: formData.get('titulo'),
    categoria: formData.get('categoria'),
    responsavelTipo: formData.get('responsavelTipo'),
    prazo: formData.get('prazo') ?? '',
  });
  if (!validacao.success) return { erro: 'Revise o item, o responsável e o prazo.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data: projeto, error: erroProjeto } = await supabase
    .from('projetos_execucao')
    .select('id, empresa_id, oportunidade_id, portal_codigo, briefing_kickoff')
    .eq('id', validacao.data.projeto)
    .eq('dono', user.id)
    .maybeSingle();
  if (erroProjeto || !projeto) return { erro: 'Este projeto não está disponível.' };

  const briefing = lerBriefingKickoff(projeto.briefing_kickoff);
  const cliente = validacao.data.responsavelTipo === 'cliente';
  const responsavelNome = cliente
    ? (briefing?.responsavelCliente ?? 'Cliente')
    : (briefing?.responsavelTecnico ?? 'Implementação');
  const prazoEm = validacao.data.prazo
    ? new Date(`${validacao.data.prazo}T12:00:00-03:00`).toISOString()
    : null;
  const dados = {
    titulo: validacao.data.titulo,
    categoria: validacao.data.categoria,
    responsavel_tipo: validacao.data.responsavelTipo,
    responsavel_nome: responsavelNome,
    visivel_cliente: cliente,
    prazo_em: prazoEm,
  };

  const consulta = validacao.data.acao
    ? supabase
        .from('projeto_acoes')
        .update(dados)
        .eq('id', validacao.data.acao)
        .eq('projeto_execucao_id', projeto.id)
        .eq('dono', user.id)
        .in('categoria', ['acesso', 'dependencia'])
        .select('id')
        .maybeSingle()
    : supabase
        .from('projeto_acoes')
        .insert({
          dono: user.id,
          empresa_id: projeto.empresa_id,
          oportunidade_id: projeto.oportunidade_id,
          projeto_execucao_id: projeto.id,
          origem: 'manual',
          chave_origem: `manual:${randomUUID()}`,
          status: 'pendente',
          ...dados,
        })
        .select('id')
        .maybeSingle();
  const { data, error } = await consulta;
  if (error || !data) {
    console.error(
      `[projetos-execucao:dependencia] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível salvar esta pendência agora.' };
  }

  revalidarProjeto(projeto.id, projeto.portal_codigo);
  return { sucesso: validacao.data.acao ? 'Pendência atualizada.' : 'Pendência adicionada.' };
}
