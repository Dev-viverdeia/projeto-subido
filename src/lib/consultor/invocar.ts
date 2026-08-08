'use client';

/**
 * Chamada ao Route Handler do Sobral AI. A sessão viaja no cookie HttpOnly e a
 * chave da OpenAI permanece no servidor da aplicação.
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
  return invocar(threadId ? { thread_id: threadId, mensagem } : { mensagem });
}

/** Responde a pergunta JÁ GRAVADA pelo browser — o caminho da conversa nova. */
export async function responderPendente(
  threadId: string,
): Promise<{ dados: RespostaDoConsultor; falha: null } | { dados: null; falha: FalhaDoConsultor }> {
  return invocar({ thread_id: threadId, pendente: true });
}

async function invocar(
  body: Record<string, unknown>,
): Promise<{ dados: RespostaDoConsultor; falha: null } | { dados: null; falha: FalhaDoConsultor }> {
  try {
    const resposta = await fetch('/api/consultor/responder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!resposta.ok) {
      const doCorpo = await mensagemDoCorpo(resposta);
      return {
        dados: null,
        falha: doCorpo ?? { mensagem: 'Não foi possível enviar. Tente de novo.' },
      };
    }

    return { dados: (await resposta.json()) as RespostaDoConsultor, falha: null };
  } catch {
    return {
      dados: null,
      falha: { mensagem: 'A conexão falhou. Confira sua internet e tente de novo.' },
    };
  }
}

async function mensagemDoCorpo(response: Response): Promise<FalhaDoConsultor | null> {
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
