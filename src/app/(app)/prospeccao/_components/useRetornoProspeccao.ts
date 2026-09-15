'use client';

import { useLayoutEffect, useRef } from 'react';
import { consumirRetornoProspeccao } from '@/lib/prospeccao/retorno-local';

export function useRetornoProspeccao(lista?: string, empresa?: string) {
  const raiz = useRef<HTMLDivElement>(null);
  const restaurado = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!lista || !raiz.current) return;
    const frame = requestAnimationFrame(() => {
      const resultados = raiz.current;
      if (!resultados) return;
      const posicao = consumirRetornoProspeccao();
      // Só pode alcançar empresas já presentes no resultado autorizado pelo servidor.
      const id = empresa ?? (posicao?.lista === lista ? posicao.empresa : undefined);
      if (!id || new URLSearchParams(location.search).get('crm') === 'erro') return;
      const alvo = `${lista}:${id}`;
      // A navegação pode mostrar a lista em cache antes de chegar a URL atualizada.
      // Não reposicionar de novo quando o servidor confirmar o mesmo alvo.
      if (!posicao && restaurado.current === alvo) return;
      restaurado.current = alvo;
      const titulo = [...resultados.querySelectorAll<HTMLElement>('h3[id]')].find(
        (el) => el.id === `empresa-${id}`,
      );
      const card = titulo?.closest('article');
      if (!card || !titulo) {
        resultados.scrollIntoView({ block: 'start', behavior: 'instant' });
        resultados.focus({ preventScroll: true });
        return;
      }
      const mesmaPosicao =
        posicao?.lista === lista && posicao.empresa === id && posicao.largura === innerWidth;
      if (mesmaPosicao) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + card.getBoundingClientRect().top - posicao.topo),
          behavior: 'instant',
        });
      } else {
        titulo.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
      const controle =
        card.querySelector<HTMLElement>('[data-retorno-ficha]') ??
        card.querySelector<HTMLElement>('button');
      controle?.focus({ preventScroll: true });
      if (
        controle &&
        (controle.getBoundingClientRect().top < 88 ||
          controle.getBoundingClientRect().bottom > innerHeight - 88)
      ) {
        controle.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [lista, empresa]);

  return raiz;
}
