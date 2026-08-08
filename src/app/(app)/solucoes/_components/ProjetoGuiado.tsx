'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, Check, PackageCheck, Sparkles } from 'lucide-react';
import type { DadosRoteiroProjeto, ItemSolucao } from '@/lib/conteudo/queries';
import { idPassoProjeto, idsPassosProjeto } from '@/lib/projetos/roteiro';
import { alternarEtapa, contarEtapasFeitas, percentual, useProgresso } from '@/lib/progresso/local';
import { Ferramentas, Prompts } from './KitSolucao';
import styles from './ProjetoGuiado.module.css';

export function ProjetoGuiado({
  slug,
  titulo,
  resumo,
  categoria,
  projeto,
  ferramentas,
  prompts,
  video,
  proxima,
}: {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string | null;
  projeto: DadosRoteiroProjeto;
  ferramentas: ItemSolucao[];
  prompts: ItemSolucao[];
  video: ReactNode;
  proxima: ReactNode;
}) {
  const progresso = useProgresso();
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
      <header className={styles.hero}>
        <div className={styles.heroPrincipal}>
          <p className={styles.eyebrow}>{categoria ? `${categoria} · ` : ''}Projeto guiado</p>
          <h1>{titulo}</h1>
          <p className={styles.resumo}>{resumo}</p>
        </div>

        <div className={styles.resultado}>
          <span>O que você entrega</span>
          <p>{projeto.resultado}</p>
        </div>

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
          {video}

          <div className={styles.fases}>
            {projeto.roteiro.fases.map((fase, faseIndice) => {
              const ids = fase.passos.map((passo) => idPassoProjeto(slug, fase.id, passo.id));
              const concluidos = contarEtapasFeitas(progresso, ids);
              const completa = concluidos === ids.length;

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

          {proxima}
        </main>

        <aside className={styles.lateral}>
          <section className={styles.progressoCard} aria-label="Progresso do projeto">
            <div
              className={styles.anel}
              style={{ '--progresso': `${porcentagem * 3.6}deg` } as CSSProperties}
              aria-hidden="true"
            >
              <span>{porcentagem}%</span>
            </div>
            <div>
              <p>Seu projeto</p>
              <strong>
                {feitas} de {todosIds.length} passos
              </strong>
            </div>
          </section>

          {proximoPasso ? (
            <button type="button" className={styles.continuar} onClick={irAoProximo}>
              Continuar em “{proximoPasso.passo.titulo}”
              <ArrowDown size={16} aria-hidden="true" />
            </button>
          ) : (
            <div className={styles.concluido}>
              <PackageCheck size={20} aria-hidden="true" />
              Projeto pronto para entregar
            </div>
          )}

          <section className={styles.lateralBloco}>
            <span>Cliente ideal</span>
            <p>{projeto.clienteIdeal}</p>
          </section>

          <section className={styles.lateralBloco}>
            <span>Entrega final</span>
            <p>{projeto.entregavelFinal}</p>
          </section>

          <section className={styles.estudio}>
            <Sparkles size={18} aria-hidden="true" />
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

          <p className={styles.notaLocal}>
            O progresso fica salvo neste navegador. Você pode marcar e reabrir qualquer passo.
          </p>
        </aside>
      </div>
    </div>
  );
}
