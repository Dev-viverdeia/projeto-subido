'use client';

import { useRef } from 'react';

export function usePreviaProposta() {
  const editorRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const secaoPreviewRef = useRef('cliente');
  const campoEmFocoRef = useRef<HTMLElement | null>(null);

  function voltarParaEdicao() {
    requestAnimationFrame(() => {
      const campo = campoEmFocoRef.current;
      if (!campo || !campo.isConnected) return;
      campo.scrollIntoView({ block: 'center', behavior: 'instant' });
      campo.focus({ preventScroll: true });
    });
  }

  function mostrarSecaoPreview(secao: string, forcar = false) {
    if (secaoPreviewRef.current === secao && !forcar) return;
    secaoPreviewRef.current = secao;
    const painel = previewRef.current;
    const alvo = painel?.querySelector<HTMLElement>(`[data-secao-preview="${secao}"]`);
    if (!painel || !alvo || painel.getBoundingClientRect().width === 0) return;

    if (getComputedStyle(painel).position === 'static') {
      // No celular, só reposiciona a página após o usuário pedir para ver a prévia.
      if (forcar) alvo.scrollIntoView({ block: 'start', behavior: 'instant' });
      return;
    }

    // Move apenas o documento; a página e o campo em edição ficam no lugar.
    painel.scrollTo({
      top:
        painel.scrollTop +
        alvo.getBoundingClientRect().top -
        painel.getBoundingClientRect().top -
        (painel.querySelector<HTMLElement>('[data-cabecalho-preview]')?.offsetHeight ?? 56) -
        12,
      behavior: 'instant',
    });
  }

  function editarSecao(secao: string) {
    requestAnimationFrame(() => {
      const campo = editorRef.current?.querySelector<HTMLElement>(
        `[data-campo-preview="${secao}"]`,
      );
      if (!campo) return;
      const bloco = campo.closest('details');
      if (bloco) bloco.open = true;
      campoEmFocoRef.current = campo;
      campo.scrollIntoView({ block: 'center', behavior: 'instant' });
      campo.focus({ preventScroll: true });
    });
  }

  return {
    editorRef,
    previewRef,
    secaoPreviewRef,
    campoEmFocoRef,
    mostrarSecaoPreview,
    voltarParaEdicao,
    editarSecao,
  };
}
