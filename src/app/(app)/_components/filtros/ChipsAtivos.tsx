'use client';

import styles from './ChipsAtivos.module.css';

export type ChipFiltro = { id: string; rotulo: string; aoRemover: () => void };

/**
 * A memória visível da régua: cada filtro aplicado vira um chip removível.
 * Sem isto, um filtro escolhido dentro do painel fica invisível depois que o
 * painel fecha — e o usuário esquece por que o catálogo "diminuiu".
 */
export function ChipsAtivos({
  chips,
  aoLimparTudo,
}: {
  chips: ChipFiltro[];
  aoLimparTudo: () => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div className={styles.trilho} aria-label="Filtros ativos">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={styles.chip}
          onClick={chip.aoRemover}
          aria-label={`Remover filtro ${chip.rotulo}`}
        >
          {chip.rotulo}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path
              d="m1.5 1.5 7 7m0-7-7 7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" className={styles.limparTudo} onClick={aoLimparTudo}>
          Limpar tudo
        </button>
      )}
    </div>
  );
}
