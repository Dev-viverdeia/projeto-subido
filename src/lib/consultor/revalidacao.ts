import 'server-only';

import { revalidatePath } from 'next/cache';

/**
 * Mantém a prioridade operacional coerente depois de qualquer fato novo.
 * A Início e o Sobral AI leem as mesmas fontes, mas possuem rotas próprias.
 */
export function revalidarDirecaoOperacional(): void {
  revalidatePath('/inicio');
  revalidatePath('/consultor');
  revalidatePath('/consultor/[id]', 'page');
}
