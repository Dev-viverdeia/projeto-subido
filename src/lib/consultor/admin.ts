import 'server-only';

// Ponto único e auditável para a service role do Sobral AI. Route Handlers
// autenticam o usuário antes de chegar aqui; componentes nunca importam isto.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

export function criarAdminSobral() {
  return createAdminClient();
}
