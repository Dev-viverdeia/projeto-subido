'use client';

import { useRouter } from 'next/navigation';
import styles from './BotaoVoltar.module.css';

/**
 * Voltar que PRESERVA os filtros: se há histórico, `router.back()` devolve o
 * usuário à listagem exatamente como ele a deixou (os filtros vivem na URL).
 * Deep-link sem histórico cai no fallback limpo.
 */
export function BotaoVoltar({ fallback, rotulo }: { fallback: string; rotulo: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.voltar}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M7.5 2 3.5 6l4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {rotulo}
    </button>
  );
}
