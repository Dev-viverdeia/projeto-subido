'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { createClient } from '@/lib/supabase/server';
import {
  BriefingKickoffSchema,
  briefingPodeSerConfirmado,
  lerBriefingKickoff,
  textoParaItensBriefing,
} from './briefing';
import { montarDependenciasDoBriefing } from './dependencias';
import type { EstadoProjetoExecucao } from './actions';

const BriefingFormularioSchema = BriefingKickoffSchema.omit({
  confirmadoEm: true,
  fonteCallId: true,
}).extend({
  projeto: z.uuid(),
  operacao: z.enum(['salvar', 'confirmar']),
  fonteCallId: z.preprocess(
    (valor) => (typeof valor === 'string' && valor.length > 0 ? valor : null),
    z.uuid().nullable(),
  ),
});

export type EstadoBriefingKickoff = EstadoProjetoExecucao & { confirmado?: boolean };

async function sincronizarDependencias({
  supabase,
  dono,
  projeto,
  briefing,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  dono: string;
  projeto: { id: string; empresa_id: string; oportunidade_id: string };
  briefing: z.infer<typeof BriefingKickoffSchema>;
}) {
  const desejadas = montarDependenciasDoBriefing(briefing);
  const { data: existentes, error } = await supabase
    .from('projeto_acoes')
    .select('id, chave_origem, status')
    .eq('projeto_execucao_id', projeto.id)
    .eq('dono', dono)
    .eq('origem', 'briefing');
  if (error) return error;

  const porChave = new Map((existentes ?? []).map((item) => [item.chave_origem, item]));
  const chavesDesejadas = new Set(desejadas.map((item) => item.chave));
  const operacoes = desejadas.map((item) => {
    const existente = porChave.get(item.chave);
    const dados = {
      titulo: item.titulo,
      categoria: item.categoria,
      responsavel_tipo: item.responsavelTipo,
      responsavel_nome: item.responsavelNome,
      visivel_cliente: item.visivelCliente,
      ...(existente?.status === 'cancelada' ? { status: 'pendente' as const } : {}),
    };
    if (existente) {
      return supabase.from('projeto_acoes').update(dados).eq('id', existente.id).eq('dono', dono);
    }
    return supabase.from('projeto_acoes').insert({
      dono,
      empresa_id: projeto.empresa_id,
      oportunidade_id: projeto.oportunidade_id,
      projeto_execucao_id: projeto.id,
      origem: 'briefing',
      chave_origem: item.chave,
      prazo_em: null,
      ...dados,
    });
  });

  for (const existente of existentes ?? []) {
    if (existente.status === 'pendente' && !chavesDesejadas.has(existente.chave_origem)) {
      operacoes.push(
        supabase
          .from('projeto_acoes')
          .update({ status: 'cancelada' })
          .eq('id', existente.id)
          .eq('dono', dono),
      );
    }
  }

  const resultados = await Promise.all(operacoes);
  return resultados.find((resultado) => resultado.error)?.error ?? null;
}

export async function salvarBriefingKickoff(
  _estado: EstadoBriefingKickoff,
  formData: FormData,
): Promise<EstadoBriefingKickoff> {
  const leitura = BriefingFormularioSchema.safeParse({
    projeto: formData.get('projeto'),
    operacao: formData.get('operacao'),
    objetivo: formData.get('objetivo') ?? '',
    criterioSucesso: formData.get('criterioSucesso') ?? '',
    responsavelCliente: formData.get('responsavelCliente') ?? '',
    responsavelTecnico: formData.get('responsavelTecnico') ?? '',
    acessos: textoParaItensBriefing(formData.get('acessos')),
    limites: textoParaItensBriefing(formData.get('limites')),
    proximosPassos: textoParaItensBriefing(formData.get('proximosPassos')),
    observacoes: formData.get('observacoes') ?? '',
    fonteCallId: formData.get('fonteCallId'),
  });
  if (!leitura.success) return { erro: 'Revise os campos do acordo operacional.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data: projeto, error: erroProjeto } = await supabase
    .from('projetos_execucao')
    .select('id, portal_codigo, empresa_id, oportunidade_id, briefing_kickoff')
    .eq('id', leitura.data.projeto)
    .eq('dono', user.id)
    .maybeSingle();
  if (erroProjeto || !projeto) return { erro: 'Este projeto não está disponível.' };

  let fonteCallId = lerBriefingKickoff(projeto.briefing_kickoff)?.fonteCallId ?? null;
  if (!fonteCallId && leitura.data.fonteCallId) {
    const { data: call } = await supabase
      .from('calls_reunioes')
      .select('id')
      .eq('id', leitura.data.fonteCallId)
      .eq('oportunidade_id', projeto.oportunidade_id)
      .eq('tipo', 'kickoff')
      .maybeSingle();
    fonteCallId = call?.id ?? null;
  }

  const briefing = {
    objetivo: leitura.data.objetivo,
    criterioSucesso: leitura.data.criterioSucesso,
    responsavelCliente: leitura.data.responsavelCliente,
    responsavelTecnico: leitura.data.responsavelTecnico,
    acessos: leitura.data.acessos,
    limites: leitura.data.limites,
    proximosPassos: leitura.data.proximosPassos,
    observacoes: leitura.data.observacoes,
    confirmadoEm: leitura.data.operacao === 'confirmar' ? new Date().toISOString() : null,
    fonteCallId,
  };

  if (leitura.data.operacao === 'confirmar' && !briefingPodeSerConfirmado(briefing)) {
    return {
      erro: 'Para confirmar, complete objetivo, sucesso, responsáveis, acessos, limites e próximos passos.',
    };
  }

  const { data, error } = await supabase
    .from('projetos_execucao')
    .update({ briefing_kickoff: briefing })
    .eq('id', leitura.data.projeto)
    .eq('dono', user.id)
    .select('id')
    .maybeSingle();
  if (error || !data) {
    console.error(
      `[projetos-execucao:briefing] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível salvar o acordo operacional agora.' };
  }

  if (leitura.data.operacao === 'confirmar') {
    const erroDependencias = await sincronizarDependencias({
      supabase,
      dono: user.id,
      projeto,
      briefing,
    });
    if (erroDependencias) {
      console.error(
        `[projetos-execucao:dependencias] ${erroDependencias.code}: ${erroDependencias.message}`,
      );
      return {
        erro: 'O acordo foi salvo, mas a lista de preparação não ficou pronta. Confirme novamente.',
      };
    }
  }

  revalidatePath(`/entregas/${leitura.data.projeto}`);
  revalidatePath(`/portal/${projeto.portal_codigo}`);
  revalidarDirecaoOperacional();
  return leitura.data.operacao === 'confirmar'
    ? {
        sucesso: 'Acordo confirmado. A lista de preparação já está pronta.',
        confirmado: true,
      }
    : { sucesso: 'Rascunho salvo. Confirme quando o combinado estiver completo.' };
}
