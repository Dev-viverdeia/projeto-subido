import { ChevronDown } from 'lucide-react';
import type { PassoProjeto } from '@/lib/projetos/roteiro';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import styles from './ProjetoGuiado.module.css';

export function GuiaExecucaoPasso({
  passo,
  atual,
  concluido,
}: {
  passo: PassoProjeto;
  atual: boolean;
  concluido: boolean;
}) {
  const temGuia =
    passo.insumos.length > 0 ||
    passo.execucao.length > 0 ||
    Boolean(passo.atencao) ||
    Boolean(passo.modelo);

  if (!temGuia) return null;

  return (
    <details className={styles.guia} open={atual && !concluido ? true : undefined}>
      <summary>
        <span>
          Guia de execução
          <small>
            {passo.execucao.length > 0
              ? `${passo.execucao.length} ações em ordem`
              : 'Orientação prática'}
          </small>
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </summary>

      <div className={styles.guiaCorpo}>
        {passo.insumos.length > 0 ? (
          <section className={styles.insumos}>
            <h4>Separe antes de começar</h4>
            <ul>
              {passo.insumos.map((insumo) => (
                <li key={insumo}>{insumo}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {passo.execucao.length > 0 ? (
          <section className={styles.execucao}>
            <h4>Faça nesta ordem</h4>
            <ol>
              {passo.execucao.map((acao, indice) => (
                <li key={acao}>
                  <span>{String(indice + 1).padStart(2, '0')}</span>
                  <p>{acao}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {passo.atencao ? (
          <aside className={styles.atencao}>
            <strong>Evite este erro</strong>
            <p>{passo.atencao}</p>
          </aside>
        ) : null}

        {passo.modelo ? (
          <section className={styles.modelo}>
            <header>
              <div>
                <span>Modelo pronto</span>
                <h4>{passo.modelo.titulo}</h4>
              </div>
              <BotaoCopiar texto={passo.modelo.conteudo} rotuloDoQue={passo.modelo.titulo} />
            </header>
            <pre tabIndex={0} role="region" aria-label={`Modelo: ${passo.modelo.titulo}`}>
              {passo.modelo.conteudo}
            </pre>
          </section>
        ) : null}
      </div>
    </details>
  );
}
