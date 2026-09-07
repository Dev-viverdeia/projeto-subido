'use client';

import { useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, MessageSquare, Route, Target } from 'lucide-react';
import {
  obterRoteiroCall,
  ROTULO_ETAPA_CALL,
  type DossieEnriquecido,
} from '@/lib/crm/enriquecimento';
import styles from './PrepararConversa.module.css';

const MOMENTOS = [
  { id: 'abertura', rotulo: 'Abrir a conversa', icone: <MessageSquare size={18} /> },
  { id: 'perguntas', rotulo: 'Explorar perguntas', icone: <Route size={18} /> },
  { id: 'acordo', rotulo: 'Combinar próximo passo', icone: <Target size={18} /> },
] as const;

export function PrepararConversa({ dossie }: { dossie: DossieEnriquecido }) {
  const id = useId();
  const [momento, setMomento] = useState<(typeof MOMENTOS)[number]['id']>('perguntas');
  const [indice, setIndice] = useState(0);
  const perguntaRef = useRef<HTMLHeadingElement>(null);
  const listaRef = useRef<HTMLDetailsElement>(null);
  const roteiro = obterRoteiroCall(dossie);
  const pergunta = roteiro.perguntas[indice] ?? roteiro.perguntas[0];
  const etapas = [...new Set(roteiro.perguntas.map((item) => item.etapa))];

  return (
    <div className={styles.preparo}>
      <nav className={styles.momentos} aria-label="Preparação da reunião">
        {MOMENTOS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={momento === item.id}
            onClick={() => setMomento(item.id)}
          >
            <span aria-hidden="true">{item.icone}</span>
            {item.rotulo}
          </button>
        ))}
      </nav>
      {momento === 'abertura' ? (
        <section className={styles.abertura} aria-label="Abertura da reunião">
          <div>
            <h3>Objetivo da reunião</h3>
            <p>{roteiro.objetivo}</p>
          </div>
          <div className={styles.fala}>
            <span>Você pode abrir assim</span>
            <blockquote>{roteiro.abertura}</blockquote>
          </div>
          <button className={styles.proxima} type="button" onClick={() => setMomento('perguntas')}>
            Ir para as perguntas <ArrowRight size={18} aria-hidden="true" />
          </button>
        </section>
      ) : momento === 'acordo' ? (
        <section className={styles.abertura} aria-labelledby={`${id}-acordo`}>
          <div>
            <h3 id={`${id}-acordo`}>Saia com um próximo passo combinado</h3>
            <p>{roteiro.fechamento.sinalParaAvancar}</p>
          </div>
          <div className={styles.fala}>
            <span>Se houver aderência</span>
            <blockquote>{roteiro.fechamento.frase}</blockquote>
          </div>
          <div className={styles.resultado}>
            <Target size={22} aria-hidden="true" />
            <div>
              <span>Próximo passo indicado</span>
              <p>{roteiro.fechamento.proximoPasso}</p>
            </div>
          </div>
        </section>
      ) : (
        <div className={styles.grade}>
          <section className={styles.roteiro} aria-labelledby={`${id}-roteiro`}>
            <header className={styles.cabecalho}>
              <h3 id={`${id}-roteiro`}>Roteiro da reunião</h3>
              <span>{roteiro.perguntas.length} perguntas</span>
            </header>
            <nav className={styles.etapas} aria-label="Etapas da conversa">
              {etapas.map((etapa) => (
                <button
                  type="button"
                  key={etapa}
                  aria-pressed={pergunta?.etapa === etapa}
                  onClick={() =>
                    setIndice(roteiro.perguntas.findIndex((item) => item.etapa === etapa))
                  }
                >
                  {ROTULO_ETAPA_CALL[etapa]}
                </button>
              ))}
            </nav>
            {pergunta ? (
              <>
                <div className={styles.pergunta} aria-live="polite" aria-atomic="true">
                  <span className={styles.contagem}>
                    {indice + 1} de {roteiro.perguntas.length}
                  </span>
                  <h4 ref={perguntaRef} tabIndex={-1}>
                    {pergunta.pergunta}
                  </h4>
                  <p className={styles.intencao}>{pergunta.intencao}</p>
                  {pergunta.projetoRelacionado ? (
                    <span className={styles.relacao}>
                      Projeto em análise: {pergunta.projetoRelacionado}
                    </span>
                  ) : null}
                </div>
                <div className={styles.navegar}>
                  <button
                    type="button"
                    disabled={indice === 0}
                    onClick={() => setIndice(indice - 1)}
                    aria-label="Pergunta anterior"
                  >
                    <ArrowLeft size={18} aria-hidden="true" /> Anterior
                  </button>
                  <button
                    className={styles.proxima}
                    type="button"
                    disabled={indice === roteiro.perguntas.length - 1}
                    onClick={() => setIndice(indice + 1)}
                    aria-label="Próxima pergunta"
                  >
                    Próxima <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
                <details ref={listaRef} className={styles.listaCompleta}>
                  <summary>
                    Ver todas as perguntas <ChevronDown size={17} aria-hidden="true" />
                  </summary>
                  <ol aria-label="Todas as perguntas">
                    {roteiro.perguntas.map((item, posicao) => (
                      <li key={`${item.pergunta}-${posicao}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setIndice(posicao);
                            if (listaRef.current) listaRef.current.open = false;
                            perguntaRef.current?.focus();
                          }}
                        >
                          <span>{posicao + 1}</span>
                          <span>{item.pergunta}</span>
                          <ArrowRight size={16} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </details>
              </>
            ) : (
              <p className={styles.vazio}>Nenhuma pergunta disponível nesta pesquisa.</p>
            )}
          </section>
          <section className={styles.projetos} aria-labelledby={`${id}-projetos`}>
            <header>
              <Target size={20} aria-hidden="true" />
              <h3 id={`${id}-projetos`}>Projetos para validar</h3>
            </header>
            <p className={styles.legenda}>Hipóteses, não uma proposta pronta.</p>
            {dossie.oportunidades.length ? (
              dossie.oportunidades.map((item, posicao) => (
                <details key={`${item.titulo}-${posicao}`} className={styles.projeto}>
                  <summary>
                    <span>{item.titulo}</span>
                    <ChevronDown size={18} aria-hidden="true" />
                  </summary>
                  <dl>
                    <div>
                      <dt>Sinal encontrado</dt>
                      <dd>{item.porQueAgora}</dd>
                    </div>
                    <div>
                      <dt>Valor a confirmar</dt>
                      <dd>{item.impacto}</dd>
                    </div>
                  </dl>
                </details>
              ))
            ) : (
              <p className={styles.vazio}>
                Valide o problema na reunião antes de escolher um projeto.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
