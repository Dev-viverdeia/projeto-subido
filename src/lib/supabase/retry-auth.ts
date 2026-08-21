type ErroComCausa = {
  code?: unknown;
  message?: unknown;
  causa?: unknown;
  cause?: unknown;
};

/**
 * O GoTrue e o PostgREST podem discordar do relógio por alguns milissegundos
 * logo depois de emitir ou renovar uma sessão. Nesse intervalo curto o token é
 * válido, mas o PostgREST responde `PGRST303: JWT issued at future`.
 */
export function ehJwtEmitidoNoFuturo(erro: unknown): boolean {
  let atual = erro;

  for (let nivel = 0; nivel < 3; nivel += 1) {
    if (!atual || typeof atual !== 'object') return false;
    const candidato = atual as ErroComCausa;
    if (
      candidato.code === 'PGRST303' &&
      typeof candidato.message === 'string' &&
      candidato.message.toLowerCase().includes('issued at future')
    ) {
      return true;
    }
    atual = candidato.causa ?? candidato.cause;
  }

  return false;
}

export async function repetirAposSincronizarRelogio<T>(
  operacao: () => Promise<T>,
  esperar: (milissegundos: number) => Promise<void> = (milissegundos) =>
    new Promise((resolve) => setTimeout(resolve, milissegundos)),
): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    if (!ehJwtEmitidoNoFuturo(erro)) throw erro;
    await esperar(1_200);
    return operacao();
  }
}
