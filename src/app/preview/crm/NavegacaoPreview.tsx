'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

/** Exercita a saída por Link e o retorno RSC, sem acessar fichas ou contas reais. */
export function NavegacaoPreview({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <div
      onClickCapture={(evento) => {
        const link = (evento.target as Element).closest('a');
        if (!link || !link.pathname.startsWith('/vendas/')) return;
        if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
        evento.preventDefault();
        router.push(
          `/preview/crm?volume=1&ficha=${encodeURIComponent(link.pathname.split('/').pop()!)}`,
        );
      }}
    >
      {children}
    </div>
  );
}
