import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterPosCall } from '@/lib/calls/queries';
import { DossiePosCall } from './_components/DossiePosCall';

export const metadata: Metadata = { title: 'Pós-call inteligente' };

export default async function PosCallPage({ params, searchParams }: PageProps<'/calls/[id]'>) {
  const [{ id }, parametros] = await Promise.all([params, searchParams]);
  const posCall = await obterPosCall(id);
  if (!posCall) notFound();

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
