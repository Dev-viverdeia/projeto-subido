'use client';

import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';

/** Safari não ancora a rolagem quando o acompanhamento cresce acima do editor. */
export function usePosicaoEdicao(editor: RefObject<HTMLElement | null>) {
  const posicao = useRef<{ campo: HTMLElement; topo: number } | null>(null);
  const preservar = useCallback(() => {
    const campo = document.activeElement;
    if (
      campo instanceof HTMLElement &&
      editor.current?.contains(campo) &&
      campo.matches('input, textarea, select')
    ) {
      posicao.current = { campo, topo: campo.getBoundingClientRect().top };
    }
  }, [editor]);

  useLayoutEffect(() => {
    const anterior = posicao.current;
    posicao.current = null;
    if (!anterior || !anterior.campo.isConnected || document.activeElement !== anterior.campo)
      return;
    const deslocamento = anterior.campo.getBoundingClientRect().top - anterior.topo;
    if (Math.abs(deslocamento) > 1) window.scrollBy({ top: deslocamento, behavior: 'instant' });
  });

  return preservar;
}
