import { BookOpenCheck } from 'lucide-react';
import { VideoConteudo } from '../../_components/VideoConteudo';
import styles from './ProjetoGuiado.module.css';

export function CabecalhoMinicurso({
  titulo,
  resumo,
  categoria,
  totalAulas,
  tempoPreparacao,
  totalPassos,
  videoUrl,
  tituloVideo,
}: {
  titulo: string;
  resumo: string;
  categoria: string | null;
  totalAulas: number;
  tempoPreparacao: string;
  totalPassos: number;
  videoUrl: string | null;
  tituloVideo: string;
}) {
  return (
    <section className={styles.minicurso} aria-labelledby="titulo-projeto">
      <div className={styles.minicursoTexto}>
        <p className={styles.eyebrow}>
          {categoria ? `${categoria} · ` : ''}Minicurso + implementação
        </p>
        <h1 id="titulo-projeto">{titulo}</h1>
        <p className={styles.resumoCurso}>{resumo}</p>

        <dl className={styles.dadosCurso}>
          <div>
            <dt>Aulas</dt>
            <dd>{totalAulas}</dd>
          </div>
          <div>
            <dt>Preparação</dt>
            <dd>{tempoPreparacao}</dd>
          </div>
          <div>
            <dt>Execução</dt>
            <dd>{totalPassos} passos</dd>
          </div>
        </dl>
      </div>

      <div className={styles.aulaAbertura}>
        <header>
          <span aria-hidden="true">
            <BookOpenCheck size={17} strokeWidth={1.7} />
          </span>
          <div>
            <p>Assista antes de implementar</p>
            <h2>{tituloVideo}</h2>
          </div>
        </header>
        <VideoConteudo videoUrl={videoUrl} titulo={tituloVideo} />
      </div>
    </section>
  );
}
