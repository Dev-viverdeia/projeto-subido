import type { ReactNode } from 'react';
import styles from './CabecalhoPagina.module.css';

/**
 * Cabeçalho das telas da plataforma. Server Component.
 *
 * O `<h1>` mora AQUI, não em cada página. Isso garante que exista exatamente um por
 * rota — a landing de referência tinha telas com dois e telas com nenhum, e nenhum
 * `tsc` ou `eslint` detecta isso.
 *
 * MODO `oculto` — o título continua existindo, só não ocupa a tela.
 * Nas telas de índice o título repetia o rótulo que o cabeçalho do app já mostra,
 * e um bloco de ~120px para dizer duas vezes a mesma palavra é caro no alto da
 * página. Com `oculto`, o `<h1>` vira `sr-only`: some para quem vê e permanece
 * para quem ouve e para o buscador.
 *
 * Isso NÃO é o mesmo que apagar o componente. Apagar deixaria a rota sem `<h1>`
 * nenhum — exatamente o defeito que este arquivo existe para impedir. E como a
 * `acao` (botão "Nova …", contador do catálogo) é função e não decoração, ela
 * continua visível: sai só o texto redundante.
 */
export function CabecalhoPagina({
  titulo,
  descricao,
  acao,
  oculto = false,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  /** Esconde título e descrição VISUALMENTE. O `<h1>` continua na árvore. */
  oculto?: boolean;
}) {
  if (oculto) {
    /* Sem `acao`, NADA de wrapper: `.sr-only` é `position: absolute`, então o
       `<h1>` sai do fluxo e não ocupa nada. Um `<header>` de altura zero em volta
       pareceria inofensivo e não é — ele continua sendo um item flex da página e
       consome o `gap` dos dois lados. Medido: 20px de vão fantasma no topo. */
    if (!acao) return <h1 className="sr-only">{titulo}</h1>;

    return (
      <header className={styles.somenteAcao}>
        <h1 className="sr-only">{titulo}</h1>
        {acao}
      </header>
    );
  }

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
