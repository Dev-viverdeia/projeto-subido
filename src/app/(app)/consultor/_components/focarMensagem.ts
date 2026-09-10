import { useEffect, type RefObject } from 'react';

/** Move apenas a leitura do chat, nunca a página nem o compositor. */
export function focarMensagem(id: string) {
  const mensagem = document.getElementById(`sobral-mensagem-${id}`);
  const leitura = mensagem?.closest<HTMLElement>('[data-leitura-conversa]');
  if (!mensagem || !leitura) return false;
  leitura.scrollTo({
    top:
      leitura.scrollTop +
      mensagem.getBoundingClientRect().top -
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
  useEffect(() => {
    if (!conversa) return;
    if (mensagem && focarMensagem(mensagem)) return;
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
