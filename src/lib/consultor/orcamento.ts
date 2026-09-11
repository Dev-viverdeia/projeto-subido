import 'server-only';
import { criarAdminSobral } from './admin';
import { ErroSobral } from './erro';

/** O teto mensal inclui reservas. Não movimenta a carteira de créditos. */
export async function comOrcamentoSobral<T>(
  dono: string,
  teto: number,
  gerar: (informarUso: (tokens: number) => void) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  signal?.throwIfAborted();
  const admin = criarAdminSobral();
  const id = crypto.randomUUID();
  const { data, error } = await admin.rpc('sobral_reservar_uso', {
    p_id: id,
    p_dono: dono,
    p_tokens: teto,
  });
  if (error?.message.includes('limite_sobral_mensal'))
    throw new ErroSobral('Você atingiu o limite mensal do Sobral AI.', 'limite');
  if (error || data !== true)
    throw new ErroSobral('Não foi possível confirmar o limite de uso. Tente novamente.', 'falha');
  let uso: number | null = null;
  try {
    if (signal?.aborted) {
      uso = 0; // Sabemos que nenhuma chamada de geração foi iniciada.
      signal.throwIfAborted();
    }
    return await gerar((tokens) => {
      if (Number.isSafeInteger(tokens) && tokens >= 0) uso = tokens;
    });
  } finally {
    // Sem recibo do provedor (cancelamento/queda), conserva a reserva. Nunca
    // transforma trabalho possivelmente faturado em zero; retries são idempotentes.
    if (uso !== null) {
      for (let tentativa = 0; tentativa < 2; tentativa++) {
        const { error: falha } = await admin.rpc('sobral_liquidar_uso', {
          p_id: id,
          p_dono: dono,
          p_tokens: uso,
        });
        if (!falha) break;
        console.error('[sobral:orcamento] confirmação pendente', falha.code);
      }
    }
  }
}
