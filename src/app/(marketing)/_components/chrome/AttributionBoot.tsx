'use client';

import { useEffect } from 'react';
import { capturar } from '@/lib/tracking/attribution';
import { track } from '@/lib/tracking/events';

/**
 * Inicializa a atribuição e dispara o `lp_view`.
 *
 * Roda no cliente, depois da hidratação, exatamente para que a página continue
 * pré-renderizada: ler `searchParams` no servidor tiraria a rota do shell estático.
 *
 * Não renderiza nada e não bloqueia nada — se este módulo falhar, a landing continua
 * inteira e vendável; só a medição se perde.
 */
export function AttributionBoot() {
  useEffect(() => {
    try {
      capturar(window.location.search, document.referrer, window.location.href);
      track('lp_view', { pagina: window.location.pathname });
    } catch {
      /* medição nunca derruba a página */
    }
  }, []);

  return null;
}
