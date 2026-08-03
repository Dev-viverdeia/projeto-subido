'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { rotuloDaRota } from '@/lib/routes';
import { useTrilha } from './contexto';
import styles from './TrilhaDoCabecalho.module.css';

/**
 * O lado esquerdo do cabeçalho: trilha quando a tela declara uma, nome da seção
 * quando não.
 *
 * OS DOIS ESTADOS MORAM NO MESMO COMPONENTE de propósito. Separá-los em dois
 * exigiria que alguém acima soubesse qual mostrar — e esse "alguém" seria o
 * cabeçalho, que passaria a ramificar por rota. Aqui a regra é uma linha: tem
 * trilha? mostra a trilha. Não tem? mostra a seção.
 *
 * NÃO USA O `Breadcrumb` DO DS por dois motivos medidos: ele navega com
 * `<a href>`, o que faz recarga completa e perderia os filtros do catálogo que
 * vivem na URL; e importa `lucide` num componente que aqui é cliente, o que
 * puxaria a biblioteca para o bundle do browser. O chevron é SVG inline.
 *
 * TRÊS DEGRAUS NO MÁXIMO, e o do meio é opcional. O cabeçalho tem uma linha só;
 * trilha que cresce com a profundidade da rota vira linha que ninguém lê.
 */
function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 3.5 5.5 8l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrilhaDoCabecalho() {
  const trilha = useTrilha();
  const caminho = usePathname();

  if (!trilha) {
    const secao = rotuloDaRota(caminho);
    if (!secao) return null;
    /* `aria-hidden`: é eco do `<h1>` da página, que existe como `sr-only`. Quem
       ouve não precisa da seção duas vezes por rota. */
    return (
      <span className={styles.secao} aria-hidden="true">
        {secao}
      </span>
    );
  }

  return (
    <nav className={styles.trilha} aria-label="Caminho de navegação">
      <Link href={trilha.voltarPara} className={styles.voltar}>
        <Chevron />
        {trilha.voltarRotulo}
      </Link>

      {trilha.meio && (
        <>
          <span className={styles.barra} aria-hidden="true">
            /
          </span>
          <span className={styles.meio}>{trilha.meio}</span>
        </>
      )}

      <span className={styles.barra} aria-hidden="true">
        /
      </span>
      {/* `aria-current="page"` é o que diz ao leitor de tela qual degrau é o
          atual — sem ele a trilha vira três textos soltos. */}
      <span className={styles.atual} aria-current="page">
        {trilha.atual}
      </span>
    </nav>
  );
}
