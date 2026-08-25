import 'server-only';

import { redirect } from 'next/navigation';
import { ROTA_ENTRAR } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import { planoDosMetadados, planoTemRecurso, type PlanoSubido, type RecursoPlano } from './acessos';

export type AcessoRecurso =
  | { permitido: true; plano: PlanoSubido }
  | { permitido: false; motivo: 'sessao' }
  | { permitido: false; motivo: 'plano'; plano: PlanoSubido };

/**
 * Autoriza no servidor usando apenas os claims assinados da sessão.
 *
 * A interface pode esconder ou sinalizar um item, mas isso nunca substitui a
 * checagem no ponto que lê ou altera dados. A ausência de sessão também não
 * pode cair no fallback legado Pro de `planoDosMetadados`.
 */
export async function obterAcessoRecurso(recurso: RecursoPlano): Promise<AcessoRecurso> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return { permitido: false, motivo: 'sessao' };

  const plano = planoDosMetadados(data.claims.app_metadata);
  return planoTemRecurso(plano, recurso)
    ? { permitido: true, plano }
    : { permitido: false, motivo: 'plano', plano };
}

export async function exigirRecurso(recurso: RecursoPlano, origem?: string): Promise<void> {
  const acesso = await obterAcessoRecurso(recurso);
  if (acesso.permitido) return;
  if (acesso.motivo === 'sessao') redirect(ROTA_ENTRAR);
  const parametros = new URLSearchParams({ upgrade: recurso });
  if (origem) parametros.set('origem', origem);
  redirect(`/conta?${parametros.toString()}`);
}
