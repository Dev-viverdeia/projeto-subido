'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3 } from 'lucide-react';
import { idPassoProjeto, idsPassosProjeto, type RoteiroProjeto } from '@/lib/projetos/roteiro';
import {
  contarEtapasFeitas,
  percentual,
  useAcoesProgresso,
  useProgresso,
} from '@/lib/progresso/local';
import { GuiaExecucaoPasso } from './GuiaExecucaoPasso';
import { exemploPassoProjeto } from '@/lib/projetos/exemplos';
import styles from './ProjetoGuiadoNovo.module.css';

export function ImplementacaoProjeto({
  slug,
  roteiro,
  onIrMateriais,
}: {
  slug: string;
  roteiro: RoteiroProjeto;
  onIrMateriais: () => void;
}) {
  const progresso = useProgresso();
  const { alternarEtapa } = useAcoesProgresso();
  const todosIds = idsPassosProjeto(slug, roteiro);
  const feitas = contarEtapasFeitas(progresso, todosIds);
  const passos = roteiro.fases.flatMap((fase) =>
    fase.passos.map((passo) => ({ fase, passo, id: idPassoProjeto(slug, fase.id, passo.id) })),
  );
  const proximoPasso = passos.find(({ id }) => !progresso.etapas[id]) ?? null;
  const [faseEscolhidaId, setFaseEscolhidaId] = useState<string | null>(null);
  const [passoEscolhidoId, setPassoEscolhidoId] = useState<string | null>(null);
  const [listaPassosAberta, setListaPassosAberta] = useState(false);
  const faseAtivaId = faseEscolhidaId ?? proximoPasso?.fase.id ?? roteiro.fases[0]?.id ?? '';
  const faseAtiva =
    roteiro.fases.find((fase) => fase.id === faseAtivaId) ?? roteiro.fases[0] ?? null;
  const faseAtivaIndice = faseAtiva
    ? roteiro.fases.findIndex((fase) => fase.id === faseAtiva.id)
    : -1;
  const passoAtivo = faseAtiva
    ? (faseAtiva.passos.find((passo) => passo.id === passoEscolhidoId) ??
      faseAtiva.passos.find(
        (passo) => !progresso.etapas[idPassoProjeto(slug, faseAtiva.id, passo.id)],
      ) ??
      faseAtiva.passos[0] ??
      null)
    : null;
  const passoAtivoId =
    faseAtiva && passoAtivo ? idPassoProjeto(slug, faseAtiva.id, passoAtivo.id) : null;
  const passoIndice = passos.findIndex(({ id }) => id === passoAtivoId);
  const passoAnterior = passos[passoIndice - 1];
  const passoSeguinte = passos[passoIndice + 1];
  const posicaoNaFase = faseAtiva?.passos.findIndex((passo) => passo.id === passoAtivo?.id) ?? -1;

  const focarPasso = () => {
    requestAnimationFrame(() => {
      const titulo = document.getElementById('passo-projeto-titulo');
      titulo?.focus({ preventScroll: true });
      titulo?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  };

  const abrirPasso = (faseId: string, passoId: string) => {
    setFaseEscolhidaId(faseId);
    setPassoEscolhidoId(passoId);
    setListaPassosAberta(false);
    focarPasso();
  };

  const abrirFase = (id: string) => {
    setFaseEscolhidaId(id);
    setPassoEscolhidoId(null);
    setListaPassosAberta(false);
  };

  return (
    <section
      id="implementacao-projeto"
      className={styles.implementacao}
      aria-labelledby="implementacao-titulo"
    >
      <header className={styles.secaoCabecalho}>
        <div>
          <h2 id="implementacao-titulo">Passo a passo</h2>
        </div>
        <div className={styles.progressoResumo}>
          <span>
            <strong>{feitas}</strong> de {todosIds.length} passos
          </span>
          <span
            className={styles.barra}
            role="progressbar"
            aria-label="Progresso do projeto"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentual(feitas, todosIds.length)}
            aria-valuetext={`${feitas} de ${todosIds.length} passos concluídos`}
          >
            <span style={{ transform: `scaleX(${percentual(feitas, todosIds.length) / 100})` }} />
          </span>
        </div>
      </header>
      <div className={styles.faseCompacta}>
        <label htmlFor="fase-projeto">
          Fase {faseAtivaIndice + 1} de {roteiro.fases.length}
        </label>
        <div>
          <select
            id="fase-projeto"
            value={faseAtivaId}
            onChange={(event) => abrirFase(event.target.value)}
            aria-label="Escolher fase do projeto"
          >
            {roteiro.fases.map((fase) => {
              const ids = fase.passos.map((passo) => idPassoProjeto(slug, fase.id, passo.id));
              const concluidos = contarEtapasFeitas(progresso, ids);
              return (
                <option key={fase.id} value={fase.id}>
                  {fase.titulo}
                  {concluidos === ids.length && ids.length > 0 ? ' · Concluída' : ''}
                </option>
              );
            })}
          </select>
          <ChevronDown size={18} aria-hidden="true" />
        </div>
      </div>
      <nav className={styles.fases} aria-label="Fases do projeto">
        {roteiro.fases.map((fase, indice) => {
          const ids = fase.passos.map((passo) => idPassoProjeto(slug, fase.id, passo.id));
          const concluidos = contarEtapasFeitas(progresso, ids);
          return (
            <button
              type="button"
              key={fase.id}
              data-ativa={fase.id === faseAtiva?.id || undefined}
              data-concluida={(ids.length > 0 && concluidos === ids.length) || undefined}
              aria-current={fase.id === faseAtiva?.id ? 'step' : undefined}
              onClick={() => abrirFase(fase.id)}
            >
              <span>
                {ids.length > 0 && concluidos === ids.length ? (
                  <Check size={17} aria-hidden="true" />
                ) : (
                  `0${indice + 1}`
                )}
              </span>
              <strong>{fase.titulo}</strong>
              <small>
                {ids.length > 0 && concluidos === ids.length
                  ? 'Concluída'
                  : `${concluidos} de ${ids.length} passos`}
              </small>
            </button>
          );
        })}
      </nav>
      {faseAtiva && passoAtivo && passoAtivoId ? (
        <div className={styles.faseCorpo}>
          <aside className={styles.passosDaFase} data-lista-aberta={listaPassosAberta || undefined}>
            <h2>{faseAtiva.titulo}</h2>
            <button
              type="button"
              className={styles.abrirPassos}
              aria-expanded={listaPassosAberta}
              aria-controls="passos-da-fase"
              onClick={() => setListaPassosAberta(!listaPassosAberta)}
            >
              <strong>
                Passo {posicaoNaFase + 1} de {faseAtiva.passos.length}
              </strong>
              <span>
                {listaPassosAberta ? 'Fechar lista' : 'Ver passos'}{' '}
                <ChevronDown size={16} aria-hidden="true" />
              </span>
            </button>
            <nav id="passos-da-fase" aria-label={`Passos da fase ${faseAtiva.titulo}`}>
              {faseAtiva.passos.map((passo, indice) => {
                const id = idPassoProjeto(slug, faseAtiva.id, passo.id);
                const concluido = Boolean(progresso.etapas[id]);
                return (
                  <button
                    type="button"
                    key={passo.id}
                    onClick={() => abrirPasso(faseAtiva.id, passo.id)}
                    data-ativo={passo.id === passoAtivo.id || undefined}
                    aria-current={passo.id === passoAtivo.id ? 'step' : undefined}
                    aria-label={concluido ? `Concluído: ${passo.titulo}` : passo.titulo}
                  >
                    <span aria-hidden="true">
                      {concluido ? (
                        <Check size={16} aria-label="Concluído" />
                      ) : (
                        String(indice + 1).padStart(2, '0')
                      )}
                    </span>
                    <strong>{passo.titulo}</strong>
                  </button>
                );
              })}
            </nav>
            <details className={styles.objetivoFase}>
              <summary>Objetivo desta fase</summary>
              <p>{faseAtiva.objetivo}</p>
            </details>
          </aside>
          <article className={styles.passoFoco}>
            <div className={styles.passoTitulo}>
              <div>
                <h3 id="passo-projeto-titulo" tabIndex={-1}>
                  {passoAtivo.titulo}
                </h3>
              </div>
              {passoAtivo.duracao ? (
                <span>
                  <Clock3 size={13} aria-hidden="true" /> {passoAtivo.duracao}
                </span>
              ) : null}
            </div>
            {!exemploPassoProjeto(slug, passoAtivo.id) ? (
              <p className={styles.passoAcao}>{passoAtivo.acao}</p>
            ) : null}
            <GuiaExecucaoPasso
              exemplo={exemploPassoProjeto(slug, passoAtivo.id)}
              key={passoAtivoId}
              passo={passoAtivo}
              concluido={Boolean(progresso.etapas[passoAtivoId])}
            />
            <button
              type="button"
              className={styles.concluirPasso}
              aria-pressed={Boolean(progresso.etapas[passoAtivoId])}
              aria-label={`${progresso.etapas[passoAtivoId] ? 'Reabrir' : 'Concluir'}: ${passoAtivo.titulo}`}
              onClick={() => {
                alternarEtapa(passoAtivoId, slug);
                focarPasso();
              }}
            >
              {progresso.etapas[passoAtivoId] ? (
                <>
                  <Check size={15} aria-hidden="true" /> Passo concluído
                </>
              ) : (
                'Concluir passo'
              )}
            </button>
          </article>
        </div>
      ) : null}
      <nav className={styles.navegacaoSequencial} aria-label="Navegação entre passos">
        {passoAnterior ? (
          <button
            type="button"
            onClick={() => abrirPasso(passoAnterior.fase.id, passoAnterior.passo.id)}
          >
            <ArrowLeft size={17} aria-hidden="true" /> Anterior
          </button>
        ) : (
          <span />
        )}
        {passoSeguinte ? (
          <button
            type="button"
            onClick={() => abrirPasso(passoSeguinte.fase.id, passoSeguinte.passo.id)}
          >
            Próximo passo <ArrowRight size={17} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={onIrMateriais}>
            Ver materiais <ArrowRight size={17} aria-hidden="true" />
          </button>
        )}
      </nav>
    </section>
  );
}
