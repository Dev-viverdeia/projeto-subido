import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { planoDosMetadados, planoTemRecurso, type RecursoPlano } from './acessos';

export async function exigirRecurso(recurso: RecursoPlano): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const plano = planoDosMetadados(data?.claims?.user_metadata);
  if (!planoTemRecurso(plano, recurso)) redirect(`/conta?upgrade=${recurso}`);
}
