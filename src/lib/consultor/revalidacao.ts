import 'server-only';

import { revalidatePath } from 'next/cache';

/**
 * Mantém o plano e o chat da Início coerentes depois de qualquer fato novo.
 * O Sobral AI agora vive nesta única superfície.
 */
export function revalidarDirecaoOperacional(): void {
  revalidatePath('/inicio');
}
