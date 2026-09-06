'use client';

/** Carrega o SDK só no envio. Falha de rede ou de download do módulo devolve
 * o compositor à edição; a UI preserva texto/anexos e não repete uma mutação. */
export async function registrarEnvio(
  mensagem: string,
  arquivos: readonly File[],
  threadId?: string,
) {
  try {
    const { criarConversa, adicionarMensagem } = await import('./criar');
    return threadId
      ? await adicionarMensagem(threadId, mensagem, arquivos)
      : await criarConversa(mensagem, arquivos);
  } catch {
    return {
      threadId: null,
      falha:
        'O envio não foi confirmado. Sua mensagem continua aqui. Confira a conexão e o histórico antes de reenviar.',
    };
  }
}
