import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VideoConteudo } from '@/app/(app)/_components/VideoConteudo';
import { NavAula } from '@/app/(app)/formacoes/_components/NavAula';
import { PlaylistAula } from '@/app/(app)/formacoes/_components/PlaylistAula';
import { FORMACAO_DEMO } from '../formacoes/fixture';
import preview from '../aprendizado.module.css';
import styles from '@/app/(app)/formacoes/[slug]/aula/[aulaId]/pagina.module.css';

export const metadata: Metadata = { title: 'Preview · Aula' };

export default function PreviewAulaPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const aula = FORMACAO_DEMO.modulos[0]?.aulas[0];
  const proxima = FORMACAO_DEMO.modulos[0]?.aulas[1];
  if (!aula) notFound();

  return (
    <main className={preview.pagina}>
      <div className={styles.pagina}>
        <header className={styles.cabecalho}>
          <div className={styles.textos}>
            <p className={styles.eyebrow}>Aula 1 de 5</p>
            <h1 className={styles.titulo}>{aula.titulo}</h1>
            <p className={styles.duracao}>12 min</p>
          </div>
        </header>

        <div className={styles.grade}>
          <div className={styles.principal}>
            <VideoConteudo videoUrl={null} titulo={aula.titulo} />
            <NavAula
              formacaoSlug={FORMACAO_DEMO.slug}
              aulaId={aula.id}
              anteriorId={null}
              anteriorTitulo={null}
              proximaId={proxima?.id ?? null}
              proximaTitulo={proxima?.titulo ?? null}
            />
          </div>

          <PlaylistAula formacao={FORMACAO_DEMO} aulaAtualId={aula.id} />
        </div>
      </div>
    </main>
  );
}
