import 'server-only';

import { revalidatePath } from 'next/cache';

/**
 * Mantém as duas entradas do mesmo Sobral AI coerentes depois de qualquer fato
 * novo. Início e Consultor compartilham conversa, contexto e recomendações.
 */
export function revalidarDirecaoOperacional(): void {
  revalidatePath('/inicio');
  revalidatePath('/consultor');
}
