'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3 } from 'lucide-react';
import { idPassoProjeto, idsPassosProjeto, type RoteiroProjeto } from '@/lib/projetos/roteiro';
import {
  contarEtapasFeitas,
  percentual,
  useAcoesProgresso,
  useProgresso,
} from '@/lib/progresso/local';
import { GuiaExecucaoPasso } from './GuiaExecucaoPasso';
import styles from './ProjetoGuiadoNovo.module.css';

export function ImplementacaoProjeto({ slug, roteiro }: { slug: string; roteiro: RoteiroProjeto }) {
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
  const faseAtivaId = faseEscolhidaId ?? proximoPasso?.fase.id ?? roteiro.fases[0]?.id ?? '';
  const faseAtiva =
    roteiro.fases.find((fase) => fase.id === faseAtivaId) ?? roteiro.fases[0] ?? null;
  const faseAtivaIndice = faseAtiva
    ? roteiro.fases.findIndex((fase) => fase.id === faseAtiva.id)
    : -1;
  const idsFaseAtiva = faseAtiva
    ? faseAtiva.passos.map((passo) => idPassoProjeto(slug, faseAtiva.id, passo.id))
    : [];
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
  const faseAnterior = faseAtivaIndice > 0 ? (roteiro.fases[faseAtivaIndice - 1] ?? null) : null;
  const proximaFase = faseAtivaIndice >= 0 ? (roteiro.fases[faseAtivaIndice + 1] ?? null) : null;

  const abrirFase = (id: string, mover = false) => {
    setFaseEscolhidaId(id);
    setPassoEscolhidoId(null);
    if (mover)
      requestAnimationFrame(() =>
        document
          .getElementById('implementacao-projeto')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
  };

  return (
    <section
      id="implementacao-projeto"
      className={styles.implementacao}
      aria-labelledby="implementacao-titulo"
    >
      <header className={styles.secaoCabecalho}>
        <div>
          <p className={styles.eyebrow}>2 · Implemente</p>
          <h2 id="implementacao-titulo">Construa em cinco fases</h2>
          <span>Abra uma fase, faça o passo em foco e marque quando estiver pronto.</span>
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
          >
            <span style={{ transform: `scaleX(${percentual(feitas, todosIds.length) / 100})` }} />
          </span>
        </div>
      </header>
      <nav className={styles.fases} aria-label="Fases do projeto">
        {roteiro.fases.map((fase, indice) => {
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
              <span>{concluidos === ids.length ? <Check size={13} /> : `0${indice + 1}`}</span>
              <strong>{fase.titulo}</strong>
              <small>
                {concluidos}/{ids.length}
              </small>
            </button>
          );
        })}
      </nav>
      {faseAtiva && passoAtivo && passoAtivoId ? (
        <div className={styles.faseCorpo}>
          <aside className={styles.passosDaFase}>
            <p>Passos desta fase</p>
            <nav aria-label={`Passos da fase ${faseAtiva.titulo}`}>
              {faseAtiva.passos.map((passo, indice) => {
                const id = idPassoProjeto(slug, faseAtiva.id, passo.id);
                const concluido = Boolean(progresso.etapas[id]);
                return (
                  <button
                    type="button"
                    key={passo.id}
                    onClick={() => setPassoEscolhidoId(passo.id)}
                    data-ativo={passo.id === passoAtivo.id || undefined}
                  >
                    <span>
                      {concluido ? <Check size={12} /> : String(indice + 1).padStart(2, '0')}
                    </span>
                    <strong>{passo.titulo}</strong>
                  </button>
                );
              })}
            </nav>
          </aside>
          <article className={styles.passoFoco}>
            <header>
              <div>
                <p>Fase {String(faseAtivaIndice + 1).padStart(2, '0')}</p>
                <h2>{faseAtiva.titulo}</h2>
                <span>{faseAtiva.objetivo}</span>
              </div>
              <strong>
                {contarEtapasFeitas(progresso, idsFaseAtiva)}/{idsFaseAtiva.length}
              </strong>
            </header>
            <div className={styles.passoTitulo}>
              <div>
                <p>Passo em foco</p>
                <h3>{passoAtivo.titulo}</h3>
              </div>
              {passoAtivo.duracao ? (
                <span>
                  <Clock3 size={13} aria-hidden="true" /> {passoAtivo.duracao}
                </span>
              ) : null}
            </div>
            <p className={styles.passoAcao}>{passoAtivo.acao}</p>
            <GuiaExecucaoPasso
              passo={passoAtivo}
              atual={proximoPasso?.id === passoAtivoId}
              concluido={Boolean(progresso.etapas[passoAtivoId])}
            />
            <dl className={styles.criteriosPasso}>
              <div>
                <dt>Pronto quando</dt>
                <dd>{passoAtivo.concluidoQuando}</dd>
              </div>
              <div>
                <dt>Você entrega</dt>
                <dd>{passoAtivo.entregavel}</dd>
              </div>
            </dl>
            <button
              type="button"
              className={styles.concluirPasso}
              aria-pressed={Boolean(progresso.etapas[passoAtivoId])}
              aria-label={`${progresso.etapas[passoAtivoId] ? 'Reabrir' : 'Concluir'}: ${passoAtivo.titulo}`}
              onClick={() => alternarEtapa(passoAtivoId, slug)}
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
      <nav className={styles.navegacaoSequencial} aria-label="Navegação entre fases">
        {faseAnterior ? (
          <button type="button" onClick={() => abrirFase(faseAnterior.id, true)}>
            <ArrowLeft size={15} aria-hidden="true" /> {faseAnterior.titulo}
          </button>
        ) : (
          <span />
        )}
        {proximaFase ? (
          <button type="button" onClick={() => abrirFase(proximaFase.id, true)}>
            {proximaFase.titulo} <ArrowRight size={15} aria-hidden="true" />
          </button>
        ) : (
          <a href="#kit-projeto">
            Abrir kit de implementação <ArrowRight size={15} aria-hidden="true" />
          </a>
        )}
      </nav>
    </section>
  );
}
