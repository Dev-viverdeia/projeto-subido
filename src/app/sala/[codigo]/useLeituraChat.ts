'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/** O fim visível autoriza acompanhar a conversa; ler acima nunca dispara scroll. */
export function useLeituraChat(aberto: boolean, quantidade: number) {
  const mensagens = useRef<HTMLDivElement>(null);
  const conteudo = useRef<HTMLDivElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const acompanhar = useRef(true);
  const posicao = useRef(0);
  const atual = useRef({ aberto, quantidade });
  const [lidas, setLidas] = useState(0);
  const [afastado, setAfastado] = useState(false);

  useLayoutEffect(() => {
    atual.current = { aberto, quantidade };
    const lista = mensagens.current;
    if (!aberto || !lista || !acompanhar.current) return;
    lista.scrollTop = lista.scrollHeight;
    const frame = requestAnimationFrame(() => setLidas(quantidade));
    return () => cancelAnimationFrame(frame);
  }, [aberto, quantidade]);

  useLayoutEffect(() => {
    const lista = mensagens.current;
    const sentinela = fim.current;
    if (!aberto || !lista || !sentinela) return;
    lista.scrollTop = acompanhar.current ? lista.scrollHeight : posicao.current;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!atual.current.aberto) return;
        const noFim = Boolean(entrada?.isIntersecting);
        acompanhar.current = noFim;
        setAfastado(!noFim);
        if (noFim) setLidas(atual.current.quantidade);
      },
      // Uma linha de folga evita oscilar por arredondamento ou pelo último espaçamento.
      { root: lista, rootMargin: '0px 0px 32px 0px', threshold: 0 },
    );
    observer.observe(sentinela);
    const resize =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            if (atual.current.aberto && acompanhar.current) lista.scrollTop = lista.scrollHeight;
          });
    resize?.observe(lista);
    if (conteudo.current) resize?.observe(conteudo.current);
    return () => {
      observer.disconnect();
      resize?.disconnect();
    };
  }, [aberto]);

  function guardarPosicao() {
    if (mensagens.current) posicao.current = mensagens.current.scrollTop;
  }

  function irParaRecentes() {
    const lista = mensagens.current;
    // Um envio pode terminar depois que a pessoa já fechou o painel.
    if (!atual.current.aberto || !lista) return;
    acompanhar.current = true;
    setAfastado(false);
    setLidas(atual.current.quantidade);
    lista.scrollTop = lista.scrollHeight;
  }

  return {
    mensagens,
    conteudo,
    fim,
    afastado,
    novas: Math.max(0, quantidade - lidas),
    guardarPosicao,
    irParaRecentes,
  };
}
