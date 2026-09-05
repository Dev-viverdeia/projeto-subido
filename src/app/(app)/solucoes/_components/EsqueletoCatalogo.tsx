import { Skeleton } from '@/design-system/via';
import styles from './CatalogoProjetos.module.css';

/** Espelha o destaque e a grade reais, sem criar um estado visual paralelo. */
export function EsqueletoCatalogo() {
  return (
    <div className={styles.raiz} role="status" aria-label="Carregando projetos">
      <div className={styles.destaque} aria-hidden="true">
        <div className={styles.destaquePrincipal}>
          <div className={styles.destaqueIdentidade}>
            <span className={styles.iconeDestaque}>
              <Skeleton variant="rect" width={48} height={48} />
            </span>
            <span className={styles.rotuloDestaque}>
              <Skeleton width="32%" />
            </span>
          </div>
          <h3>
            <Skeleton variant="rect" width="72%" height={38} />
          </h3>
          <div className={styles.resultado}>
            <Skeleton width="92%" />
          </div>
        </div>
        <div className={styles.destaqueRodape}>
          <Skeleton width="42%" />
          <Skeleton variant="rect" width={172} height={44} />
        </div>
      </div>
      <section className={styles.outros} aria-hidden="true">
        <div className={styles.secaoCabecalho}>
          <h2>Outros projetos</h2>
        </div>
        <div className={styles.grade}>
          {Array.from({ length: 4 }, (_, indice) => (
            <div key={indice} className={styles.cartao}>
              <Skeleton width="36%" />
              <div className={styles.cartaoCorpo}>
                <Skeleton variant="rect" width="76%" height={30} />
                <Skeleton lines={2} />
              </div>
              <footer>
                <Skeleton width="34%" />
                <Skeleton width="32%" />
              </footer>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
