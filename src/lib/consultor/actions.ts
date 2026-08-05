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
