'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SolucaoResumo } from '@/lib/conteudo/queries';
import styles from './CartaoSolucao.module.css';

/**
 * Card do catálogo de soluções — SEM capa, de propósito. O texto carrega o card
 * (decisão herdada da plataforma de referência), e a categoria entra como
 * intensidade de navy no chip-glifo, nunca como cor nova.
 *
 * O `icone` chega JÁ RENDERIZADO do servidor (padrão navegacao.tsx): este arquivo
 * é client por viver dentro da grade animada, e importar lucide aqui arrastaria a
 * biblioteca para o bundle.
 *
 * Raiz é `<Link>`, não `<div onClick>` — ctrl+clique, botão do meio e "abrir em
 * nova aba" são de graça.
 */
export function CartaoSolucao({ solucao, icone }: { solucao: SolucaoResumo; icone: ReactNode }) {
  const ferramentas = solucao.ferramentas;
  const visiveis = ferramentas.slice(0, 3);
  const extras = ferramentas.length - visiveis.length;

  return (
    <Link href={`/solucoes/${solucao.slug}`} className={styles.cartao}>
      <span className={styles.glifo} aria-hidden="true">
        {icone}
      </span>

      {solucao.categoria && <p className={styles.eyebrow}>{solucao.categoria}</p>}

      <h3 className={styles.titulo}>{solucao.titulo}</h3>
      {solucao.resumo && <p className={styles.resumo}>{solucao.resumo}</p>}

      {visiveis.length > 0 && (
        <p className={styles.ferramentas}>
          {visiveis.join(' · ')}
          {extras > 0 && <span className={styles.mais}> +{extras}</span>}
        </p>
      )}

      <span className={styles.vao} />
      <hr className={styles.fio} />

      <footer className={styles.rodape}>
        <span className={styles.contagens}>
          {solucao.etapas > 0 && `${solucao.etapas} etapas`}
          {solucao.etapas > 0 && ferramentas.length > 0 && ' · '}
          {ferramentas.length > 0 &&
            `${ferramentas.length} ${ferramentas.length === 1 ? 'ferramenta' : 'ferramentas'}`}
        </span>
        <span className={styles.abrir} aria-hidden="true">
          Abrir →
        </span>
      </footer>
    </Link>
  );
}
