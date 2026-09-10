import { useEffect, useRef, type RefObject } from 'react';

const EVENTO_BUSCA = 'sobral:busca-mensagem';
type DestinoBusca = { conversa: string; mensagem: string; termo: string };

/** Contexto transitório do salto: não grava o texto buscado na URL ou no armazenamento. */
export function anunciarBuscaMensagem(conversa: string, mensagem: string, termo: string) {
  window.dispatchEvent(
    new CustomEvent<DestinoBusca>(EVENTO_BUSCA, { detail: { conversa, mensagem, termo } }),
  );
}

/** Move apenas a leitura do chat, nunca a página nem o compositor. */
export function focarMensagem(id: string, termo = '') {
  const mensagem = document.getElementById(`sobral-mensagem-${id}`);
  const leitura = mensagem?.closest<HTMLElement>('[data-leitura-conversa]');
  if (!mensagem || !leitura) return false;
  leitura
    .querySelectorAll('[data-trecho-encontrado]')
    .forEach((p) => p.removeAttribute('data-trecho-encontrado'));
  // Abre só o texto da resposta, nunca recomendações, transcrições ou outros painéis.
  mensagem.querySelectorAll<HTMLDetailsElement>('[data-texto-resposta] details').forEach((d) => {
    d.open = true;
  });
  const paragrafo = termo
    ? [
        ...mensagem.querySelectorAll<HTMLElement>('[data-texto-resposta] p, [data-texto-usuario]'),
      ].find((p) => p.textContent?.toLowerCase().includes(termo.toLowerCase()))
    : undefined;
  paragrafo?.setAttribute('data-trecho-encontrado', '');
  const alvo = paragrafo ?? mensagem;
  leitura.scrollTo({
    top:
      leitura.scrollTop +
      alvo.getBoundingClientRect().top -
      leitura.getBoundingClientRect().top -
      16,
    behavior: 'instant',
  });
  mensagem.focus({ preventScroll: true });
  return true;
}

export function useFocoConversa(
  leituraRef: RefObject<HTMLDivElement | null>,
  conversa?: string,
  mensagem?: string,
) {
  const busca = useRef<DestinoBusca | null>(null);
  useEffect(() => {
    function receber(evento: Event) {
      const destino = (evento as CustomEvent<DestinoBusca>).detail;
      if (destino.conversa === conversa) busca.current = destino;
    }
    window.addEventListener(EVENTO_BUSCA, receber);
    return () => {
      window.removeEventListener(EVENTO_BUSCA, receber);
      busca.current = null;
    };
  }, [conversa]);
  useEffect(() => {
    if (!conversa) return;
    if (
      mensagem &&
      focarMensagem(mensagem, busca.current?.mensagem === mensagem ? busca.current.termo : '')
    )
      return;
    const leitura = leituraRef.current;
    if (!leitura) return;
    const ultimaResposta = leitura.querySelector('[data-resposta-sobral]:last-child');
    leitura.scrollTo({
      top: ultimaResposta
        ? leitura.scrollTop +
          ultimaResposta.getBoundingClientRect().top -
          leitura.getBoundingClientRect().top
        : leitura.scrollHeight,
      behavior: 'instant',
    });
  }, [leituraRef, conversa, mensagem]);
}
