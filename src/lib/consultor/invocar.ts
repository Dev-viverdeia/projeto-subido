'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Chamada à Edge Function do Consultor, do browser — mesmo padrão (e mesmos
 * porquês) do `lib/builder/invocar.ts`: `functions.invoke` monta URL e anexa o
 * `Authorization` da sessão; o erro legível vem do CORPO da resposta, não do
 * `error` genérico do supabase-js.
 */

export type FalhaDoConsultor = {
  mensagem: string;
  tipo?: string;
};

export type RespostaDoConsultor = {
  thread_id: string;
  resposta: string;
};

export async function enviarMensagem(
  mensagem: string,
  threadId?: string,
): Promise<{ dados: RespostaDoConsultor; falha: null } | { dados: null; falha: FalhaDoConsultor }> {
  const supabase = createClient();

  const resposta = await supabase.functions.invoke<RespostaDoConsultor>('consultor/responder', {
    body: threadId ? { thread_id: threadId, mensagem } : { mensagem },
  });

  if (resposta.error) {
    const doCorpo = await mensagemDoCorpo(resposta.response);
    return {
      dados: null,
      falha: doCorpo ?? { mensagem: 'Não foi possível enviar. Tente de novo.' },
    };
  }

  return { dados: resposta.data as RespostaDoConsultor, falha: null };
}

async function mensagemDoCorpo(response: Response | undefined): Promise<FalhaDoConsultor | null> {
  if (!response) return null;
  try {
    const corpo: unknown = await response.json();
    if (typeof corpo === 'object' && corpo !== null && 'erro' in corpo) {
      return {
        mensagem: String(corpo.erro),
        tipo: 'tipo' in corpo ? String(corpo.tipo) : undefined,
      };
    }
  } catch {
    /* Corpo não-JSON — cai no genérico. */
  }
  return null;
}
