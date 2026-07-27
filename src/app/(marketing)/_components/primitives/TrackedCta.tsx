'use client';

import type { ReactNode } from 'react';
import { track, type LocalCta } from '@/lib/tracking/events';
import { comAtribuicao } from '@/lib/tracking/attribution';

export interface TrackedCtaProps {
  href: string;
  local: LocalCta;
  children: ReactNode;
  className?: string;
  /** Identifica o plano quando o CTA está num card de preço. */
  plano?: string;
}

/**
 * CTA instrumentado.
 *
 * DUAS COISAS SUTIS QUE ESTE COMPONENTE RESOLVE:
 *
 * 1. O `href` renderizado é a URL LIMPA. A atribuição é anexada no `onClick`, e não
 *    no render — se fosse no render, o servidor e o cliente produziriam markup
 *    diferente (o servidor não conhece a query do usuário) e daria mismatch de
 *    hidratação. Como efeito colateral bom, middle-click e "abrir em nova aba"
 *    continuam funcionando com a URL limpa.
 *
 * 2. `local` responde QUAL botão converte, não apenas que houve conversão. Com cinco
 *    CTAs na mesma página, sem isso o relatório diz "houve 40 cliques" e ninguém sabe
 *    se o hero está puxando ou se é o preço.
 *
 * Âncoras internas (#) não recebem atribuição — não saem do site.
 */
export function TrackedCta({ href, local, children, className, plano }: TrackedCtaProps) {
  const interno = href.startsWith('#');

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        track('lp_cta_click', { local, destino: href, plano });
        if (interno) return;
        // Reescreve imediatamente antes de navegar: a URL limpa fica no HTML, a
        // atribuída vai para o checkout.
        e.currentTarget.href = comAtribuicao(href);
      }}
    >
      {children}
    </a>
  );
}
