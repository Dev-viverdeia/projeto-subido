'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Check-in e cancelamento — as duas únicas mutações que um membro faz aqui.
 *
 * A REGRA MORA NO BANCO, e esta camada não a repete. O trigger
 * `private.validar_inscricao` recusa sessão não publicada, sessão encerrada e
 * sessão lotada, com um `for update` na linha da mentoria que serializa dois
 * cliques na última vaga. Revalidar aqui em TypeScript seria uma segunda cópia da
 * regra — e a cópia que perde, porque ela conta antes de gravar e não segura
 * lock nenhum.
 *
 * O QUE ESTA CAMADA FAZ é traduzir a recusa em frase. O usuário não pode receber
 * `new row violates check constraint`; e a regra da casa é clara: nunca exponha
 * `error.message` cru do PostgREST.
 *
 * A AUTORIZAÇÃO É DA RLS. A policy de insert é
 * `usuario_id = (select auth.uid())`, então não há como inscrever outra pessoa —
 * nem passando o id dela. O `getUser()` aqui é para preencher a coluna e para a
 * mensagem sair honesta quando a sessão expirou.
 */

const Id = z.uuid();

export type ResultadoCheckin = { ok: true } | { ok: false; mensagem: string };

/* O código vem do `raise … using errcode` do trigger; a mensagem vem do próprio
   `raise`. Casar pelo TEXTO é o que mantém isto legível — os três usam 23514, e
   distinguir por código exigiria três códigos artificiais. */
function mensagemDaRecusa(bruto: string): string {
  if (bruto.includes('sem vagas')) {
    return 'As vagas acabaram enquanto você decidia. A sessão está lotada.';
  }
  if (bruto.includes('encerrada')) {
    return 'Esta mentoria já aconteceu.';
  }
  if (bruto.includes('não publicada') || bruto.includes('nao publicada')) {
    return 'Esta mentoria não está aberta para check-in.';
  }
  if (bruto.includes('duplicate key') || bruto.includes('mentoria_inscricoes_pkey')) {
    return 'Você já tinha feito check-in nesta mentoria.';
  }
  return 'Não foi possível fazer o check-in agora. Tente de novo em instantes.';
}

export async function fazerCheckin(mentoriaId: string): Promise<ResultadoCheckin> {
  const id = Id.safeParse(mentoriaId);
  if (!id.success) return { ok: false, mensagem: 'Mentoria inválida.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, mensagem: 'Sua sessão expirou. Entre de novo para continuar.' };

  const { error } = await supabase
    .from('mentoria_inscricoes')
    .insert({ mentoria_id: id.data, usuario_id: user.id });

  if (error)
    return { ok: false, mensagem: mensagemDaRecusa(`${error.message} ${error.code ?? ''}`) };

  revalidatePath('/mentorias');
  revalidatePath('/inicio');
  return { ok: true };
}

/**
 * Cancelar é apagar a própria linha — e a policy de delete é
 * `usuario_id = (select auth.uid())`, então um id alheio simplesmente não casa
 * nenhuma linha. O delete "funciona" afetando zero, que é o comportamento certo:
 * não revela se aquela inscrição existe.
 */
export async function cancelarCheckin(mentoriaId: string): Promise<ResultadoCheckin> {
  const id = Id.safeParse(mentoriaId);
  if (!id.success) return { ok: false, mensagem: 'Mentoria inválida.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, mensagem: 'Sua sessão expirou. Entre de novo para continuar.' };

  const { error } = await supabase
    .from('mentoria_inscricoes')
    .delete()
    .eq('mentoria_id', id.data)
    .eq('usuario_id', user.id);

  if (error) {
    return { ok: false, mensagem: 'Não foi possível cancelar agora. Tente de novo em instantes.' };
  }

  revalidatePath('/mentorias');
  revalidatePath('/inicio');
  return { ok: true };
}
