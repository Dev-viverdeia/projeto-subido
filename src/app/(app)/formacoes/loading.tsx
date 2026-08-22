import { Skeleton, Spinner } from '@/design-system/via';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import styles from './carregando.module.css';
import pagina from './pagina.module.css';

export default function CarregandoFormacoes() {
  return (
    <div className={pagina.pagina} aria-live="polite" aria-busy="true">
      <CabecalhoPagina titulo="Formações" oculto />

      <section className={styles.hero} role="status" aria-label="Carregando suas formações">
        <div className={styles.heroTexto}>
          <span className={styles.sinal} aria-hidden="true">
            <Spinner size="md" tone="navy" />
          </span>
          <div>
            <p>Preparando sua trilha profissional</p>
            <strong>Carregando aulas e seu progresso.</strong>
          </div>
        </div>
        <div className={styles.heroApoio} aria-hidden="true">
          <Skeleton variant="text" width="82%" />
          <Skeleton variant="text" width="68%" />
          <Skeleton variant="text" width="74%" />
        </div>
      </section>

      <section className={styles.trilha} aria-hidden="true">
        <div className={styles.cabecalho}>
          <div>
            <Skeleton variant="text" width="160px" />
            <Skeleton variant="text" width="280px" />
          </div>
          <Skeleton variant="text" width="340px" />
        </div>

        <div className={styles.proxima}>
          <div>
            <Skeleton variant="text" width="132px" />
            <Skeleton variant="text" width="260px" />
          </div>
          <Skeleton variant="text" width="150px" />
        </div>

        <div className={styles.grade}>
          {Array.from({ length: 4 }, (_, indice) => (
            <div key={indice} className={styles.cartao}>
              <Skeleton variant="rect" width="100%" height="100%" />
              <div className={styles.cartaoCorpo}>
                <Skeleton variant="text" width="44%" />
                <Skeleton variant="text" width="78%" />
                <Skeleton variant="text" width="92%" />
                <Skeleton variant="text" width="68%" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
