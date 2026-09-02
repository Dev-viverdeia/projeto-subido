import type { ReactNode } from 'react';
import styles from './CabecalhoOperacional.module.css';

/**
 * Cabeçalho das telas de trabalho.
 *
 * O título localiza, a descrição explica a tarefa e a área à direita guarda
 * somente o próximo comando global ou uma leitura compacta da tela.
 */
export function CabecalhoOperacional({
  titulo,
  descricao,
  acao,
  resumo,
}: {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
  resumo?: ReactNode;
}) {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.textos}>
        <h1>{titulo}</h1>
        <p>{descricao}</p>
      </div>

      {(resumo || acao) && (
        <div className={styles.comandos}>
          {resumo}
          {acao && <div className={styles.acao}>{acao}</div>}
        </div>
      )}
    </header>
  );
}
