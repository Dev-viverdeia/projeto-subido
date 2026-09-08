import { ChevronDown, PackageCheck, Users } from 'lucide-react';
import type { DadosRoteiroProjeto } from '@/lib/conteudo/queries';
import { obterVisaoVisual } from '@/lib/projetos/visao-visual';
import { VideoConteudo } from '../../_components/VideoConteudo';
import { FluxoProjeto } from './FluxoProjeto';
import styles from './VisaoProjeto.module.css';

export function VisaoProjeto({
  slug,
  titulo,
  projeto,
  videoUrl,
}: {
  slug: string;
  titulo: string;
  projeto: DadosRoteiroProjeto;
  videoUrl: string | null;
}) {
  const referencia = projeto.roteiro.trilhaDidatica?.videosReferencia[0];
  const visao = obterVisaoVisual(slug);
  return (
    <div className={styles.visao}>
      <div className={styles.visaoGrade}>
        <section className={styles.aberturaVideo} aria-label="Vídeo do projeto">
          <header className={styles.tituloSecao}>
            <h2>
              {videoUrl
                ? 'Conheça o projeto'
                : referencia
                  ? 'Vídeo de referência'
                  : 'Vídeo do projeto'}
            </h2>
          </header>
          <VideoConteudo
            videoUrl={videoUrl ?? referencia?.videoUrl ?? null}
            titulo={videoUrl ? titulo : (referencia?.titulo ?? titulo)}
          />
          <div className={styles.dadosVideo}>
            {projeto.roteiro.trilhaDidatica ? (
              <span>
                {projeto.roteiro.trilhaDidatica.aulas.length} aulas ·{' '}
                {projeto.roteiro.trilhaDidatica.tempoTotal}
              </span>
            ) : (
              <span>Implementação guiada</span>
            )}
            {projeto.roteiro.perfil ? <span>Projeto: {projeto.roteiro.perfil.prazo}</span> : null}
          </div>
        </section>
        {visao ? (
          <FluxoProjeto visao={visao} />
        ) : (
          <section className={styles.resultadoFallback}>
            <h2>O que você vai construir</h2>
            <p>{projeto.resultado}</p>
          </section>
        )}
      </div>
      <div className={styles.consultas}>
        <details>
          <summary>
            <Users size={22} aria-hidden="true" />
            <span>Para qual cliente</span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <p>{projeto.clienteIdeal}</p>
        </details>
        <details>
          <summary>
            <PackageCheck size={22} aria-hidden="true" />
            <span>O que você entrega</span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <p>{projeto.entregavelFinal}</p>
        </details>
      </div>
    </div>
  );
}
