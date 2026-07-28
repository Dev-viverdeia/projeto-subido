import { Skeleton } from '@/design-system/via';
import styles from './EsqueletoCatalogo.module.css';

/**
 * Skeleton com a ANATOMIA do card real — glifo, eyebrow, duas linhas de título,
 * duas de resumo, rodapé. Blob genérico lê como "quebrado"; este lê como
 * "o card está chegando". (Regra herdada da referência, e o motivo de o
 * loading.tsx não usar um spinner central.)
 */
function EsqueletoCartao() {
  return (
    <div className={styles.cartao} aria-hidden="true">
      <Skeleton variant="rect" width={42} height={42} />
      <div className={styles.linhas}>
        <Skeleton variant="text" width="34%" />
        <Skeleton variant="text" width="88%" />
        <Skeleton variant="text" width="64%" />
      </div>
      <div className={styles.rodape}>
        <Skeleton variant="text" width="42%" />
      </div>
    </div>
  );
}

export function EsqueletoCatalogo({ cartoes = 6 }: { cartoes?: number }) {
  return (
    <div className={styles.grade} role="status" aria-label="Carregando o catálogo">
      {Array.from({ length: cartoes }, (_, i) => (
        <EsqueletoCartao key={i} />
      ))}
    </div>
  );
}
