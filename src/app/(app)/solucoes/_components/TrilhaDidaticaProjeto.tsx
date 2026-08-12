import { BookOpenCheck, CheckCircle2, Clapperboard, Clock3, FileText } from 'lucide-react';
import type { RoteiroProjeto } from '@/lib/projetos/roteiro';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import { VideoConteudo } from '../../_components/VideoConteudo';
import styles from './TrilhaDidaticaProjeto.module.css';

type Trilha = NonNullable<RoteiroProjeto['trilhaDidatica']>;

export function TrilhaDidaticaProjeto({ trilha }: { trilha: Trilha }) {
  return (
    <section className={styles.raiz} aria-labelledby="trilha-didatica-titulo">
      <header className={styles.cabecalho}>
        <div>
          <p>Preparação de campo</p>
          <h2 id="trilha-didatica-titulo">Aprenda o necessário. Depois, execute.</h2>
          <span>
            Uma preparação curta para você entender a lógica, observar o projeto funcionando e
            entrar na implementação com os materiais certos.
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
            <small>{trilha.aulas.length} aulas objetivas</small>
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
            <strong>Leve para o campo</strong>
            <small>{trilha.materiais.length} modelos copiáveis</small>
          </div>
        </li>
      </ol>

      <div className={styles.aprendizado}>
        <section className={styles.aulas} aria-labelledby="aulas-campo-titulo">
          <header className={styles.blocoCabecalho}>
            <span>Aulas de campo</span>
            <h3 id="aulas-campo-titulo">Só o que muda a sua execução</h3>
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
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.demonstracao} aria-labelledby="demonstracao-titulo">
          <header className={styles.blocoCabecalho}>
            <span>Demonstração de campo</span>
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
                  <small>Evidência · {passo.evidencia}</small>
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

      {trilha.videosReferencia.length > 0 ? (
        <section className={styles.videos} aria-labelledby="videos-referencia-titulo">
          <header className={styles.blocoCabecalho}>
            <span>Solução de referência</span>
            <h3 id="videos-referencia-titulo">Veja a entrega antes de construir a sua</h3>
          </header>
          <div className={styles.gradeVideos}>
            {trilha.videosReferencia.map((video, indice) => (
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
          <h3 id="materiais-campo-titulo">Não comece com uma página em branco</h3>
          <p>Copie, adapte ao cliente e guarde cada documento como evidência da entrega.</p>
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
