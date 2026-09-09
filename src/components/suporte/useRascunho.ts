'use client';
import { useSyncExternalStore } from 'react';

const evento = 'subido-suporte-rascunho';
function assinar(callback: () => void) {
  window.addEventListener(evento, callback);
  return () => window.removeEventListener(evento, callback);
}
/** Só nesta sessão e separado por identidade. Nunca persiste arquivos. */
export function useRascunho(chave: string) {
  const ler = () => {
    try {
      return sessionStorage.getItem(chave) ?? '';
    } catch {
      return '';
    }
  };
  const valor = useSyncExternalStore(assinar, ler, () => '');
  function salvar(texto: string) {
    try {
      if (texto) sessionStorage.setItem(chave, texto);
      else sessionStorage.removeItem(chave);
      window.dispatchEvent(new Event(evento));
    } catch {
      /* O formulário continua disponível sem armazenamento. */
    }
  }
  return [valor, salvar] as const;
}
