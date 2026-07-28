'use client';

import { useEffect, useState } from 'react';

/**
 * Atrasa a propagação de um valor. A busca dos catálogos escreve na URL — sem o
 * debounce seriam N `replaceState` por palavra digitada.
 */
export function useDebounce<T>(valor: T, atrasoMs = 400): T {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), atrasoMs);
    return () => clearTimeout(timer);
  }, [valor, atrasoMs]);

  return atrasado;
}
