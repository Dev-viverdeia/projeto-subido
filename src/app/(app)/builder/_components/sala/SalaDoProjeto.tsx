'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import type { SolucaoBuilder } from '@/lib/builder/queries';
import { ETAPAS, contarTarefas, etapaInicial, motivoDoCadeado, type IdEtapa } from './etapas';
import styles from './SalaDoProjeto.module.css';

/** Painéis recebidos do servidor; navegação não registra conclusão. */
export function SalaDoProjeto({
  solucao,
  criacao,
  entender,
  kit,
  construir,
}: {
  solucao: SolucaoBuilder;
  criacao: ReactNode;
  entender: ReactNode;
  kit: ReactNode;
  construir: ReactNode;
}) {
  const [escolhida, setEscolhida] = useState<IdEtapa | null>(() => etapaInicial(solucao));
  const etapa = escolhida ?? etapaInicial(solucao);
  const uid = useId();
  const abas = useRef<HTMLDivElement>(null);
  const { feitas, total } = contarTarefas(solucao);
  const paineis: Record<IdEtapa, ReactNode> = { criacao, entender, kit, construir };
  const indice = ETAPAS.findIndex((item) => item.id === etapa);
  const cadeadoAtual = motivoDoCadeado(etapa, solucao);
  const proxima = ETAPAS[indice + 1];

  const abrir = (id: IdEtapa) => {
    if (motivoDoCadeado(id, solucao)) return;
    setEscolhida(id);
    abas.current?.querySelector<HTMLButtonElement>('[data-etapa="' + id + '"]')?.focus();
  };

  return (
    <div className={styles.sala}>
      <header className={styles.hero}>
        <div className={styles.heroTexto}>
          <h1 className={styles.titulo}>{solucao.titulo || 'Seu projeto personalizado'}</h1>
          {!solucao.documento ? (
            <p className={styles.resumo}>Preparando o plano. Você pode voltar depois.</p>
          ) : null}
        </div>
        {total > 0 ? (
          <div
            className={styles.medida}
            role="progressbar"
            aria-label="Tarefas do Estúdio"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={feitas}
            aria-valuetext={feitas + ' de ' + total + ' tarefas concluídas'}
          >
            <p className={styles.contagem}>
              <strong>
                {feitas} de {total}
              </strong>{' '}
              tarefas concluídas
            </p>
            <div className={styles.trilho} aria-hidden="true">
              <span
                className={styles.preenchido}
                style={{ transform: 'scaleX(' + feitas / total + ')' }}
              />
            </div>
          </div>
        ) : null}
      </header>

      <div className={styles.superficie}>
        <div ref={abas} role="tablist" aria-label="Etapas do projeto" className={styles.stepper}>
          {ETAPAS.map((item, i) => {
            const motivo = motivoDoCadeado(item.id, solucao);
            const ativa = item.id === etapa;
            // Só fatos persistidos recebem um visto; abrir Entender não prova leitura.
            const fato =
              item.id === 'criacao' && solucao.documento
                ? 'Plano disponível'
                : item.id === 'kit' && solucao.stack
                  ? 'Ferramenta escolhida'
                  : item.id === 'construir' && total > 0 && feitas === total
                    ? 'Tarefas concluídas'
                    : null;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                data-etapa={item.id}
                id={uid + '-' + item.id}
                aria-controls={uid + '-painel'}
                aria-selected={ativa}
                aria-disabled={Boolean(motivo)}
                tabIndex={ativa ? 0 : -1}
                aria-describedby={motivo ? uid + '-motivo-' + item.id : undefined}
                className={styles.degrau}
                data-ativa={ativa || undefined}
                onClick={() => abrir(item.id)}
                onKeyDown={(event) => {
                  const destino =
                    event.key === 'ArrowRight'
                      ? (i + 1) % ETAPAS.length
                      : event.key === 'ArrowLeft'
                        ? (i - 1 + ETAPAS.length) % ETAPAS.length
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? ETAPAS.length - 1
                            : null;
                  if (destino === null) return;
                  event.preventDefault();
                  const alvo = ETAPAS[destino]!;
                  // Abas indisponíveis recebem foco e motivo, não um painel vazio.
                  if (motivoDoCadeado(alvo.id, solucao))
                    abas.current
                      ?.querySelector<HTMLButtonElement>('[data-etapa="' + alvo.id + '"]')
                      ?.focus();
                  else abrir(alvo.id);
                }}
              >
                {motivo ? (
                  <LockKeyhole size={16} aria-hidden="true" />
                ) : fato ? (
                  <Check size={17} aria-hidden="true" />
                ) : null}
                {item.rotulo}
                {fato ? <span className={styles.srOnly}>{fato}</span> : null}
                {motivo ? (
                  <span id={uid + '-motivo-' + item.id} className={styles.srOnly}>
                    {motivo}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <section
          key={etapa}
          id={uid + '-painel'}
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={uid + '-' + etapa}
          className={styles.painel}
        >
          {cadeadoAtual ? <p className={styles.resumo}>{cadeadoAtual}</p> : paineis[etapa]}
          {!cadeadoAtual && proxima && !motivoDoCadeado(proxima.id, solucao) ? (
            <div className={styles.avancoLinha}>
              <button className={styles.avanco} type="button" onClick={() => abrir(proxima.id)}>
                {proxima.id === 'construir' ? 'Abrir tarefas' : 'Abrir ' + proxima.rotulo}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
