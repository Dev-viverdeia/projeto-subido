'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';

/**
 * A única mutação do Consultor que não fala com o modelo: apagar uma conversa.
 * Server Action, como as do Builder — dura milissegundos, e a RLS é quem
 * autoriza: id alheio afeta zero linhas, sem revelar se existe.
 */

const Id = z.uuid();

const ConfirmarAcaoCrmSchema = z.object({
  mensagem: z.uuid(),
  acao: z.string().trim().min(3).max(500),
  quando: z.union([z.literal(''), z.iso.date()]),
});

export type EstadoConfirmarAcaoCrm = {
  status?: 'erro' | 'sucesso';
  mensagem?: string;
  acao?: string;
  quando?: string | null;
};

/**
 * Confirma uma orientação no lead que estava ligado à mensagem quando ela foi
 * gerada. O id da oportunidade não vem do formulário: a função do banco o lê
 * do snapshot protegido da própria resposta, evitando troca de alvo.
 */
export async function confirmarAcaoCrm(
  _estado: EstadoConfirmarAcaoCrm,
  formData: FormData,
): Promise<EstadoConfirmarAcaoCrm> {
  const validacao = ConfirmarAcaoCrmSchema.safeParse({
    mensagem: formData.get('mensagem'),
    acao: formData.get('acao'),
    quando: formData.get('quando'),
  });

  if (!validacao.success) {
    return {
      status: 'erro',
      mensagem: 'Revise a ação e escolha uma data válida.',
    };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) {
    return { status: 'erro', mensagem: 'Sua sessão expirou. Entre novamente para continuar.' };
  }

  const quando = validacao.data.quando ? `${validacao.data.quando}T12:00:00-03:00` : undefined;
  const { data, error } = await supabase.rpc('sobral_confirmar_acao_crm', {
    p_mensagem: validacao.data.mensagem,
    p_acao: validacao.data.acao,
    p_quando: quando,
  });

  if (error) {
    console.error(`[sobral:confirmar-acao] ${error.code}: ${error.message}`);
    return {
      status: 'erro',
      mensagem:
        error.code === '22023'
          ? 'A data precisa ser de hoje em diante.'
          : 'Não foi possível registrar a ação agora. Tente novamente.',
    };
  }

  if (!data) {
    return {
      status: 'erro',
      mensagem: 'Essa orientação não está mais ligada a uma oportunidade aberta.',
    };
  }

  revalidatePath('/consultor');
  revalidatePath('/consultor/[id]', 'page');
  revalidatePath('/crm');
  revalidatePath('/inicio');
  revalidatePath('/solucoes');

  return {
    status: 'sucesso',
    mensagem: 'Ação registrada no CRM e no plano do cliente.',
    acao: validacao.data.acao,
    quando: validacao.data.quando || null,
  };
}

export async function apagarConversa(formData: FormData): Promise<void> {
  const id = Id.safeParse(formData.get('id'));
  if (!id.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('consultor_threads').delete().eq('id', id.data);
  if (error) throw handleError(error, 'consultor:apagar');

  revalidatePath('/consultor');
  /* `redirect` lança por dentro — fica FORA de qualquer try/catch. */
  redirect('/consultor');
}
