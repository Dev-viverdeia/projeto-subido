'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ItemNav } from './navegacao';
import styles from './NavLateral.module.css';

/**
 * Navegação — sidebar no desktop, dock no rodapé do mobile.
 *
 * Cliente por causa de um dado só: `usePathname`, para marcar o item ativo. Os
 * ícones chegam prontos por prop (ver navegacao.tsx), então a única coisa que este
 * arquivo custa em JS é ele mesmo.
 *
 * `aria-current="page"` e não uma classe só: sem ele, o item ativo existe para quem
 * enxerga e não existe para leitor de tela.
 */
export function NavLateral({
  itens,
  variante,
}: {
  itens: ItemNav[];
  variante: 'lateral' | 'dock';
}) {
  const caminho = usePathname();

  const visiveis = variante === 'dock' ? itens.filter((i) => i.noDock) : itens;

  return (
    <nav
      className={variante === 'dock' ? styles.dock : styles.lateral}
      aria-label={variante === 'dock' ? 'Navegação principal' : 'Seções da plataforma'}
    >
      <ul className={styles.lista}>
        {visiveis.map((item) => {
          /* Prefixo, não igualdade: `/solucoes/automacao` precisa manter "Soluções"
             aceso. O `/` no fim evita que `/hub` case com um futuro `/hubs`. */
          const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.item}
                aria-current={ativo ? 'page' : undefined}
              >
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
