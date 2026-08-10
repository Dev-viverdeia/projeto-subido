'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileSignature,
  PackageCheck,
  Layers3,
} from 'lucide-react';
import type { DadosRoteiroProjeto, ItemSolucao, VizinhaSolucao } from '@/lib/conteudo/queries';
import { idPassoProjeto, idsPassosProjeto } from '@/lib/projetos/roteiro';
import {
  contarEtapasFeitas,
  percentual,
  useAcoesProgresso,
  useProgresso,
} from '@/lib/progresso/local';
import { Ferramentas, Prompts } from './KitSolucao';
import { ProximaSolucao } from './ProximaSolucao';
import { VideoConteudo } from '../../_components/VideoConteudo';
import styles from './ProjetoGuiado.module.css';

export function ProjetoGuiado({
  slug,
  titulo,
  resumo,
  categoria,
  projeto,
  ferramentas,
  prompts,
  videoUrl,
  proxima,
}: {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string | null;
  projeto: DadosRoteiroProjeto;
  ferramentas: ItemSolucao[];
  prompts: ItemSolucao[];
  videoUrl: string | null;
  proxima: VizinhaSolucao | null;
}) {
  const progresso = useProgresso();
  const { alternarEtapa } = useAcoesProgresso();
  const todosIds = idsPassosProjeto(slug, projeto.roteiro);
  const feitas = contarEtapasFeitas(progresso, todosIds);
  const porcentagem = percentual(feitas, todosIds.length);

  const passos = projeto.roteiro.fases.flatMap((fase) =>
    fase.passos.map((passo) => ({ fase, passo, id: idPassoProjeto(slug, fase.id, passo.id) })),
  );
  const proximoPasso = passos.find(({ id }) => !progresso.etapas[id]) ?? null;

  const irAoProximo = () => {
    if (!proximoPasso) return;
    const alvo = document.getElementById(`passo-${proximoPasso.fase.id}-${proximoPasso.passo.id}`);
    alvo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    alvo?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  };

  return (
    <div className={styles.raiz}>
      <header className={styles.hero} data-on-dark>
        <div className={styles.heroPrincipal}>
          <p className={styles.eyebrow}>{categoria ? `${categoria} · ` : ''}Projeto guiado</p>
          <h1>{titulo}</h1>
          <p className={styles.resumo}>{resumo}</p>
        </div>

        <div className={styles.resultado}>
          <span>O que você entrega</span>
          <p>{projeto.resultado}</p>
        </div>

        <section className={styles.retomadaHero} aria-label="Progresso do projeto">
          <div className={styles.retomadaMedida}>
            <span>Seu progresso</span>
            <strong>
              {feitas} de {todosIds.length} passos
            </strong>
          </div>

          <div
            className={styles.progressoHero}
            role="progressbar"
            aria-label="Progresso do projeto"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={porcentagem}
          >
            <span style={{ transform: `scaleX(${porcentagem / 100})` }} />
          </div>

          {proximoPasso ? (
            <button type="button" className={styles.continuarHero} onClick={irAoProximo}>
              <span>
                <small>Próximo passo</small>
                {proximoPasso.passo.titulo}
              </span>
              <ArrowDown size={16} aria-hidden="true" />
            </button>
          ) : (
            <div className={styles.concluidoHero}>
              <PackageCheck size={18} aria-hidden="true" />
              Projeto pronto para entregar
            </div>
          )}
        </section>

        <nav className={styles.navegacaoFases} aria-label="Fases do projeto">
          {projeto.roteiro.fases.map((fase, indice) => {
            const ids = fase.passos.map((passo) => idPassoProjeto(slug, fase.id, passo.id));
            const concluidos = contarEtapasFeitas(progresso, ids);
            return (
              <a key={fase.id} href={`#fase-${fase.id}`}>
                <span className={styles.faseNumero}>{String(indice + 1).padStart(2, '0')}</span>
                <span className={styles.faseNome}>{fase.titulo}</span>
                <span className={styles.faseEstado}>
                  {concluidos === ids.length ? (
                    <Check size={11} aria-label="Fase concluída" />
                  ) : (
                    `${concluidos}/${ids.length}`
                  )}
                </span>
              </a>
            );
          })}
        </nav>
      </header>

      <div className={styles.corpo}>
        <main className={styles.principal}>
          {videoUrl ? <VideoConteudo videoUrl={videoUrl} titulo={titulo} /> : null}

          <div className={styles.fases}>
            {projeto.roteiro.fases.map((fase, faseIndice) => {
              const ids = fase.passos.map((passo) => idPassoProjeto(slug, fase.id, passo.id));
              const concluidos = contarEtapasFeitas(progresso, ids);
              const completa = concluidos === ids.length;
              const faseAnterior = projeto.roteiro.fases[faseIndice - 1] ?? null;
              const proximaFase = projeto.roteiro.fases[faseIndice + 1] ?? null;

              return (
                <section key={fase.id} id={`fase-${fase.id}`} className={styles.fase}>
                  <header className={styles.faseCabecalho}>
                    <div className={styles.faseMarcador} data-completa={completa || undefined}>
                      {completa ? <Check size={18} /> : String(faseIndice + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <p>Fase {String(faseIndice + 1).padStart(2, '0')}</p>
                      <h2>{fase.titulo}</h2>
                      <span>{fase.objetivo}</span>
                    </div>
                    <em>
                      {concluidos}/{ids.length}
                    </em>
                  </header>

                  <ol className={styles.passos}>
                    {fase.passos.map((passo, passoIndice) => {
                      const id = idPassoProjeto(slug, fase.id, passo.id);
                      const concluido = Boolean(progresso.etapas[id]);
                      const atual = proximoPasso?.id === id;

                      return (
                        <li
                          key={passo.id}
                          id={`passo-${fase.id}-${passo.id}`}
                          className={styles.passo}
                          data-concluido={concluido || undefined}
                          data-atual={atual || undefined}
                        >
                          <button
                            type="button"
                            className={styles.check}
                            aria-pressed={concluido}
                            aria-label={`${concluido ? 'Reabrir' : 'Concluir'}: ${passo.titulo}`}
                            onClick={() => alternarEtapa(id, slug)}
                          >
                            {concluido ? <Check size={15} /> : passoIndice + 1}
                          </button>

                          <div className={styles.passoConteudo}>
                            <div className={styles.passoTitulo}>
                              <h3>{passo.titulo}</h3>
                              {atual ? <span>Próximo passo</span> : null}
                            </div>
                            <p className={styles.acao}>{passo.acao}</p>
                            <dl className={styles.evidencias}>
                              <div>
                                <dt>Pronto quando</dt>
                                <dd>{passo.concluidoQuando}</dd>
                              </div>
                              <div>
                                <dt>Você entrega</dt>
                                <dd>{passo.entregavel}</dd>
                              </div>
                            </dl>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <nav
                    className={styles.navegacaoSequencial}
                    aria-label={`Navegação da fase ${fase.titulo}`}
                  >
                    {faseAnterior ? (
                      <a
                        href={`#fase-${faseAnterior.id}`}
                        aria-label={`Ir para a fase anterior: ${faseAnterior.titulo}`}
                      >
                        <ArrowLeft size={15} aria-hidden="true" />
                        <span>
                          <small>Fase anterior</small>
                          {faseAnterior.titulo}
                        </span>
                      </a>
                    ) : (
                      <span aria-hidden="true" />
                    )}

                    <a
                      href={proximaFase ? `#fase-${proximaFase.id}` : '#kit-projeto'}
                      data-proxima
                      aria-label={
                        proximaFase
                          ? `Ir para a próxima fase: ${proximaFase.titulo}`
                          : 'Abrir kit de implementação'
                      }
                    >
                      <span>
                        <small>{proximaFase ? 'Próxima fase' : 'Depois das fases'}</small>
                        {proximaFase?.titulo ?? 'Abrir kit de implementação'}
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </a>
                  </nav>
                </section>
              );
            })}
          </div>

          <section className={styles.kit} aria-labelledby="kit-projeto">
            <div className={styles.kitCabecalho}>
              <p>Kit de implementação</p>
              <h2 id="kit-projeto">Ferramentas e instruções prontas para executar</h2>
            </div>
            <Ferramentas itens={ferramentas} />
            <Prompts itens={prompts} />
          </section>

          {proxima ? <ProximaSolucao proxima={proxima} /> : null}
        </main>

        <aside className={styles.lateral}>
          <section className={styles.lateralBloco}>
            <span>Cliente ideal</span>
            <p>{projeto.clienteIdeal}</p>
          </section>

          <section className={styles.lateralBloco}>
            <span>Entrega final</span>
            <p>{projeto.entregavelFinal}</p>
          </section>

          <section className={styles.estudio}>
            <Layers3 size={18} aria-hidden="true" />
            <div>
              <span>O cliente tem outra realidade?</span>
              <p>
                Leve esta base ao Estúdio e transforme as dores dele em um projeto personalizado.
              </p>
            </div>
            <Link href={`/builder?projeto=${encodeURIComponent(slug)}`}>
              Personalizar no Estúdio <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </section>

          <Link
            href={`/propostas/nova?projeto=${encodeURIComponent(slug)}`}
            className={styles.proposta}
          >
            <FileSignature size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>
              <small>Levar ao cliente</small>
              Criar proposta comercial
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>

          <p className={styles.notaLocal}>
            Salvo na sua conta. Você pode marcar, reabrir e continuar em qualquer dispositivo.
          </p>
        </aside>
      </div>
    </div>
  );
}
