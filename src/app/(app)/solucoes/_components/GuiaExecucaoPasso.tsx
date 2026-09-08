'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  Play,
  PanelsTopLeft,
} from 'lucide-react';
import type { PassoProjeto } from '@/lib/projetos/roteiro';
import type { ExemploProjeto as Exemplo } from '@/lib/projetos/exemplo-projeto';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import { ExemploProjeto } from './ExemploProjeto';
import styles from './LeituraProjeto.module.css';

export function GuiaExecucaoPasso({
  passo,
  concluido,
  exemplo,
}: {
  passo: PassoProjeto;
  concluido: boolean;
  exemplo?: Exemplo | null;
}) {
  const [aba, setAba] = useState<'exemplo' | 'insumos' | 'execucao' | 'conferencia'>(
    concluido ? 'conferencia' : exemplo ? 'exemplo' : 'execucao',
  );
  const [acao, setAcao] = useState(0);
  const acoes = passo.execucao.length ? passo.execucao : [passo.acao];

  return (
    <section className={styles.guia} aria-label="Guia de execução">
      <nav
        className={styles.modulos}
        data-com-exemplo={Boolean(exemplo) || undefined}
        aria-label="Como executar este passo"
      >
        {exemplo ? (
          <button type="button" aria-pressed={aba === 'exemplo'} onClick={() => setAba('exemplo')}>
            <PanelsTopLeft size={18} aria-hidden="true" />
            Exemplo
          </button>
        ) : null}
        <button type="button" aria-pressed={aba === 'insumos'} onClick={() => setAba('insumos')}>
          <ClipboardList size={18} aria-hidden="true" />
          Separar
        </button>
        <button type="button" aria-pressed={aba === 'execucao'} onClick={() => setAba('execucao')}>
          <Play size={18} aria-hidden="true" />
          Executar
        </button>
        <button
          type="button"
          aria-pressed={aba === 'conferencia'}
          onClick={() => setAba('conferencia')}
        >
          <FileCheck2 size={18} aria-hidden="true" />
          Conferir
        </button>
      </nav>
      <div className={styles.corpoGuia}>
        {aba === 'exemplo' && exemplo ? (
          <>
            <ExemploProjeto exemplo={exemplo} />
            <div className={styles.navegar}>
              <button type="button" onClick={() => setAba('insumos')}>
                Preparar este passo <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : aba === 'insumos' ? (
          <section>
            <h4>Separe antes de começar</h4>
            {passo.insumos.length ? (
              <ul className={styles.lista}>
                {passo.insumos.map((item) => (
                  <li key={item}>
                    <ClipboardList size={18} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Este passo não pede materiais adicionais.</p>
            )}
            {exemplo ? (
              <div className={styles.navegar}>
                <button type="button" onClick={() => setAba('execucao')}>
                  Ir para execução <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </section>
        ) : aba === 'conferencia' ? (
          <dl className={styles.conferencia}>
            <div>
              <dt>
                <FileCheck2 size={20} aria-hidden="true" />
                Você entrega
              </dt>
              <dd>{passo.entregavel}</dd>
            </div>
            <div>
              <dt>
                <Check size={20} aria-hidden="true" />
                Pronto quando
              </dt>
              <dd>{passo.concluidoQuando}</dd>
            </div>
          </dl>
        ) : (
          <>
            <section
              className={styles.acaoFoco}
              aria-label="Ação em foco"
              aria-live="polite"
              aria-atomic="true"
            >
              <span>
                Ação {acao + 1} de {acoes.length}
              </span>
              <p>{acoes[acao]}</p>
            </section>
            <nav className={styles.acoes} aria-label="Ações deste passo">
              {acoes.map((_, indice) => (
                <button
                  key={indice}
                  type="button"
                  aria-label={`Ler ação ${indice + 1}`}
                  aria-pressed={acao === indice}
                  onClick={() => setAcao(indice)}
                >
                  {indice + 1}
                </button>
              ))}
            </nav>
            <div className={styles.navegar}>
              <button
                type="button"
                disabled={acao === 0}
                onClick={() => setAcao(acao - 1)}
                aria-label="Ação anterior"
              >
                <ArrowLeft size={17} aria-hidden="true" />
                Anterior
              </button>
              {acao < acoes.length - 1 ? (
                <button type="button" onClick={() => setAcao(acao + 1)} aria-label="Próxima ação">
                  Próxima
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" onClick={() => setAba('conferencia')}>
                  Conferir passo
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              )}
            </div>
            {acoes.length > 1 ? (
              <details className={styles.detalhe}>
                <summary>
                  Ver todas as ações
                  <ChevronDown size={17} aria-hidden="true" />
                </summary>
                <ol className={styles.todasAcoes}>
                  {acoes.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </details>
            ) : null}
            {exemplo ? (
              <details className={styles.detalhe}>
                <summary>
                  Orientação deste passo <ChevronDown size={17} aria-hidden="true" />
                </summary>
                <p>{passo.acao}</p>
              </details>
            ) : null}
          </>
        )}
        {passo.atencao ? (
          <details className={styles.detalhe}>
            <summary>
              Cuidado neste passo
              <ChevronDown size={17} aria-hidden="true" />
            </summary>
            <p>{passo.atencao}</p>
          </details>
        ) : null}
      </div>
      {passo.modelo ? (
        <details className={styles.modelo}>
          <summary>
            <span>
              {passo.modelo.titulo}
              <small>Modelo para copiar</small>
            </span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <div>
            <BotaoCopiar texto={passo.modelo.conteudo} rotuloDoQue={passo.modelo.titulo} />
            <pre tabIndex={0} role="region" aria-label={`Modelo: ${passo.modelo.titulo}`}>
              {passo.modelo.conteudo}
            </pre>
          </div>
        </details>
      ) : null}
    </section>
  );
}
