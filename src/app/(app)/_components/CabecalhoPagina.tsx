import type { ReactNode } from 'react';
import styles from './CabecalhoPagina.module.css';

/**
 * Cabeçalho das telas da plataforma. Server Component.
 *
 * O `<h1>` mora AQUI, não em cada página. Isso garante que exista exatamente um por
 * rota — a landing de referência tinha telas com dois e telas com nenhum, e nenhum
 * `tsc` ou `eslint` detecta isso.
 */
export function CabecalhoPagina({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <header className={styles.cabecalho}>
      <div className={styles.textos}>
        <h1 className={styles.titulo}>{titulo}</h1>
        {descricao && <p className={styles.descricao}>{descricao}</p>}
      </div>
      {acao && <div className={styles.acao}>{acao}</div>}
    </header>
  );
}
