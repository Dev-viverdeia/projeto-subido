'use client';

import { useId, useState, type ReactNode } from 'react';
import styles from './HistoricoDropdown.module.css';

/**
 * O histórico vira DISCLOSURE: a tela inicial volta a ser só a pergunta, e os
 * projetos ficam a um clique, com a contagem à vista.
 *
 * A SEÇÃO é client; a GRADE continua server-rendered e chega por `children` —
 * é o padrão da casa (a interação ganha 'use client', o conteúdo não). Por isso
 * este arquivo não importa `Pill` nem os cards: só abre e fecha.
 *
 * FECHADO POR PADRÃO, e é decisão de composição: esta é uma tela de CRIAÇÃO, e
 * o histórico é o segundo assunto. O botão com a contagem diz que ele existe;
 * quem quer ver, abre — e o estado não persiste de propósito, porque a cada
 * visita a tela recomeça no assunto principal.
 *
 * A animação de abertura é opacity + translateY nos itens (nunca height — regra
 * da casa), com atraso em cascata lido de `--i`, que a grade server-rendered
 * carimba em cada item. `backwards` pelo motivo documentado em entrada.module.css.
 */
export function HistoricoDropdown({ total, children }: { total: number; children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();

  return (
    <div className={styles.dropdown}>
      <h2 className={styles.titulo}>
        <button
          type="button"
          className={styles.gatilho}
          aria-expanded={aberto}
          aria-controls={idPainel}
          onClick={() => setAberto((v) => !v)}
        >
          <span className={styles.rotulo}>Seus projetos</span>
          <span className={styles.total}>{total}</span>

          {/* Chevron inline, como na trilha do cabeçalho: importar lucide aqui
              arrastaria a biblioteca para o bundle de cliente por um glifo. */}
          <svg
            className={styles.seta}
            data-aberto={aberto ? '' : undefined}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m4 6 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </h2>

      {/* Desmonta ao fechar: a cascata roda de novo a cada abertura, e nenhum
          card fica no fluxo de tabulação de uma seção fechada. */}
      {aberto ? (
        <div id={idPainel} className={styles.painel}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
