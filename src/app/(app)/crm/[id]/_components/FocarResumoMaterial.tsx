'use client';
import { useEffect } from 'react';

/** O registro pode chegar por streaming depois da navegação para a âncora. */
export function FocarResumoMaterial({ registro }: { registro: string }) {
  useEffect(() => {
    if (window.location.hash !== '#resumo-material') return;
    const quadro = requestAnimationFrame(() => {
      const resumo = document.getElementById('resumo-material');
      resumo?.focus({ preventScroll: true });
      resumo?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(quadro);
  }, [registro]);
  return null;
}
