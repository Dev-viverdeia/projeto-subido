'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { EstadoProjetoExecucao } from './actions';

const DataSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

const AgendamentoSchema = z.object({
  projeto: z.uuid(),
  revisaoEm: DataSchema,
});

const RegistroSchema = z.object({
  projeto: z.uuid(),
  resultado: z.string().trim().min(10).max(4000),
  evidenciaUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((valor) => !valor || /^https?:\/\/[^\s]+$/i.test(valor)),
  decisao: z.enum(['manter', 'ajustar_garantia', 'expandir', 'novo_projeto', 'encerrar']),
  proximoPasso: z.string().trim().min(5).max(2000),
  proximoPassoEm: DataSchema,
  compartilharCliente: z.boolean(),
});

function revalidarProjeto(projeto: string) {
  revalidatePath(`/entregas/${projeto}`);
  revalidatePath('/entregas');
  revalidatePath('/inicio');
}

export async function agendarRevisaoResultado(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = AgendamentoSchema.safeParse({
    projeto: formData.get('projeto'),
    revisaoEm: formData.get('revisaoEm'),
  });
  if (!validacao.success) return { erro: 'Escolha uma data futura para a revisão.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { error } = await supabase.rpc('projeto_evolucao_agendar', {
    p_projeto_id: validacao.data.projeto,
    p_revisao_em: validacao.data.revisaoEm,
  });
  if (error) {
    console.error(`[projetos-execucao:evolucao-agendar] ${error.code}: ${error.message}`);
    return { erro: 'A data da revisão não foi atualizada. Escolha uma data futura.' };
  }

  revalidarProjeto(validacao.data.projeto);
  return { sucesso: 'Revisão reagendada.' };
}

export async function registrarRevisaoResultado(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = RegistroSchema.safeParse({
    projeto: formData.get('projeto'),
    resultado: formData.get('resultado'),
    evidenciaUrl: formData.get('evidenciaUrl') ?? '',
    decisao: formData.get('decisao'),
    proximoPasso: formData.get('proximoPasso'),
    proximoPassoEm: formData.get('proximoPassoEm'),
    compartilharCliente: formData.get('compartilharCliente') === 'on',
  });

  if (!validacao.success) {
    const urlInvalida = validacao.error.issues.some((item) => item.path[0] === 'evidenciaUrl');
    return {
      erro: urlInvalida
        ? 'Use um link completo começando com http.'
        : 'Registre o resultado, a decisão e quando o próximo passo acontece.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { error } = await supabase.rpc('projeto_evolucao_registrar', {
    p_projeto_id: validacao.data.projeto,
    p_resultado_observado: validacao.data.resultado,
    p_evidencia_resultado_url: validacao.data.evidenciaUrl,
    p_decisao: validacao.data.decisao,
    p_proximo_passo: validacao.data.proximoPasso,
    p_proximo_passo_em: validacao.data.proximoPassoEm,
    p_compartilhar_cliente: validacao.data.compartilharCliente,
  });
  if (error) {
    console.error(`[projetos-execucao:evolucao-registrar] ${error.code}: ${error.message}`);
    return { erro: 'A revisão não foi registrada. Confira os dados e tente novamente.' };
  }

  revalidarProjeto(validacao.data.projeto);
  return { sucesso: 'Resultado registrado. O próximo passo ficou claro para este cliente.' };
}
