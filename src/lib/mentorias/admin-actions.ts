'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ZodError } from 'zod';
import { ehAdmin } from '@/lib/auth/papeis';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { mentoriaAdminSchema } from './admin';

export type EstadoMentoriaAdmin = {
  erro?: string;
  porCampo?: Record<string, string>;
};

export const ESTADO_MENTORIA_ADMIN: EstadoMentoriaAdmin = {};

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === 'string' ? valor : '';
}

function deZod(erro: ZodError): EstadoMentoriaAdmin {
  const porCampo: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = issue.path[0];
    if (typeof campo === 'string' && !porCampo[campo]) porCampo[campo] = issue.message;
  }
  return { porCampo };
}

/**
 * Criação e edição usam a mesma ação para que a validação não se divida em duas
 * versões. O layout administrativo já protege a página, mas a ação repete a
 * autorização: Server Actions também podem ser chamadas sem visitar a tela.
 */
export async function salvarMentoriaAdmin(
  _anterior: EstadoMentoriaAdmin,
  formData: FormData,
): Promise<EstadoMentoriaAdmin> {
  if (!(await ehAdmin())) return { erro: 'Só administradores podem alterar mentorias.' };

  const validacao = mentoriaAdminSchema.safeParse({
    titulo: texto(formData.get('titulo')),
    descricao: texto(formData.get('descricao')),
    mentor_id: texto(formData.get('mentor_id')),
    inicio: texto(formData.get('inicio')),
    fim: texto(formData.get('fim')),
    vagas: texto(formData.get('vagas')),
    custo_creditos: texto(formData.get('custo_creditos')),
    sala_url: texto(formData.get('sala_url')),
    status: texto(formData.get('status')),
  });

  if (!validacao.success) return deZod(validacao.error);

  const id = texto(formData.get('id'));
  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from('mentorias').update(validacao.data).eq('id', id);
    if (error) return { erro: handleError(error, 'admin:mentoria:atualizar').message };
  } else {
    const { data: sessao } = await supabase.auth.getClaims();
    const { error } = await supabase.from('mentorias').insert({
      ...validacao.data,
      criado_por: sessao?.claims.sub ?? null,
    });
    if (error) return { erro: handleError(error, 'admin:mentoria:criar').message };
  }

  revalidatePath('/admin/mentorias');
  revalidatePath('/mentorias');
  revalidatePath('/inicio');
  redirect('/admin/mentorias');
}
