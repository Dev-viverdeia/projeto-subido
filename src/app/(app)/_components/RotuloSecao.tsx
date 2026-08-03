'use client';

import { usePathname } from 'next/navigation';
import { rotuloDaRota } from '@/lib/routes';
import styles from './RotuloSecao.module.css';

/**
 * O nome da seção no cabeçalho — o estado PADRÃO da trilha.
 *
 * Ele mora no `default.tsx` do slot `@trilha`, e não no `CabecalhoApp`, e isso é
 * o que mantém o cabeçalho sem ramificação: ele renderiza o slot e pronto. Rota
 * de listagem cai no default e vê a seção; rota de detalhe que declarou trilha vê
 * a trilha; rota de detalhe que ESQUECEU de declarar cai no default e vê a seção
 * — degradação para o estado anterior, nunca para um cabeçalho vazio.
 *
 * Client por causa do `usePathname`, e é o único pedaço cliente do cabeçalho:
 * duas strings, sem ícone, sem biblioteca.
 *
 * `aria-hidden` porque é eco do `<h1>` da página, que segue existindo como
 * `sr-only`. Quem ouve não precisa da seção duas vezes por rota.
 */
export function RotuloSecao() {
  const secao = rotuloDaRota(usePathname());
  if (!secao) return null;

  return (
    <span className={styles.secao} aria-hidden="true">
      {secao}
    </span>
  );
}
