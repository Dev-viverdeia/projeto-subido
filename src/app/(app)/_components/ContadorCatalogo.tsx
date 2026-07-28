'use client';

import { useEffect, useState } from 'react';
import styles from './ContadorCatalogo.module.css';

/**
 * O número-prova do catálogo: conta de 0 até o total na entrada da página.
 *
 * rAF com ease-out cúbico (~900ms) — não `setInterval`, que dropa frames.
 * `tabular-nums` impede o texto ao lado de "andar" enquanto os dígitos trocam.
 * Com `prefers-reduced-motion`, o valor final entra direto, sem contagem.
 */
export function ContadorCatalogo({ total, rotulo }: { total: number; rotulo: string }) {
  const [exibido, setExibido] = useState(0);

  useEffect(() => {
    /* Reduced-motion não é um branch com setState síncrono (o lint reprova, com
       razão): é só duração zero — o primeiro quadro já cai em t = 1. Todo
       setState acontece DENTRO do rAF, fora do corpo do efeito. */
    const DURACAO = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900;
    const inicio = performance.now();
    let quadro = requestAnimationFrame(function passo(agora: number) {
      const t = DURACAO === 0 ? 1 : Math.min(1, (agora - inicio) / DURACAO);
      const suave = 1 - (1 - t) ** 3;
      setExibido(Math.round(suave * total));
      if (t < 1) quadro = requestAnimationFrame(passo);
    });
    return () => cancelAnimationFrame(quadro);
  }, [total]);

  return (
    <p className={styles.bloco}>
      <span className={styles.numero}>{exibido}</span>
      <span className={styles.rotulo}>{rotulo}</span>
    </p>
  );
}
