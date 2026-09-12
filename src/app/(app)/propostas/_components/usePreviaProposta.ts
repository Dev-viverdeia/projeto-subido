'use client';

import { useLayoutEffect, useRef, useState } from 'react';

export function usePreviaProposta() {
  const editorRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const secaoPreviewRef = useRef('cliente');
  const campoEmFocoRef = useRef<HTMLElement | null>(null);
  const [painelAtivo, setPainelAtivo] = useState<'editar' | 'preview'>('editar');
  const [destino, setDestino] = useState<{ painel: 'editar' | 'preview'; secao?: string } | null>(
    null,
  );

  function voltarParaEdicao() {
    setPainelAtivo('editar');
    setDestino({ painel: 'editar' });
  }
  function verPrevia() {
    setPainelAtivo('preview');
    setDestino({ painel: 'preview' });
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
    setPainelAtivo('editar');
    setDestino({ painel: 'editar', secao });
  }

  // O foco só muda depois que React tornou o painel visível. Um rAF pode executar
  // antes desse commit, sobretudo no WebKit, e tentar focar um campo oculto.
  useLayoutEffect(() => {
    if (!destino) return;
    if (destino.painel === 'preview') {
      mostrarSecaoPreview(secaoPreviewRef.current, true);
      return;
    }
    const campo = destino.secao
      ? editorRef.current?.querySelector<HTMLElement>(`[data-campo-preview="${destino.secao}"]`)
      : campoEmFocoRef.current;
    if (!campo?.isConnected) return;
    const bloco = campo.closest('details');
    if (bloco) bloco.open = true;
    campoEmFocoRef.current = campo;
    campo.scrollIntoView({ block: 'center', behavior: 'instant' });
    campo.focus({ preventScroll: true });
  }, [destino]);

  return {
    editorRef,
    previewRef,
    secaoPreviewRef,
    campoEmFocoRef,
    mostrarSecaoPreview,
    voltarParaEdicao,
    editarSecao,
    painelAtivo,
    verPrevia,
  };
}
