import type { FormacaoCompleta } from '@/lib/conteudo/queries';
import { VideoConteudo } from '../../_components/VideoConteudo';
import { formatarDuracao } from '../../_components/tempo';
import { NavAula } from './NavAula';
import { PlaylistAula } from './PlaylistAula';
import styles from '../[slug]/aula/[aulaId]/pagina.module.css';

type Aula = FormacaoCompleta['modulos'][number]['aulas'][number];

/** Mesma composição em produção e na bancada visual, inclusive no shell mobile. */
export function AulaConteudo({
  formacao,
  aula,
  videoUrl,
  anterior,
  proxima,
  posicao,
  total,
}: {
  formacao: FormacaoCompleta;
  aula: Aula;
  videoUrl: string | null;
  anterior: Pick<Aula, 'id' | 'titulo'> | null;
  proxima: Pick<Aula, 'id' | 'titulo'> | null;
  posicao: number;
  total: number;
}) {
  const duracao = formatarDuracao(aula.duracao_seg);
  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <div className={styles.textos}>
          <p className={styles.eyebrow}>
            Aula {posicao} de {total}
            {duracao ? ` · ${duracao}` : ''}
          </p>
          <h1 className={styles.titulo}>{aula.titulo}</h1>
        </div>
      </header>
      <div className={styles.grade}>
        <div className={styles.principal}>
          <VideoConteudo videoUrl={videoUrl} titulo={aula.titulo} />
          <NavAula
            formacaoSlug={formacao.slug}
            aulaId={aula.id}
            anteriorId={anterior?.id ?? null}
            anteriorTitulo={anterior?.titulo ?? null}
            proximaId={proxima?.id ?? null}
            proximaTitulo={proxima?.titulo ?? null}
          />
        </div>
        <PlaylistAula formacao={formacao} aulaAtualId={aula.id} />
      </div>
    </div>
  );
}
