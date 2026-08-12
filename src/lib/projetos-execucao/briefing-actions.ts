'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  BriefingKickoffSchema,
  briefingPodeSerConfirmado,
  lerBriefingKickoff,
  textoParaItensBriefing,
} from './briefing';
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
    .select('portal_codigo, oportunidade_id, briefing_kickoff')
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

  revalidatePath(`/solucoes/execucao/${leitura.data.projeto}`);
  revalidatePath(`/portal/${projeto.portal_codigo}`);
  return leitura.data.operacao === 'confirmar'
    ? { sucesso: 'Acordo operacional confirmado. O portal já pode ser ativado.', confirmado: true }
    : { sucesso: 'Rascunho salvo. Confirme quando o combinado estiver completo.' };
}
