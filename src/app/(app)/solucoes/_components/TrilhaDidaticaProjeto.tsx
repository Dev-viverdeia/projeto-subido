import {
  BookOpenCheck,
  BookOpenText,
  CheckCircle2,
  Clapperboard,
  Clock3,
  ExternalLink,
  FileText,
  ListChecks,
  Network,
} from 'lucide-react';
import type { RoteiroProjeto } from '@/lib/projetos/roteiro';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import { VideoConteudo } from '../../_components/VideoConteudo';
import styles from './TrilhaDidaticaProjeto.module.css';

type Trilha = NonNullable<RoteiroProjeto['trilhaDidatica']>;

const ROTULOS_RECURSO = {
  mapa_mental: { rotulo: 'Mapa mental', Icone: Network },
  quiz: { rotulo: 'Quiz', Icone: ListChecks },
  ebook: { rotulo: 'E-book', Icone: BookOpenText },
  modelo: { rotulo: 'Modelo', Icone: FileText },
} as const;

export function TrilhaDidaticaProjeto({
  trilha,
  videoAberturaUrl,
}: {
  trilha: Trilha;
  videoAberturaUrl?: string | null;
}) {
  const videosComplementares = trilha.videosReferencia.filter(
    (video) => video.videoUrl !== videoAberturaUrl,
  );
  const totalRecursos = trilha.aulas.reduce(
    (total, aula) => total + (aula.recursos?.length ?? 0),
    0,
  );

  return (
    <section className={styles.raiz} aria-labelledby="trilha-didatica-titulo">
      <header className={styles.cabecalho}>
        <div>
          <p>Antes de implementar</p>
          <h2 id="trilha-didatica-titulo">Aprenda como este projeto funciona</h2>
          <span>
            Cada aula termina com uma tarefa objetiva e materiais para usar na implementação.
          </span>
        </div>
        <div className={styles.tempo}>
          <Clock3 size={16} aria-hidden="true" />
          <span>
            Tempo de preparação
            <strong>{trilha.tempoTotal}</strong>
          </span>
        </div>
      </header>

      <ol className={styles.mapa} aria-label="Sequência da preparação">
        <li>
          <span>01</span>
          <BookOpenCheck size={18} aria-hidden="true" />
          <div>
            <strong>Aprenda</strong>
            <small>
              {trilha.aulas.length} aulas · {totalRecursos} recursos
            </small>
          </div>
        </li>
        <li>
          <span>02</span>
          <Clapperboard size={18} aria-hidden="true" />
          <div>
            <strong>Observe</strong>
            <small>1 caso ponta a ponta</small>
          </div>
        </li>
        <li>
          <span>03</span>
          <FileText size={18} aria-hidden="true" />
          <div>
            <strong>Implemente</strong>
            <small>{trilha.materiais.length} modelos copiáveis</small>
          </div>
        </li>
      </ol>

      <div className={styles.aprendizado}>
        <section className={styles.aulas} aria-labelledby="aulas-campo-titulo">
          <header className={styles.blocoCabecalho}>
            <span>Aulas de campo</span>
            <h3 id="aulas-campo-titulo">Aulas deste projeto</h3>
          </header>

          <div className={styles.listaAulas}>
            {trilha.aulas.map((aula, indice) => (
              <details key={aula.titulo} open={indice === 0}>
                <summary>
                  <span className={styles.indice}>{String(indice + 1).padStart(2, '0')}</span>
                  <span className={styles.tituloAula}>
                    <strong>{aula.titulo}</strong>
                    <small>{aula.objetivo}</small>
                  </span>
                  <span className={styles.duracao}>{aula.duracao}</span>
                </summary>

                <div className={styles.corpoAula}>
                  <div>
                    <h4>Você precisa dominar</h4>
                    <ul>
                      {aula.topicos.map((topico) => (
                        <li key={topico}>{topico}</li>
                      ))}
                    </ul>
                  </div>
                  <dl>
                    <div>
                      <dt>Faça agora</dt>
                      <dd>{aula.exercicio}</dd>
                    </div>
                    <div>
                      <dt>Avance quando</dt>
                      <dd>{aula.prontoQuando}</dd>
                    </div>
                  </dl>

                  {(aula.recursos ?? []).length > 0 ? (
                    <section className={styles.recursosAula} aria-label="Recursos desta aula">
                      <h4>Recursos desta aula</h4>
                      <div>
                        {(aula.recursos ?? []).map((recurso) => {
                          const { rotulo, Icone } = ROTULOS_RECURSO[recurso.tipo];
                          return (
                            <article key={recurso.titulo}>
                              <span className={styles.iconeRecurso} aria-hidden="true">
                                <Icone size={17} strokeWidth={1.7} />
                              </span>
                              <div>
                                <small>{rotulo}</small>
                                <strong>{recurso.titulo}</strong>
                                <p>{recurso.descricao}</p>
                                {recurso.url ? (
                                  <a href={recurso.url} target="_blank" rel="noreferrer">
                                    Abrir recurso <ExternalLink size={13} aria-hidden="true" />
                                  </a>
                                ) : null}
                                {recurso.conteudo ? (
                                  <details>
                                    <summary>Abrir recurso</summary>
                                    <pre>{recurso.conteudo}</pre>
                                  </details>
                                ) : null}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.demonstracao} aria-labelledby="demonstracao-titulo">
          <header className={styles.blocoCabecalho}>
            <span>Demonstração prática</span>
            <h3 id="demonstracao-titulo">{trilha.demonstracao.titulo}</h3>
            <p>{trilha.demonstracao.contexto}</p>
          </header>

          <ol className={styles.fluxo}>
            {trilha.demonstracao.passos.map((passo, indice) => (
              <li key={`${passo.etapa}-${indice}`}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{passo.etapa}</strong>
                  <p>{passo.oQueAcontece}</p>
                  <small>Ao terminar · {passo.evidencia}</small>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.resultado}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <p>
              <strong>O caso está aprovado quando</strong>
              {trilha.demonstracao.resultadoEsperado}
            </p>
          </div>
        </section>
      </div>

      {videosComplementares.length > 0 ? (
        <section className={styles.videos} aria-labelledby="videos-referencia-titulo">
          <header className={styles.blocoCabecalho}>
            <span>Exemplo de entrega</span>
            <h3 id="videos-referencia-titulo">Veja como o projeto funciona antes de construir</h3>
          </header>
          <div className={styles.gradeVideos}>
            {videosComplementares.map((video, indice) => (
              <article key={video.videoUrl}>
                <div className={styles.videoTexto}>
                  <span>{String(indice + 1).padStart(2, '0')}</span>
                  <div>
                    <h4>{video.titulo}</h4>
                    <p>{video.descricao}</p>
                  </div>
                </div>
                <VideoConteudo videoUrl={video.videoUrl} titulo={video.titulo} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.materiais} aria-labelledby="materiais-campo-titulo">
        <header className={styles.blocoCabecalho}>
          <span>Kit de campo</span>
          <h3 id="materiais-campo-titulo">Modelos para usar com o cliente</h3>
          <p>Copie, adapte e salve cada documento no projeto do cliente.</p>
        </header>

        <div className={styles.gradeMateriais}>
          {trilha.materiais.map((material, indice) => (
            <article key={material.titulo}>
              <header>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <h4>{material.titulo}</h4>
                  <p>{material.quandoUsar}</p>
                </div>
                <BotaoCopiar texto={material.conteudo} rotuloDoQue={material.titulo} />
              </header>
              <details>
                <summary>Ver modelo completo</summary>
                <pre>{material.conteudo}</pre>
              </details>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
