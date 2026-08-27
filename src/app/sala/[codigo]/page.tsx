import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { livekitEnv } from '@/lib/env';
import { obterContextoCoach } from '@/lib/calls/contexto-coach';
import { obterContextoDaSala } from '@/lib/calls/queries';
import { createClient } from '@/lib/supabase/server';
import { SalaCall } from './SalaCall';

export const metadata: Metadata = {
  title: 'Sala de reunião',
  robots: { index: false, follow: false },
};

export default async function SalaCallPage({ params }: PageProps<'/sala/[codigo]'>) {
  const { codigo } = await params;
  const contexto = await obterContextoDaSala(codigo);
  if (!contexto) notFound();
  const contextoCoach = contexto.anfitriao
    ? await obterContextoCoach(await createClient(), contexto.convite.reuniaoId)
    : null;

  return (
    <SalaCall
      codigo={codigo}
      convite={contexto.convite}
      anfitriao={contexto.anfitriao}
      nomeSugerido={contexto.nomeSugerido}
      videoConfigurado={Boolean(livekitEnv())}
      planoAnfitriao={contextoCoach?.plano ?? null}
    />
  );
}
