'use client';

import { useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/design-system/via';
import type { PlanoCall } from '@/lib/calls/plano';
import type { PontoRoteiro } from '@/lib/calls/posicao-roteiro';
import styles from './RoteiroPreparacao.module.css';

const MOMENTOS = [
  { id: 'abertura', rotulo: 'Como abrir' },
  { id: 'perguntas', rotulo: 'Perguntas' },
  { id: 'fechamento', rotulo: 'Como fechar' },
] as const;
const ETAPAS = {
  contexto: 'Abrir',
  processo: 'Entender',
  impacto: 'Dimensionar',
  decisao: 'Combinar',
} as const;

export function RoteiroPreparacao({
  plano,
  kickoff,
  compacto = false,
  navegacao,
}: {
  plano: Pick<PlanoCall, 'abertura' | 'perguntas' | 'fechamento'>;
  kickoff: boolean;
  compacto?: boolean;
  navegacao?: { posicao: PontoRoteiro; aoMudar: (posicao: PontoRoteiro) => void };
}) {
  const id = useId();
  const [local, setLocal] = useState<PontoRoteiro>({ momento: 'perguntas', indice: 0 });
  const { momento, indice } = navegacao?.posicao ?? local;
  const atualizar = navegacao?.aoMudar ?? setLocal;
  const perguntaRef = useRef<HTMLHeadingElement>(null);
  const roteiroRef = useRef<HTMLElement>(null);
  const listaRef = useRef<HTMLDetailsElement>(null);
  const posicao = Math.min(indice, Math.max(0, plano.perguntas.length - 1));
  const pergunta = plano.perguntas[posicao];

  function escolherMomento(valor: (typeof MOMENTOS)[number]['id']) {
    atualizar({ momento: valor, indice });
    if (compacto)
      requestAnimationFrame(() => roteiroRef.current?.scrollIntoView?.({ block: 'start' }));
  }
  function escolherPergunta(valor: number) {
    atualizar({ momento, indice: valor });
    if (compacto)
      requestAnimationFrame(() => {
        perguntaRef.current?.scrollIntoView?.({ block: 'nearest' });
      });
  }

  return (
    <section
      ref={roteiroRef}
      className={styles.roteiro}
      data-compacto={compacto || undefined}
      aria-label="Roteiro da reunião"
    >
      <nav className={styles.momentos} aria-label="Momentos do roteiro">
        {MOMENTOS.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={momento === item.id}
            aria-controls={`${id}-painel`}
            onClick={() => escolherMomento(item.id)}
          >
            {item.rotulo}
          </button>
        ))}
      </nav>
      <div id={`${id}-painel`} className={styles.painel}>
        {momento === 'abertura' ? (
          <div className={styles.fala}>
            <h2>Uma forma de abrir</h2>
            <blockquote>{plano.abertura}</blockquote>
            <Button
              variant="secondary"
              className={styles.botao}
              onClick={() => escolherMomento('perguntas')}
              iconRight={<ArrowRight size={18} aria-hidden="true" />}
            >
              Ir para as perguntas
            </Button>
          </div>
        ) : momento === 'fechamento' ? (
          <div className={styles.fechamento}>
            <h2>{kickoff ? 'Confirmar o acordo' : 'Combinar o próximo passo'}</h2>
            <p className={styles.condicao}>{plano.fechamento.sinalParaAvancar}</p>
            <blockquote>{plano.fechamento.frase}</blockquote>
            <div className={styles.proximo}>
              <h3>Próximo passo sugerido</h3>
              <p>{plano.fechamento.proximoPasso}</p>
            </div>
          </div>
        ) : (
          <>
            <header className={styles.cabecalho}>
              <h2>{kickoff ? 'Acordos essenciais' : 'Perguntas essenciais'}</h2>
              <span>
                {plano.perguntas.length} {plano.perguntas.length === 1 ? 'pergunta' : 'perguntas'}
              </span>
            </header>
            {pergunta ? (
              <>
                <div className={styles.pergunta}>
                  <div aria-live="polite" aria-atomic="true">
                    <p className={styles.etapa}>
                      {ETAPAS[pergunta.etapa]}
                      <span>
                        {posicao + 1} de {plano.perguntas.length}
                      </span>
                    </p>
                    <h3 ref={perguntaRef} tabIndex={-1}>
                      {pergunta.pergunta}
                    </h3>
                  </div>
                  {(pergunta.intencao || pergunta.projetoRelacionado) && (
                    <details className={styles.intencao} key={`${posicao}-${pergunta.pergunta}`}>
                      <summary>
                        O que entender
                        <ChevronDown size={17} aria-hidden="true" />
                      </summary>
                      {pergunta.intencao && <p>{pergunta.intencao}</p>}
                      {pergunta.projetoRelacionado && (
                        <p className={styles.relacao}>
                          Projeto em análise: {pergunta.projetoRelacionado}
                        </p>
                      )}
                    </details>
                  )}
                </div>
                <div className={styles.navegar}>
                  <Button
                    variant="secondary"
                    className={styles.botao}
                    disabled={posicao === 0}
                    onClick={() => escolherPergunta(posicao - 1)}
                    aria-label="Pergunta anterior"
                    iconLeft={<ArrowLeft size={18} aria-hidden="true" />}
                  >
                    Anterior
                  </Button>
                  {posicao < plano.perguntas.length - 1 ? (
                    <Button
                      className={styles.botao}
                      onClick={() => escolherPergunta(posicao + 1)}
                      aria-label="Próxima pergunta"
                      iconRight={<ArrowRight size={18} aria-hidden="true" />}
                    >
                      Próxima
                    </Button>
                  ) : (
                    <Button
                      className={styles.botao}
                      onClick={() => escolherMomento('fechamento')}
                      iconRight={<ArrowRight size={18} aria-hidden="true" />}
                    >
                      Ver fechamento
                    </Button>
                  )}
                </div>
                <details ref={listaRef} className={styles.lista}>
                  <summary>
                    Ver todas as perguntas
                    <ChevronDown size={18} aria-hidden="true" />
                  </summary>
                  <ol aria-label="Todas as perguntas">
                    {plano.perguntas.map((item, i) => (
                      <li key={`${i}-${item.pergunta}`}>
                        <button
                          type="button"
                          aria-current={i === posicao ? 'step' : undefined}
                          onClick={() => {
                            escolherPergunta(i);
                            if (listaRef.current) listaRef.current.open = false;
                            perguntaRef.current?.focus();
                          }}
                        >
                          <span>{i + 1}</span>
                          <span>{item.pergunta}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </details>
              </>
            ) : (
              <p className={styles.vazio}>
                Não há perguntas neste roteiro. Use o objetivo da reunião para conduzir a conversa;
                a abertura e o fechamento continuam disponíveis.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
