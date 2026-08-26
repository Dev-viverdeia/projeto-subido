'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { ehAdmin } from '@/lib/auth/papeis';
import { reagendarOperacao } from '@/lib/operacoes/admin';
import { processarOperacaoPorId } from '@/lib/operacoes/processar';

export async function tentarNovamenteOperacao(formData: FormData) {
  if (!(await ehAdmin())) return;
  const leitura = z.uuid().safeParse(formData.get('operacao'));
  if (!leitura.success) return;

  try {
    const job = await reagendarOperacao(leitura.data);
    after(() => processarOperacaoPorId(job.id));
    revalidatePath('/admin/operacoes');
  } catch (causa) {
    console.error('[admin:operacoes:reagendar]', causa);
  }
}
