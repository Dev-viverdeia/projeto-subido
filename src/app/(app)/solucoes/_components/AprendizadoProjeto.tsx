'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3 } from 'lucide-react';
import { idAulaProjeto, type RoteiroProjeto } from '@/lib/projetos/roteiro';
import { exemploAulaProjeto } from '@/lib/projetos/exemplos';
import {
  contarEtapasFeitas,
  percentual,
  useAcoesProgresso,
  useProgresso,
} from '@/lib/progresso/local';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import { VideoConteudo } from '../../_components/VideoConteudo';
import { RecursosAula } from './RecursosAula';
import { ExemploProjeto } from './ExemploProjeto';
import styles from './ProjetoGuiadoNovo.module.css';

type Trilha = NonNullable<RoteiroProjeto['trilhaDidatica']>;

export function AprendizadoProjeto({
  slug,
  titulo,
  trilha,
  videoUrl,
  onIrImplementacao,
}: {
  slug: string;
  titulo: string;
  trilha: Trilha;
  videoUrl: string | null;
  onIrImplementacao?: () => void;
}) {
  const progresso = useProgresso();
  const { alternarEtapa } = useAcoesProgresso();
  const aulasFeitas = contarEtapasFeitas(
    progresso,
    trilha.aulas.map((_, indice) => idAulaProjeto(slug, indice)),
  );
  const aprendizadoConcluido = aulasFeitas === trilha.aulas.length;
  const primeiraPendente = Math.max(
    0,
    trilha.aulas.findIndex((_, indice) => !progresso.etapas[idAulaProjeto(slug, indice)]),
  );
  const [escolha, setAulaEscolhida] = useState<number | null>(null);
  const [listaAberta, setListaAberta] = useState(false);
  const aulaEscolhida = escolha ?? primeiraPendente;
  const aula = trilha.aulas[aulaEscolhida];
  const exemplo = aula ? exemploAulaProjeto(slug, aula.titulo) : null;
  const videoAbertura = videoUrl
    ? { videoUrl, titulo: `Aula de abertura · ${titulo}` }
    : (trilha.videosReferencia[0] ?? null);

  const focarAula = () => {
    requestAnimationFrame(() => {
      const tituloAula = document.getElementById('aula-projeto-titulo');
      tituloAula?.focus({ preventScroll: true });
      tituloAula?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  };

  const abrirAula = (indice: number) => {
    setAulaEscolhida(indice);
    setListaAberta(false);
    focarAula();
  };

  const concluirAula = () => {
    const idAtual = idAulaProjeto(slug, aulaEscolhida);
    const estavaConcluida = Boolean(progresso.etapas[idAtual]);
    alternarEtapa(idAtual, slug);
    if (estavaConcluida) {
      abrirAula(aulaEscolhida);
      return;
    }

    const proximaIndice = trilha.aulas.findIndex(
      (_, indice) => indice !== aulaEscolhida && !progresso.etapas[idAulaProjeto(slug, indice)],
    );
    abrirAula(proximaIndice >= 0 ? proximaIndice : aulaEscolhida);
  };

  return (
    <section
      id="aprendizado-projeto"
      className={styles.aprendizado}
      aria-labelledby="aprendizado-titulo"
    >
      <header className={styles.secaoCabecalho}>
        <div>
          <h2 id="aprendizado-titulo">Aulas do projeto</h2>
        </div>
        <div className={styles.progressoResumo}>
          <span>
            <strong>{aulasFeitas}</strong> de {trilha.aulas.length} aulas
          </span>
          <span
            className={styles.barra}
            role="progressbar"
            aria-label="Progresso do aprendizado"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentual(aulasFeitas, trilha.aulas.length)}
            aria-valuetext={`${aulasFeitas} de ${trilha.aulas.length} aulas concluídas`}
          >
            <span
              style={{ transform: `scaleX(${percentual(aulasFeitas, trilha.aulas.length) / 100})` }}
            />
          </span>
        </div>
      </header>

      <div className={styles.aprendizadoCorpo}>
        <div className={styles.videoAbertura}>
          <VideoConteudo
            videoUrl={videoAbertura?.videoUrl ?? null}
            titulo={videoAbertura?.titulo ?? titulo}
          />
          <p className={styles.videoLegenda}>Vídeo do projeto</p>
        </div>
        <div className={styles.aulaFoco}>
          <aside className={styles.aulasLista} data-aberta={listaAberta || undefined}>
            <button
              type="button"
              className={styles.abrirAulas}
              aria-expanded={listaAberta}
              aria-controls="lista-aulas-projeto"
              onClick={() => setListaAberta(!listaAberta)}
            >
              <strong>
                Aula {aulaEscolhida + 1} de {trilha.aulas.length}
              </strong>
              <span>
                {listaAberta ? 'Fechar lista' : 'Ver aulas'}{' '}
                <ChevronDown size={16} aria-hidden="true" />
              </span>
            </button>
            <nav
              id="lista-aulas-projeto"
              className={styles.aulaNavegacao}
              aria-label="Aulas do projeto"
            >
              {trilha.aulas.map((item, indice) => {
                const concluida = Boolean(progresso.etapas[idAulaProjeto(slug, indice)]);
                return (
                  <button
                    type="button"
                    key={item.titulo}
                    onClick={() => abrirAula(indice)}
                    data-ativa={indice === aulaEscolhida || undefined}
                    data-concluida={concluida || undefined}
                    aria-current={indice === aulaEscolhida ? 'step' : undefined}
                    aria-label={`Aula ${indice + 1}: ${item.titulo}${concluida ? ' · Concluída' : ''}`}
                  >
                    <span aria-hidden="true">
                      {concluida ? <Check size={17} /> : String(indice + 1).padStart(2, '0')}
                    </span>
                    <strong>{item.titulo}</strong>
                    <small>{concluida ? 'Concluída' : item.duracao}</small>
                  </button>
                );
              })}
            </nav>
          </aside>
          {aula ? (
            <article
              key={aulaEscolhida}
              className={styles.aulaConteudo}
              aria-labelledby="aula-projeto-titulo"
            >
              <header>
                <h3 id="aula-projeto-titulo" tabIndex={-1}>
                  {aula.titulo}
                </h3>
                <div className={styles.aulaMeta}>
                  <span className={styles.aulaIndice}>
                    Aula {aulaEscolhida + 1} de {trilha.aulas.length}
                  </span>
                  <span>
                    <Clock3 size={15} aria-hidden="true" /> {aula.duracao}
                  </span>
                  {progresso.etapas[idAulaProjeto(slug, aulaEscolhida)] ? (
                    <span>
                      <Check size={16} aria-hidden="true" /> Concluída
                    </span>
                  ) : null}
                </div>
                {!exemplo ? <span>{aula.objetivo}</span> : null}
              </header>
              <details className={`${styles.detalheApoio} ${styles.recursosEmFoco}`}>
                <summary>
                  Recursos desta aula <ChevronDown size={16} aria-hidden="true" />
                </summary>
                <RecursosAula recursos={aula.recursos} compacto />
              </details>
              {exemplo ? (
                <>
                  <div className={styles.exemploAula}>
                    <ExemploProjeto key={aula.titulo} exemplo={exemplo} />
                  </div>
                  <section className={styles.praticaAula}>
                    <h4>Agora, com seu cliente</h4>
                    <p>{aula.exercicio}</p>
                  </section>
                  <details className={styles.detalheApoio} key={aula.titulo}>
                    <summary>
                      O que aprender nesta aula <ChevronDown size={16} aria-hidden="true" />
                    </summary>
                    <p>{aula.objetivo}</p>
                    <ul>
                      {aula.topicos.map((topico) => (
                        <li key={topico}>{topico}</li>
                      ))}
                    </ul>
                  </details>
                </>
              ) : (
                <div className={styles.aulaResumo}>
                  <section>
                    <h4>Você vai aprender</h4>
                    <ul>
                      {aula.topicos.map((topico) => (
                        <li key={topico}>{topico}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h4>Faça agora</h4>
                    <p>{aula.exercicio}</p>
                  </section>
                </div>
              )}
              <div className={styles.aulaConclusao}>
                <p>
                  <span>Pronto quando</span>
                  {aula.prontoQuando}
                </p>
                <button
                  type="button"
                  aria-pressed={Boolean(progresso.etapas[idAulaProjeto(slug, aulaEscolhida)])}
                  onClick={concluirAula}
                >
                  {progresso.etapas[idAulaProjeto(slug, aulaEscolhida)] ? (
                    <>
                      <Check size={15} aria-hidden="true" /> Reabrir aula
                    </>
                  ) : (
                    'Concluir aula'
                  )}
                </button>
              </div>
            </article>
          ) : null}
        </div>
      </div>

      <nav className={styles.navegacaoSequencial} aria-label="Navegação entre aulas">
        {aulaEscolhida > 0 ? (
          <button type="button" onClick={() => abrirAula(aulaEscolhida - 1)}>
            <ArrowLeft size={17} aria-hidden="true" /> Anterior
          </button>
        ) : (
          <span />
        )}
        {aulaEscolhida < trilha.aulas.length - 1 ? (
          <button type="button" onClick={() => abrirAula(aulaEscolhida + 1)}>
            Próxima aula <ArrowRight size={17} aria-hidden="true" />
          </button>
        ) : null}
      </nav>

      {aprendizadoConcluido ? (
        <aside className={styles.aprendizadoConcluido} aria-label="Aprendizado concluído">
          <Check size={17} aria-hidden="true" />
          <div>
            <strong>Aprendizado concluído</strong>
            <p>{trilha.aulas.length} aulas concluídas.</p>
          </div>
          {onIrImplementacao ? (
            <button type="button" onClick={onIrImplementacao}>
              Ir para implementação
            </button>
          ) : (
            <a href="#implementacao-projeto">Ir para implementação</a>
          )}
        </aside>
      ) : null}

      <details className={styles.bibliotecaApoio}>
        <summary>
          <span>
            <small>Consulta opcional</small>Ver caso de referência e modelos
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <div className={styles.bibliotecaCorpo}>
          <section className={styles.demonstracao}>
            <header>
              <p>Caso de referência</p>
              <h3>{trilha.demonstracao.titulo}</h3>
              <span>{trilha.demonstracao.contexto}</span>
            </header>
            <ol>
              {trilha.demonstracao.passos.map((passo, indice) => (
                <li key={`${passo.etapa}-${indice}`}>
                  <span>{String(indice + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{passo.etapa}</strong>
                    <p>{passo.oQueAcontece}</p>
                    <small>{passo.evidencia}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className={styles.modelosAula}>
            <header>
              <p>Modelos de trabalho</p>
              <h3>Use com o cliente</h3>
            </header>
            <div>
              {trilha.materiais.map((material) => (
                <article key={material.titulo}>
                  <div>
                    <strong>{material.titulo}</strong>
                    <p>{material.quandoUsar}</p>
                  </div>
                  <BotaoCopiar texto={material.conteudo} rotuloDoQue={material.titulo} />
                </article>
              ))}
            </div>
          </section>
          {trilha.videosReferencia
            .filter((video) => video.videoUrl !== videoAbertura?.videoUrl)
            .map((video) => (
              <section className={styles.videoReferencia} key={video.videoUrl}>
                <header>
                  <p>Vídeo de referência</p>
                  <h3>{video.titulo}</h3>
                  <span>{video.descricao}</span>
                </header>
                <VideoConteudo videoUrl={video.videoUrl} titulo={video.titulo} />
              </section>
            ))}
        </div>
      </details>
    </section>
  );
}
