'use client';

export type TentativaTexto = {
  threadId: string;
  mensagemId: string;
  mensagem: string;
  nova: boolean;
  dono?: string;
  solicitado: boolean;
};
export type RegistroTexto =
  | { threadId: string; mensagemId: string; falha: null }
  | {
      threadId: null;
      mensagemId: null;
      falha: string;
      pendente: boolean;
      tipo?: 'sessao';
      ausente?: boolean;
    };

export function novaTentativaTexto(mensagem: string, threadId?: string): TentativaTexto {
  return {
    threadId: threadId ?? crypto.randomUUID(),
    mensagemId: crypto.randomUUID(),
    mensagem: mensagem.trim(),
    nova: !threadId,
    solicitado: false,
  };
}

/** SDK fora do carregamento inicial. O recibo permanece na instância da tela,
 * não no armazenamento do navegador. Reconectar nunca dispara este método. */
export async function registrarEnvio(
  tentativa: TentativaTexto,
  somenteConferir = false,
): Promise<RegistroTexto> {
  try {
    const { confirmarTexto } = await import('./envio-texto');
    return await confirmarTexto(tentativa, somenteConferir);
  } catch {
    return {
      threadId: null,
      mensagemId: null,
      falha: tentativa.solicitado
        ? 'Falta confirmar o envio.'
        : 'Não foi possível iniciar o envio. Sua pergunta continua aqui.',
      pendente: tentativa.solicitado,
    };
  }
}
