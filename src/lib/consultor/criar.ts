'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Cria a conversa e grava a primeira mensagem DIRETO do browser, pela RLS —
 * sem passar pela Edge Function. É o que permite navegar para o chat em
 * milissegundos e deixar a RESPOSTA (a parte lenta) acontecer já dentro dele,
 * como no consultor da plataforma de origem.
 *
 * A RLS é a mesma barreira de sempre: `dono = auth.uid()` no insert da thread,
 * e a mensagem só entra em thread do próprio dono.
 */

/** Mesmo corte do título que a Edge Function usa — na palavra, teto 80. */
function tituloDa(mensagem: string): string {
  const bruto = mensagem.replace(/\s+/g, ' ').trim();
  if (bruto.length <= 80) return bruto;
  const corte = bruto.slice(0, 80);
  const espaco = corte.lastIndexOf(' ');
  return `${espaco > 48 ? corte.slice(0, espaco) : corte}…`;
}

export async function criarConversa(
  mensagem: string,
): Promise<{ threadId: string; falha: null } | { threadId: null; falha: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { threadId: null, falha: 'Faça login para usar o Consultor.' };

  const { data: thread, error } = await supabase
    .from('consultor_threads')
    .insert({ dono: user.id, titulo: tituloDa(mensagem) })
    .select('id')
    .single();
  if (error || !thread) return { threadId: null, falha: 'Não foi possível iniciar a conversa.' };

  const { error: erroMsg } = await supabase
    .from('consultor_mensagens')
    .insert({ thread_id: thread.id, papel: 'usuario', conteudo: mensagem });
  if (erroMsg) return { threadId: null, falha: 'Não foi possível enviar a mensagem.' };

  return { threadId: thread.id, falha: null };
}
