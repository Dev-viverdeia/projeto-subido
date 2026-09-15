'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { origemProspeccao } from '@/lib/prospeccao/retorno';
import { guardarRetornoProspeccao } from '@/lib/prospeccao/retorno-local';

/** Fixture: a página pai é 404 em produção. Nunca abre ou cria registros reais. */
export function NavegacaoPreview({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <div
      onClickCapture={(evento) => {
        const link = (evento.target as Element).closest('a');
        if (!link || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
        const url = new URL(link.href);
        if (url.origin !== location.origin) return;
        if (url.pathname.startsWith('/vendas/')) {
          evento.preventDefault();
          const origem = origemProspeccao(
            url.searchParams.get('lista'),
            url.searchParams.get('empresa'),
          );
          if (origem) guardarRetornoProspeccao(origem);
          url.searchParams.set('ficha', '1');
        } else if (url.pathname === '/prospeccao') {
          evento.preventDefault();
          const atual = new URL(location.href);
          if (atual.searchParams.has('novo'))
            url.searchParams.set('criado', atual.searchParams.get('empresa') ?? '');
        } else return;
        url.searchParams.set('navegacao', '1');
        router.push(`/preview/prospeccao?${url.searchParams}${url.hash}`, {
          scroll: url.pathname === '/prospeccao' ? false : undefined,
        });
      }}
      onSubmitCapture={(evento) => {
        const dados = new FormData(evento.target);
        const origem = origemProspeccao(dados.get('lista'), dados.get('lead'));
        if (!origem) return;
        evento.preventDefault();
        evento.stopPropagation();
        guardarRetornoProspeccao(origem);
        router.push(
          `/preview/prospeccao?${new URLSearchParams({ ...origem, origem: 'prospeccao', ficha: '1', novo: '1', navegacao: '1' })}`,
        );
      }}
    >
      {children}
    </div>
  );
}
