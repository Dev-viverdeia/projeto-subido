'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { EstadoProjetoExecucao } from './actions';

const EncerramentoSchema = z.object({
  projeto: z.uuid(),
  resumo: z.string().trim().min(10).max(4000),
  resultado: z.string().trim().min(10).max(4000),
  evidenciaUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((valor) => !valor || /^https?:\/\/[^\s]+$/i.test(valor)),
  garantiaDias: z.coerce.number().int().min(0).max(180),
  garantiaCobre: z.string().trim().min(5).max(3000),
  garantiaNaoCobre: z.string().trim().min(5).max(3000),
  canalSuporte: z.string().trim().min(3).max(500),
  responsavel: z.string().trim().min(2).max(300),
  continuidade: z.string().trim().min(10).max(4000),
});

export async function salvarEncerramentoProjeto(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = EncerramentoSchema.safeParse({
    projeto: formData.get('projeto'),
    resumo: formData.get('resumo'),
    resultado: formData.get('resultado'),
    evidenciaUrl: formData.get('evidenciaUrl') ?? '',
    garantiaDias: formData.get('garantiaDias'),
    garantiaCobre: formData.get('garantiaCobre'),
    garantiaNaoCobre: formData.get('garantiaNaoCobre'),
    canalSuporte: formData.get('canalSuporte'),
    responsavel: formData.get('responsavel'),
    continuidade: formData.get('continuidade'),
  });

  if (!validacao.success) {
    const urlInvalida = validacao.error.issues.some((item) => item.path[0] === 'evidenciaUrl');
    return {
      erro: urlInvalida
        ? 'Use um link completo começando com http.'
        : 'Complete os dados do encerramento antes de salvar.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { error } = await supabase.rpc('projeto_encerramento_salvar', {
    p_projeto_id: validacao.data.projeto,
    p_resumo_entrega: validacao.data.resumo,
    p_resultado_principal: validacao.data.resultado,
    p_evidencia_resultado_url: validacao.data.evidenciaUrl,
    p_garantia_dias: validacao.data.garantiaDias,
    p_garantia_cobre: validacao.data.garantiaCobre,
    p_garantia_nao_cobre: validacao.data.garantiaNaoCobre,
    p_canal_suporte: validacao.data.canalSuporte,
    p_responsavel_continuidade: validacao.data.responsavel,
    p_orientacao_continuidade: validacao.data.continuidade,
  });

  if (error) {
    console.error(`[projetos-execucao:encerramento] ${error.code}: ${error.message}`);
    return { erro: 'Não foi possível salvar o encerramento agora. Tente novamente.' };
  }

  revalidatePath(`/entregas/${validacao.data.projeto}`);
  return { sucesso: 'Encerramento salvo. Agora você já pode pedir o aceite final.' };
}
