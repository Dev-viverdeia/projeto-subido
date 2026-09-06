import 'server-only';

import { redirect } from 'next/navigation';
import { ROTA_ENTRAR } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import { planoDosMetadados, planoTemRecurso, type PlanoSubido, type RecursoPlano } from './acessos';
import { destinoDeUpgrade } from './acessos';

export type AcessoRecurso =
  | { permitido: true; plano: PlanoSubido }
  | { permitido: false; motivo: 'sessao' }
  | { permitido: false; motivo: 'plano'; plano: PlanoSubido };

/**
 * Autoriza pelo usuário atual no Auth, não pelo plano de um JWT antigo.
 *
 * A interface pode esconder ou sinalizar um item, mas isso nunca substitui a
 * checagem no ponto que lê ou altera dados. A ausência de sessão também não
 * pode liberar recursos pagos.
 */
export async function obterAcessoRecurso(recurso: RecursoPlano): Promise<AcessoRecurso> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return { permitido: false, motivo: 'sessao' };

  const plano = planoDosMetadados(data.user.app_metadata);
  return planoTemRecurso(plano, recurso)
    ? { permitido: true, plano }
    : { permitido: false, motivo: 'plano', plano };
}

export async function exigirRecurso(recurso: RecursoPlano, origem?: string): Promise<void> {
  const acesso = await obterAcessoRecurso(recurso);
  if (acesso.permitido) return;
  if (acesso.motivo === 'sessao') redirect(ROTA_ENTRAR);
  redirect(destinoDeUpgrade(recurso, origem));
}
