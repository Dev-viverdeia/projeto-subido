'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressoBusca } from './ProgressoBusca';

export function AcompanhamentoBusca({
  status,
  quantidade,
  etapa,
  detalhe,
}: {
  status: string;
  quantidade: number;
  etapa: number;
  detalhe: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (status !== 'processando') return;
    const atualizar = window.setInterval(() => router.refresh(), 2_500);
    return () => window.clearInterval(atualizar);
  }, [router, status]);

  useEffect(() => {
    if (status !== 'concluida' && status !== 'falhou') return;
    const url = new URL(window.location.href);
    url.searchParams.set('busca', status === 'concluida' ? 'concluida' : 'falhou');
    router.replace(`${url.pathname}${url.search}`);
  }, [router, status]);

  if (status !== 'processando') return null;
  return <ProgressoBusca quantidade={quantidade} etapa={etapa} detalhe={detalhe} />;
}
