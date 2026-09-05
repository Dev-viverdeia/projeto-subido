import { Skeleton } from '@/design-system/via';
import styles from './pagina.module.css';

export default function CarregandoMetricas() {
  return (
    <div className={styles.pagina}>
      <header className={styles.hero}>
        <h1>Métricas</h1>
        <p className={styles.nota} role="status">
          Carregando métricas…
        </p>
      </header>
      <div className={styles.principal} aria-hidden="true">
        <div className={styles.funil}>
          <Skeleton width="45%" height={24} />
          <div className={styles.etapas}>
            {Array.from({ length: 5 }, (_, i) => (
              <div className={styles.linhaCarregando} key={i}>
                <Skeleton width="40%" height={24} />
                <Skeleton variant="rect" width="100%" height={10} />
              </div>
            ))}
          </div>
          <Skeleton width="80%" height={18} />
          <div className={styles.resultados}>
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        </div>
        <div className={styles.acompanhamento}>
          <div className={styles.diagnostico}>
            <Skeleton width="40%" height={20} />
            <Skeleton width="90%" height={34} />
            <Skeleton width="100%" lines={2} />
            <Skeleton width="55%" height={44} />
          </div>
          <div className={styles.saude}>
            <Skeleton width="100%" height={160} />
          </div>
        </div>
      </div>
    </div>
  );
}
