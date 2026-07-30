'use client';

import Link from 'next/link';
import type { SolucaoResumo } from '@/lib/conteudo/queries';
import styles from './CartaoSolucao.module.css';

/**
 * Card editorial inteiramente tipográfico. Soluções não dependem de imagem,
 * screenshot ou ícone: categoria, título, resumo e metadados criam a hierarquia.
 *
 * Raiz é `<Link>`, não `<div onClick>` — ctrl+clique, botão do meio e "abrir em
 * nova aba" são de graça.
 */
export function CartaoSolucao({ solucao }: { solucao: SolucaoResumo }) {
  const ferramentas = solucao.ferramentas;
  const visiveis = ferramentas.slice(0, 2);
  const extras = ferramentas.length - visiveis.length;

  return (
    <Link href={`/solucoes/${solucao.slug}`} className={styles.cartao}>
      <p className={styles.categoria}>{solucao.categoria || 'Solução de IA'}</p>

      <h3 className={styles.titulo}>{solucao.titulo}</h3>
      {solucao.resumo && <p className={styles.resumo}>{solucao.resumo}</p>}

      {visiveis.length > 0 && (
        <div className={styles.ferramentas} aria-label="Ferramentas usadas">
          {visiveis.map((ferramenta) => (
            <span key={ferramenta} className={styles.ferramenta}>
              {ferramenta}
            </span>
          ))}
          {extras > 0 && <span className={styles.mais}>+{extras}</span>}
        </div>
      )}

      <span className={styles.vao} />

      <footer className={styles.rodape}>
        <span className={styles.metricas}>
          {solucao.etapas > 0 && <span className={styles.metrica}>{solucao.etapas} etapas</span>}
          {ferramentas.length > 0 && (
            <span className={styles.metrica}>
              {ferramentas.length} {ferramentas.length === 1 ? 'ferramenta' : 'ferramentas'}
            </span>
          )}
        </span>
        <span className={styles.abrir} aria-hidden="true">
          Ver solução
        </span>
      </footer>
    </Link>
  );
}
