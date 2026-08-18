'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AtualizarEnriquecimentos({ ativo }: { ativo: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!ativo) return;
    const inicio = Date.now();
    const intervalo = window.setInterval(() => {
      if (Date.now() - inicio > 120_000) {
        window.clearInterval(intervalo);
        return;
      }
      router.refresh();
    }, 8_000);
    return () => window.clearInterval(intervalo);
  }, [ativo, router]);

  return null;
}
