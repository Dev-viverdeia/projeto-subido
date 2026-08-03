import { Skeleton } from '@/design-system/via';
import styles from './EsqueletoCatalogo.module.css';

/**
 * Skeleton com a ANATOMIA do card real. Blob genérico lê como "quebrado"; este lê
 * como "o card está chegando". (Regra herdada da referência, e o motivo de o
 * loading.tsx não usar um spinner central.)
 *
 * ELE ACOMPANHOU A MUDANÇA DO CARD: o glifo saiu de 42 para 34 e passou a dividir
 * a primeira LINHA com a categoria, em vez de ficar empilhado acima dela.
 * Skeleton que descreve um card que não existe mais faz a tela pular no fim do
 * load — que é exatamente o defeito que ele existe para evitar.
 *
 * A barra de progresso NÃO entra aqui: ela só aparece em solução que a pessoa já
 * começou, e o skeleton não tem como saber quais. Prometer uma barra que não vem
 * seria pular ao contrário.
 */
function EsqueletoCartao() {
  return (
    <div className={styles.cartao} aria-hidden="true">
      <div className={styles.topo}>
        <Skeleton variant="rect" width={34} height={34} />
        <Skeleton variant="text" width="34%" />
      </div>
      <div className={styles.linhas}>
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
