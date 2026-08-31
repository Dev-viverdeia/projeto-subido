'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { idAulaProjeto, type RoteiroProjeto } from '@/lib/projetos/roteiro';
import {
  contarEtapasFeitas,
  percentual,
  useAcoesProgresso,
  useProgresso,
} from '@/lib/progresso/local';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import { VideoConteudo } from '../../_components/VideoConteudo';
import { RecursosAula } from './RecursosAula';
import styles from './ProjetoGuiadoNovo.module.css';

type Trilha = NonNullable<RoteiroProjeto['trilhaDidatica']>;

export function AprendizadoProjeto({
  slug,
  titulo,
  trilha,
  videoUrl,
}: {
  slug: string;
  titulo: string;
  trilha: Trilha;
  videoUrl: string | null;
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
  const [aulaEscolhida, setAulaEscolhida] = useState(primeiraPendente);
  const aula = trilha.aulas[aulaEscolhida];
  const videoAbertura = videoUrl
    ? { videoUrl, titulo: `Aula de abertura · ${titulo}` }
    : (trilha.videosReferencia[0] ?? null);

  const concluirAula = () => {
    const idAtual = idAulaProjeto(slug, aulaEscolhida);
    const estavaConcluida = Boolean(progresso.etapas[idAtual]);
    alternarEtapa(idAtual, slug);
    if (estavaConcluida) return;

    const proximaIndice = trilha.aulas.findIndex(
      (_, indice) => indice !== aulaEscolhida && !progresso.etapas[idAulaProjeto(slug, indice)],
    );
    if (proximaIndice >= 0) setAulaEscolhida(proximaIndice);
  };

  return (
    <section
      id="aprendizado-projeto"
      className={styles.aprendizado}
      aria-labelledby="aprendizado-titulo"
    >
      <header className={styles.secaoCabecalho}>
        <div>
          <p className={styles.eyebrow}>1 · Aprenda</p>
          <h2 id="aprendizado-titulo">Entenda antes de construir</h2>
          <span>Assista à introdução e conclua uma aula por vez.</span>
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
          >
            <span
              style={{ transform: `scaleX(${percentual(aulasFeitas, trilha.aulas.length) / 100})` }}
            />
          </span>
        </div>
      </header>

      <div className={styles.aprendizadoCorpo}>
        <div className={styles.videoAbertura}>
          <div className={styles.videoRotulo}>
            <span>Aula de abertura</span>
            <strong>{videoAbertura?.titulo ?? titulo}</strong>
          </div>
          <VideoConteudo
            videoUrl={videoAbertura?.videoUrl ?? null}
            titulo={videoAbertura?.titulo ?? titulo}
          />
        </div>
        <div className={styles.aulaFoco}>
          <nav className={styles.aulaNavegacao} aria-label="Aulas do projeto">
            {trilha.aulas.map((item, indice) => {
              const concluida = Boolean(progresso.etapas[idAulaProjeto(slug, indice)]);
              return (
                <button
                  type="button"
                  key={item.titulo}
                  onClick={() => setAulaEscolhida(indice)}
                  data-ativa={indice === aulaEscolhida || undefined}
                  aria-current={indice === aulaEscolhida ? 'step' : undefined}
                  aria-label={`Aula ${indice + 1}: ${item.titulo}`}
                >
                  <span>
                    {concluida ? <Check size={13} /> : String(indice + 1).padStart(2, '0')}
                  </span>
                  <strong>{item.titulo}</strong>
                  <small>{item.duracao}</small>
                </button>
              );
            })}
          </nav>
          {aula ? (
            <article className={styles.aulaConteudo}>
              <header>
                <p>Aula {String(aulaEscolhida + 1).padStart(2, '0')}</p>
                <h3>{aula.titulo}</h3>
                <span>{aula.objetivo}</span>
              </header>
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
                      <Check size={15} aria-hidden="true" /> Concluída
                    </>
                  ) : (
                    'Concluir aula'
                  )}
                </button>
              </div>
              <details className={styles.detalheApoio}>
                <summary>
                  Recursos desta aula <ChevronDown size={16} aria-hidden="true" />
                </summary>
                <RecursosAula recursos={aula.recursos} />
              </details>
            </article>
          ) : null}
        </div>
      </div>

      {aprendizadoConcluido ? (
        <aside className={styles.aprendizadoConcluido} aria-label="Aprendizado concluído">
          <Check size={17} aria-hidden="true" />
          <div>
            <strong>Aprendizado concluído</strong>
            <p>{trilha.aulas.length} aulas concluídas. O passo a passo está liberado abaixo.</p>
          </div>
          <a href="#implementacao-projeto">Ir para implementação</a>
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
          {trilha.videosReferencia.map((video) => (
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
