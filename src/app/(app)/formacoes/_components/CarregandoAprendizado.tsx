import { Skeleton } from '@/design-system/via';
import curso from './CursoConteudo.module.css';
import curriculo from './CurriculoCurso.module.css';
import aula from '../[slug]/aula/[aulaId]/pagina.module.css';
import styles from './CarregandoAprendizado.module.css';

/** Cada rota mantém a geometria do destino, sem voltar ao catálogo enquanto espera. */
export function CarregandoCurso() {
  return (
    <div className={curso.raiz} role="status" aria-busy="true" aria-label="Carregando formação">
      <span className="sr-only">Carregando formação…</span>
      <div className={curso.apresentacao} aria-hidden="true">
        <div className={curso.hero}>
          <div className={curso.heroTexto}>
            <Skeleton width={110} />
            <Skeleton variant="rect" width="85%" height={40} />
            <Skeleton width="95%" lines={2} />
            <Skeleton width="45%" />
          </div>
          <div className={curso.progressoResumo}>
            <Skeleton width="100%" lines={3} />
          </div>
        </div>
        <div className={curso.retomada}>
          <div className={curso.retomadaTexto}>
            <Skeleton width={130} />
            <Skeleton variant="rect" width="90%" height={24} />
          </div>
          <Skeleton variant="rect" width={180} height={44} />
        </div>
      </div>
      <div className={curso.curriculo} aria-hidden="true">
        <Skeleton variant="rect" width="min(70%, 260px)" height={28} />
        <div className={curriculo.lista}>
          {[0, 1, 2].map((item) => (
            <div key={item} className={curriculo.modulo}>
              <div className={styles.modulo}>
                <Skeleton variant="rect" width={36} height={36} />
                <Skeleton width="65%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CarregandoAula() {
  return (
    <div className={aula.pagina} role="status" aria-busy="true" aria-label="Carregando aula">
      <span className="sr-only">Carregando aula…</span>
      <div className={aula.textos} aria-hidden="true">
        <Skeleton variant="rect" width="85%" height={36} />
        <Skeleton width={160} />
      </div>
      <div className={aula.grade} aria-hidden="true">
        <div className={aula.principal}>
          <div className={styles.video}>
            <Skeleton variant="rect" width="100%" height="100%" />
          </div>
          <Skeleton variant="rect" width="100%" height={68} />
        </div>
        <div className={styles.playlist}>
          <Skeleton width="60%" />
          <Skeleton variant="rect" width="100%" height={240} />
        </div>
      </div>
    </div>
  );
}
