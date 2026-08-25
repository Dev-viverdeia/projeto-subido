'use client';

import {
  ArrowDown,
  BookOpenCheck,
  BookOpenText,
  Check,
  CheckCircle2,
  Clapperboard,
  Clock3,
  ExternalLink,
  FileText,
  ListChecks,
  Network,
} from 'lucide-react';
import type { RoteiroProjeto } from '@/lib/projetos/roteiro';
import { idAulaProjeto } from '@/lib/projetos/roteiro';
import { useAcoesProgresso, useProgresso } from '@/lib/progresso/local';
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
  slug,
  trilha,
  videoAberturaUrl,
}: {
  slug: string;
  trilha: Trilha;
  videoAberturaUrl?: string | null;
}) {
  const progresso = useProgresso();
  const { alternarEtapa } = useAcoesProgresso();
  const idsAulas = trilha.aulas.map((_, indice) => idAulaProjeto(slug, indice));
  const aulasConcluidas = idsAulas.filter((id) => Boolean(progresso.etapas[id])).length;
  const proximaAulaIndice = idsAulas.findIndex((id) => !progresso.etapas[id]);
  const porcentagem = Math.round((aulasConcluidas / trilha.aulas.length) * 100);
  const aprendizadoConcluido = aulasConcluidas === trilha.aulas.length;
  const videosComplementares = trilha.videosReferencia.filter(
    (video) => video.videoUrl !== videoAberturaUrl,
  );
  const totalRecursos = trilha.aulas.reduce(
    (total, aula) => total + (aula.recursos?.length ?? 0),
    0,
  );

  return (
    <section
      id="aprendizado-projeto"
      className={styles.raiz}
      aria-labelledby="trilha-didatica-titulo"
    >
      <header className={styles.cabecalho}>
        <div>
          <p>Parte 1 · Aprendizado</p>
          <h2 id="trilha-didatica-titulo">Aprenda como este projeto funciona</h2>
          <span>
            Conclua as aulas, use os modelos e entre na implementação sabendo o que precisa
            construir para o cliente.
          </span>
        </div>
        <div className={styles.painelProgresso}>
          <div className={styles.tempo}>
            <Clock3 size={16} aria-hidden="true" />
            <span>
              Tempo de preparação
              <strong>{trilha.tempoTotal}</strong>
            </span>
          </div>
          <div className={styles.progressoAprendizado}>
            <span>
              <strong>{aulasConcluidas}</strong> de {trilha.aulas.length} aulas
            </span>
            <span
              className={styles.barraAprendizado}
              role="progressbar"
              aria-label="Progresso do aprendizado"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={porcentagem}
            >
              <span style={{ transform: `scaleX(${porcentagem / 100})` }} />
            </span>
          </div>
        </div>
      </header>

      <ol className={styles.mapa} aria-label="Sequência da preparação">
        <li data-concluida={aprendizadoConcluido || undefined}>
          <span>01</span>
          {aprendizadoConcluido ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <BookOpenCheck size={18} aria-hidden="true" />
          )}
          <div>
            <strong>{aprendizadoConcluido ? 'Aulas concluídas' : 'Aprenda'}</strong>
            <small>
              {aprendizadoConcluido
                ? `${trilha.aulas.length} aulas concluídas`
                : `${trilha.aulas.length} aulas · ${totalRecursos} recursos`}
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

      {aprendizadoConcluido ? (
        <aside className={styles.aprendizadoConcluido} aria-label="Aprendizado concluído">
          <span className={styles.iconeAprendizadoConcluido} aria-hidden="true">
            <Check size={18} />
          </span>
          <div>
            <strong>Aprendizado concluído</strong>
            <p>
              As aulas continuam disponíveis para consulta. Agora use o caso, os modelos e as cinco
              fases para implementar com um cliente.
            </p>
          </div>
          <a href="#implementacao-projeto">
            Ir para implementação <ArrowDown size={15} aria-hidden="true" />
          </a>
        </aside>
      ) : null}

      <div className={styles.aprendizado}>
        <section className={styles.aulas} aria-labelledby="aulas-campo-titulo">
          <header className={styles.blocoCabecalho}>
            <span>Aulas de campo</span>
            <h3 id="aulas-campo-titulo">Aulas deste projeto</h3>
          </header>

          <div className={styles.listaAulas}>
            {trilha.aulas.map((aula, indice) => (
              <details
                key={aula.titulo}
                open={indice === proximaAulaIndice}
                data-concluida={Boolean(progresso.etapas[idsAulas[indice]!]) || undefined}
              >
                <summary>
                  <span className={styles.indice}>
                    {progresso.etapas[idsAulas[indice]!] ? (
                      <Check size={15} aria-label="Aula concluída" />
                    ) : (
                      String(indice + 1).padStart(2, '0')
                    )}
                  </span>
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

                  <footer className={styles.conclusaoAula}>
                    <div>
                      <strong>
                        {progresso.etapas[idsAulas[indice]!]
                          ? 'Aula concluída'
                          : 'Terminou esta aula?'}
                      </strong>
                      <p>
                        {progresso.etapas[idsAulas[indice]!]
                          ? 'Seu avanço está salvo. Você pode reabrir a aula quando quiser.'
                          : 'Marque a conclusão para a plataforma abrir o próximo conteúdo.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={Boolean(progresso.etapas[idsAulas[indice]!])}
                      onClick={() => alternarEtapa(idsAulas[indice]!, slug)}
                    >
                      {progresso.etapas[idsAulas[indice]!] ? (
                        <>
                          <Check size={15} aria-hidden="true" /> Concluída
                        </>
                      ) : (
                        'Concluir aula'
                      )}
                    </button>
                  </footer>
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
