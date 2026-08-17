import { Skeleton } from '@/design-system/via';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { EstadoCarregamento } from '../_components/EstadoCarregamento';
import styles from './carregando.module.css';
import pagina from './pagina.module.css';

/** Skeleton com a anatomia do pôster 3:4 — o card real troca de lugar sem pulo. */
export default function CarregandoFormacoes() {
  return (
    <div className={pagina.pagina}>
      <CabecalhoPagina titulo="Formações" oculto />
      <EstadoCarregamento
        titulo="Preparando suas formações"
        descricao="Carregando aulas, progresso e próximos conteúdos."
      />
      <div className={styles.grade} role="status" aria-label="Carregando as formações">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={styles.poster} aria-hidden="true">
            <div className={styles.capa}>
              <Skeleton variant="rect" width="100%" height="100%" />
            </div>
            <div className={styles.corpo}>
              <Skeleton variant="text" width="82%" />
              <Skeleton variant="text" width="48%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
