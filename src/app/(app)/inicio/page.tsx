import type { Metadata } from 'next';
import { planoDosMetadados } from '@/lib/planos/acessos';
import { createClient } from '@/lib/supabase/server';
import { MapaJornada } from './_components/MapaJornada';

export const metadata: Metadata = { title: 'Início' };

/** A Início guia diretamente para cada área, sem consultas operacionais pesadas. */
export default async function InicioPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const metadata = (claims?.user_metadata ?? {}) as { nome?: string };
  const plano = planoDosMetadados(claims?.app_metadata);
  const primeiroNome = metadata.nome?.trim().split(/\s+/)[0] ?? null;

  return <MapaJornada nome={primeiroNome} plano={plano} />;
}
