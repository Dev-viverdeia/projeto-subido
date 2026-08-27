import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterPosCall } from '@/lib/calls/queries';
import { callPodeAbrir } from '@/lib/calls/tipos';
import { DossiePosCall } from './_components/DossiePosCall';
import { PreparacaoCall } from './_components/PreparacaoCall';

export const metadata: Metadata = { title: 'Reunião' };

export default async function PosCallPage({ params, searchParams }: PageProps<'/calls/[id]'>) {
  const [{ id }, parametros] = await Promise.all([params, searchParams]);
  const posCall = await obterPosCall(id);
  if (!posCall) notFound();

  if (callPodeAbrir(posCall.reuniao.status)) {
    return <PreparacaoCall posCall={posCall} />;
  }

  return (
    <DossiePosCall
      posCall={posCall}
      estadoAcao={
        typeof parametros.plano === 'string'
          ? parametros.plano
          : typeof parametros.acao === 'string'
            ? parametros.acao
            : null
      }
    />
  );
}
