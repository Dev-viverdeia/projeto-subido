'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import type { ItemNav } from './navegacao';
import styles from './NavLateral.module.css';

/**
 * Navegação — sidebar no desktop, dock no rodapé do mobile.
 *
 * Cliente por causa de um dado só: `usePathname`, para marcar o item ativo. Os
 * ícones chegam prontos por prop (ver navegacao.tsx), então o único JS que este
 * arquivo custa é ele mesmo e o `motion`.
 *
 * O MARCADOR DE ATIVO DESLIZA, e é por isso que o `motion` entrou.
 * Antes o item só animava `background-color` e `color`: a pílula branca SUMIA de
 * um item e APARECIA no outro, sem nada percorrer o caminho. Nenhuma transição
 * estava quebrada — não havia transição nenhuma de posição, e é exatamente isso
 * que se lê como travado. Com `layoutId` o navegador interpola a caixa entre os
 * dois itens (FLIP: transform, nunca top/height), então o marcador percorre.
 *
 * O `layoutId` inclui a VARIANTE e o grupo: a sidebar renderiza dois `NavLateral`
 * (pilares e admin), e dois grupos com o mesmo id disputariam o mesmo marcador —
 * clicar em Admin faria a pílula voar de um bloco para o outro atravessando a
 * hairline.
 *
 * `aria-current="page"` e não uma classe só: sem ele, o item ativo existe para
 * quem enxerga e não existe para leitor de tela.
 */
export function NavLateral({
  itens,
  variante,
  grupo = 'principal',
  rotuloGrupo,
}: {
  itens: ItemNav[];
  variante: 'lateral' | 'dock';
  /** Separa o marcador deslizante entre blocos independentes da mesma tela. */
  grupo?: string;
  /** Rótulo do bloco, só na sidebar. Dá estrutura à coluna sem inventar conteúdo. */
  rotuloGrupo?: string;
}) {
  const caminho = usePathname();
  const reduzir = useReducedMotion();

  const visiveis = variante === 'dock' ? itens.filter((i) => i.noDock) : itens;
  const idMarcador = `nav-${variante}-${grupo}`;

  /* Spring, não duração: o marcador percorre uma distância variável (dois itens
     vizinhos ou as pontas da lista), e uma duração fixa faria o percurso curto
     parecer lento e o longo parecer apressado. Mesmo spring do sublinhado das
     abas — um vocabulário de movimento, não dois. */
  const transicao = reduzir
    ? { duration: 0 }
    : ({ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const);

  return (
    <nav
      className={variante === 'dock' ? styles.dock : styles.lateral}
      aria-label={
        variante === 'dock' ? 'Navegação principal' : (rotuloGrupo ?? 'Seções da plataforma')
      }
    >
      {variante === 'lateral' && rotuloGrupo && (
        <p className={styles.rotuloGrupo} aria-hidden="true">
          {rotuloGrupo}
        </p>
      )}

      <ul className={styles.lista}>
        {visiveis.map((item) => {
          /* Prefixo, não igualdade: `/solucoes/automacao` precisa manter "Soluções"
             aceso. O `/` no fim evita que `/conta` case com um futuro `/contas`. */
          const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.item}
                aria-current={ativo ? 'page' : undefined}
              >
                {ativo && (
                  <motion.span
                    layoutId={idMarcador}
                    className={variante === 'dock' ? styles.marcaDock : styles.pilula}
                    transition={transicao}
                  />
                )}
                <span className={styles.icone} aria-hidden="true">
                  {item.icone}
                </span>
                <span className={styles.rotulo}>{item.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
