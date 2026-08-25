'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  PackageCheck,
  Layers3,
} from 'lucide-react';
import type { DadosRoteiroProjeto, ItemSolucao, VizinhaSolucao } from '@/lib/conteudo/queries';
import type { ContextoRotaComercialProjeto } from '@/lib/projetos/rota-comercial-modelo';
import { idPassoProjeto, idsAulasProjeto, idsPassosProjeto } from '@/lib/projetos/roteiro';
import {
  contarEtapasFeitas,
  percentual,
  useAcoesProgresso,
  useProgresso,
} from '@/lib/progresso/local';
import { Ferramentas, Prompts } from './KitSolucao';
import { GuiaExecucaoPasso } from './GuiaExecucaoPasso';
import { ArtefatosEntregaProjeto, FichaCampoProjeto } from './EscopoProjeto';
import { ProximaSolucao } from './ProximaSolucao';
import { RotaComercialProjeto } from './RotaComercialProjeto';
import { TrilhaDidaticaProjeto } from './TrilhaDidaticaProjeto';
import { CabecalhoMinicurso } from './CabecalhoMinicurso';
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
  rotaComercial,
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
  rotaComercial: ContextoRotaComercialProjeto;
}) {
  const progresso = useProgresso();
  const { alternarEtapa } = useAcoesProgresso();
  const todosIds = idsPassosProjeto(slug, projeto.roteiro);
  const feitas = contarEtapasFeitas(progresso, todosIds);
  const porcentagem = percentual(feitas, todosIds.length);
  const aulasFeitas = contarEtapasFeitas(progresso, idsAulasProjeto(slug, projeto.roteiro));
  const destinoCrm = `/vendas?novo=projeto&projeto=${encodeURIComponent(titulo)}&projetoSlug=${encodeURIComponent(slug)}`;
  const perfil = projeto.roteiro.perfil;
  const escopo = projeto.roteiro.escopo;
  const artefatosEntrega = projeto.roteiro.artefatosEntrega;
  const trilhaDidatica = projeto.roteiro.trilhaDidatica;
  const videoAbertura = videoUrl
    ? { videoUrl, titulo: `Aula de abertura · ${titulo}` }
    : (trilhaDidatica?.videosReferencia[0] ?? null);

  const passos = projeto.roteiro.fases.flatMap((fase) =>
    fase.passos.map((passo) => ({ fase, passo, id: idPassoProjeto(slug, fase.id, passo.id) })),
  );
  const proximoPasso = passos.find(({ id }) => !progresso.etapas[id]) ?? null;
  const [faseEscolhidaId, setFaseEscolhidaId] = useState<string | null>(null);
  const faseAtivaId =
    faseEscolhidaId ?? proximoPasso?.fase.id ?? projeto.roteiro.fases[0]?.id ?? '';
  const faseAtiva =
    projeto.roteiro.fases.find((fase) => fase.id === faseAtivaId) ??
    projeto.roteiro.fases[0] ??
    null;
  const faseAtivaIndice = faseAtiva
    ? projeto.roteiro.fases.findIndex((fase) => fase.id === faseAtiva.id)
    : -1;
  const faseAnterior =
    faseAtivaIndice > 0 ? (projeto.roteiro.fases[faseAtivaIndice - 1] ?? null) : null;
  const proximaFase =
    faseAtivaIndice >= 0 ? (projeto.roteiro.fases[faseAtivaIndice + 1] ?? null) : null;

  const abrirFase = (id: string, mover = false) => {
    setFaseEscolhidaId(id);
    if (!mover) return;
    requestAnimationFrame(() => {
      const alvo = document.getElementById(`fase-${id}`);
      alvo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      alvo?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    });
  };

  const irAoProximo = () => {
    if (!proximoPasso) return;
    setFaseEscolhidaId(proximoPasso.fase.id);
    requestAnimationFrame(() => {
      const alvo = document.getElementById(
        `passo-${proximoPasso.fase.id}-${proximoPasso.passo.id}`,
      );
      alvo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alvo?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    });
  };

  return (
    <div className={styles.raiz}>
      <CabecalhoMinicurso
        titulo={titulo}
        resumo={resumo}
        categoria={categoria}
        totalAulas={trilhaDidatica?.aulas.length ?? 1}
        aulasConcluidas={aulasFeitas}
        tempoPreparacao={trilhaDidatica?.tempoTotal ?? 'Comece pelo vídeo'}
        totalPassos={todosIds.length}
        passosConcluidos={feitas}
        videoUrl={videoAbertura?.videoUrl ?? null}
        tituloVideo={videoAbertura?.titulo ?? 'Aula de abertura'}
      />

      {trilhaDidatica ? (
        <TrilhaDidaticaProjeto
          slug={slug}
          trilha={trilhaDidatica}
          videoAberturaUrl={videoAbertura?.videoUrl}
        />
      ) : null}

      <header id="implementacao-projeto" className={styles.hero} data-on-dark>
        <div className={styles.heroPrincipal}>
          <p className={styles.eyebrow}>Parte 2 · Operação</p>
          <h2>Implemente com um cliente.</h2>
          <p className={styles.resumo}>
            Conclua as aulas acima. Depois, siga as cinco fases e transforme cada passo em uma
            entrega verificável.
          </p>
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
            <Link href={destinoCrm} className={styles.continuarHero}>
              <span>
                <small>Próxima ação</small>
                Encontrar novo cliente
              </span>
              <PackageCheck size={18} aria-hidden="true" />
            </Link>
          )}
        </section>

        <nav className={styles.navegacaoFases} aria-label="Fases do projeto">
          {projeto.roteiro.fases.map((fase, indice) => {
            const ids = fase.passos.map((passo) => idPassoProjeto(slug, fase.id, passo.id));
            const concluidos = contarEtapasFeitas(progresso, ids);
            return (
              <button
                type="button"
                key={fase.id}
                data-ativa={fase.id === faseAtiva?.id || undefined}
                aria-current={fase.id === faseAtiva?.id ? 'step' : undefined}
                onClick={() => abrirFase(fase.id)}
              >
                <span className={styles.faseNumero}>{String(indice + 1).padStart(2, '0')}</span>
                <span className={styles.faseNome}>{fase.titulo}</span>
                <span className={styles.faseEstado}>
                  {concluidos === ids.length ? (
                    <Check size={11} aria-label="Fase concluída" />
                  ) : (
                    `${concluidos}/${ids.length}`
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      {perfil && escopo ? <FichaCampoProjeto perfil={perfil} escopo={escopo} /> : null}

      {projeto.roteiro.fundamentos.length > 0 ? (
        <section className={styles.fundamentos} aria-labelledby="fundamentos-projeto">
          <header className={styles.fundamentosCabecalho}>
            <p>Antes de executar</p>
            <h2 id="fundamentos-projeto">Regras que protegem este projeto</h2>
          </header>
          <ol>
            {projeto.roteiro.fundamentos.map((fundamento, indice) => (
              <li key={fundamento.titulo}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{fundamento.titulo}</h3>
                  <p>{fundamento.descricao}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className={styles.corpo}>
        <div className={styles.principal}>
          <div className={styles.fases}>
            {faseAtiva
              ? (() => {
                  const ids = faseAtiva.passos.map((passo) =>
                    idPassoProjeto(slug, faseAtiva.id, passo.id),
                  );
                  const concluidos = contarEtapasFeitas(progresso, ids);
                  const completa = concluidos === ids.length;

                  return (
                    <section id={`fase-${faseAtiva.id}`} className={styles.fase}>
                      <header className={styles.faseCabecalho}>
                        <div className={styles.faseMarcador} data-completa={completa || undefined}>
                          {completa ? (
                            <Check size={18} />
                          ) : (
                            String(faseAtivaIndice + 1).padStart(2, '0')
                          )}
                        </div>
                        <div>
                          <p>Fase {String(faseAtivaIndice + 1).padStart(2, '0')}</p>
                          <h2>{faseAtiva.titulo}</h2>
                          <span>{faseAtiva.objetivo}</span>
                        </div>
                        <em>
                          {concluidos}/{ids.length}
                        </em>
                      </header>

                      <ol className={styles.passos}>
                        {faseAtiva.passos.map((passo, passoIndice) => {
                          const id = idPassoProjeto(slug, faseAtiva.id, passo.id);
                          const concluido = Boolean(progresso.etapas[id]);
                          const atual = proximoPasso?.id === id;

                          return (
                            <li
                              key={passo.id}
                              id={`passo-${faseAtiva.id}-${passo.id}`}
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
                                  <div>
                                    <h3>{passo.titulo}</h3>
                                    {passo.duracao ? (
                                      <small>
                                        <Clock3 size={12} aria-hidden="true" />
                                        {passo.duracao}
                                      </small>
                                    ) : null}
                                  </div>
                                  {atual ? <span>Próximo passo</span> : null}
                                </div>
                                <p className={styles.acao}>{passo.acao}</p>

                                <GuiaExecucaoPasso
                                  passo={passo}
                                  atual={atual}
                                  concluido={concluido}
                                />

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
                        aria-label={`Navegação da fase ${faseAtiva.titulo}`}
                      >
                        {faseAnterior ? (
                          <button
                            type="button"
                            aria-label={`Ir para a fase anterior: ${faseAnterior.titulo}`}
                            onClick={() => abrirFase(faseAnterior.id, true)}
                          >
                            <ArrowLeft size={15} aria-hidden="true" />
                            <span>
                              <small>Fase anterior</small>
                              {faseAnterior.titulo}
                            </span>
                          </button>
                        ) : (
                          <span aria-hidden="true" />
                        )}

                        {proximaFase ? (
                          <button
                            type="button"
                            data-proxima
                            aria-label={`Ir para a próxima fase: ${proximaFase.titulo}`}
                            onClick={() => abrirFase(proximaFase.id, true)}
                          >
                            <span>
                              <small>Próxima fase</small>
                              {proximaFase.titulo}
                            </span>
                            <ArrowRight size={15} aria-hidden="true" />
                          </button>
                        ) : (
                          <a
                            href="#kit-projeto"
                            data-proxima
                            aria-label="Abrir kit de implementação"
                          >
                            <span>
                              <small>Depois das fases</small>
                              Abrir kit de implementação
                            </span>
                            <ArrowRight size={15} aria-hidden="true" />
                          </a>
                        )}
                      </nav>
                    </section>
                  );
                })()
              : null}
          </div>

          <section className={styles.kit} aria-labelledby="kit-projeto">
            <div className={styles.kitCabecalho}>
              <p>Kit de implementação</p>
              <h2 id="kit-projeto">Arquivos e modelos do projeto</h2>
            </div>
            {artefatosEntrega ? <ArtefatosEntregaProjeto artefatos={artefatosEntrega} /> : null}
            <Ferramentas itens={ferramentas} />
            <Prompts itens={prompts} />
          </section>

          {proxima ? <ProximaSolucao proxima={proxima} /> : null}
        </div>

        <aside className={styles.lateral}>
          <RotaComercialProjeto
            slug={slug}
            titulo={titulo}
            contexto={rotaComercial}
            destinoNovoLead={destinoCrm}
          />

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
              <p>Leve esta base ao Estúdio e adapte o projeto para as necessidades do cliente.</p>
            </div>
            <Link href={`/builder?projeto=${encodeURIComponent(slug)}`}>
              Personalizar no Estúdio <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </section>

          <p className={styles.notaLocal}>
            Salvo na sua conta. Você pode marcar, reabrir e continuar em qualquer dispositivo.
          </p>
        </aside>
      </div>
    </div>
  );
}
