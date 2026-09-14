'use client';

import { useLayoutEffect, useRef, useState } from 'react';

function recuouNaLeitura(lista: HTMLDivElement, ultimoFim: number) {
  return (
    lista.scrollTop + 32 < ultimoFim &&
    lista.scrollHeight - lista.clientHeight - lista.scrollTop > 32
  );
}

/** O fim visível autoriza acompanhar a conversa; ler acima nunca dispara scroll. */
export function useLeituraChat(aberto: boolean, quantidade: number) {
  const mensagens = useRef<HTMLDivElement>(null);
  const conteudo = useRef<HTMLDivElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const acompanhar = useRef(true);
  const posicao = useRef(0);
  const ultimoFim = useRef(0);
  const atual = useRef({ aberto: false, quantidade });
  const [lidas, setLidas] = useState(0);
  const [afastado, setAfastado] = useState(false);

  useLayoutEffect(() => {
    const abrindo = aberto && !atual.current.aberto;
    atual.current = { aberto, quantidade };
    const lista = mensagens.current;
    if (!aberto || !lista) return;
    if (abrindo && !acompanhar.current) lista.scrollTop = posicao.current;
    if (!acompanhar.current) return;
    // A pessoa pode rolar antes de o IntersectionObserver entregar seu evento.
    if (!abrindo && recuouNaLeitura(lista, ultimoFim.current)) {
      acompanhar.current = false;
      return;
    }
    lista.scrollTop = lista.scrollHeight;
    ultimoFim.current = lista.scrollTop;
    const frame = requestAnimationFrame(() => setLidas(quantidade));
    return () => cancelAnimationFrame(frame);
  }, [aberto, quantidade]);

  useLayoutEffect(() => {
    const lista = mensagens.current;
    const sentinela = fim.current;
    if (!aberto || !lista || !sentinela) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!atual.current.aberto) return;
        const noFim =
          Boolean(entrada?.isIntersecting) && !recuouNaLeitura(lista, ultimoFim.current);
        acompanhar.current = noFim;
        setAfastado(!noFim);
        if (noFim) {
          ultimoFim.current = lista.scrollTop;
          setLidas(atual.current.quantidade);
        }
      },
      // Uma linha de folga evita oscilar por arredondamento ou pelo último espaçamento.
      { root: lista, rootMargin: '0px 0px 32px 0px', threshold: 0 },
    );
    observer.observe(sentinela);
    const resize =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            if (!atual.current.aberto || !acompanhar.current) return;
            if (recuouNaLeitura(lista, ultimoFim.current)) {
              acompanhar.current = false;
              setAfastado(true);
              return;
            }
            lista.scrollTop = lista.scrollHeight;
            ultimoFim.current = lista.scrollTop;
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
    ultimoFim.current = lista.scrollTop;
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
