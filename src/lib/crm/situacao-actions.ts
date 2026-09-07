'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { exigirRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { SITUACOES_CRM, type SituacaoCrm } from './situacao';

const entradaSchema = z
  .object({
    id: z.uuid(),
    situacao: z.enum(SITUACOES_CRM),
    anterior: z.enum(SITUACOES_CRM),
    motivo: z.string().trim().max(300),
  })
  .refine((valor) => valor.situacao === 'ativa' || valor.motivo.length > 0);

export async function alterarSituacaoOportunidade(entrada: {
  id: string;
  situacao: SituacaoCrm;
  anterior: SituacaoCrm;
  motivo: string;
}): Promise<{ ok: true } | { ok: false; erro: string }> {
  await exigirRecurso('vendas');
  const validacao = entradaSchema.safeParse(entrada);
  if (!validacao.success) return { ok: false, erro: 'Escolha um motivo para continuar.' };
  const supabase = await createClient();
  const { error } = await supabase.rpc('crm_alterar_situacao', {
    p_oportunidade: validacao.data.id,
    p_situacao: validacao.data.situacao,
    p_anterior: validacao.data.anterior,
    p_motivo: validacao.data.motivo || undefined,
  });
  if (error)
    return {
      ok: false,
      erro:
        error.code === '40001'
          ? 'Esta venda mudou em outra tela. Atualize a página antes de continuar.'
          : 'Não foi possível atualizar a venda. Tente novamente.',
    };
  revalidatePath('/crm', 'layout');
  revalidatePath('/vendas', 'layout');
  revalidatePath('/metricas');
  revalidatePath('/propostas/nova');
  revalidarDirecaoOperacional();
  return { ok: true };
}
