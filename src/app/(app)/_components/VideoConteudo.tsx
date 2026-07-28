'use client';

import { useState } from 'react';
import styles from './VideoConteudo.module.css';

/**
 * Moldura de vídeo dos conteúdos (solução e aula compartilham).
 *
 * O iframe SÓ monta no clique — um embed de player são centenas de KB, e a
 * maioria das visitas ao detalhe não dá play. Antes do clique existe apenas a
 * moldura navy com o orbe.
 *
 * Sem `videoUrl`, a moldura diz a verdade ("vídeo em produção") em vez de fingir
 * player — placeholder honesto é regra da casa, não falta de capricho.
 */
export function VideoConteudo({ videoUrl, titulo }: { videoUrl: string | null; titulo: string }) {
  const [tocando, setTocando] = useState(false);

  if (!videoUrl) {
    return (
      <div className={`${styles.moldura} via-mesh-navy via-noise`}>
        <div className={styles.vazio}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect
              x="3"
              y="6"
              width="22"
              height="16"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path d="m12 11.5 5 2.5-5 2.5z" fill="currentColor" />
          </svg>
          <p className={styles.vazioTexto}>Vídeo em produção</p>
        </div>
      </div>
    );
  }

  if (tocando) {
    return (
      <div className={styles.moldura}>
        <iframe
          className={styles.player}
          src={videoUrl}
          title={titulo}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.moldura} ${styles.capa} via-mesh-navy via-noise`}
      onClick={() => setTocando(true)}
      aria-label={`Assistir: ${titulo}`}
    >
      <span className={styles.orbe} aria-hidden="true">
        <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
          <path
            d="M2 1.8v16.4c0 .9 1 1.5 1.8 1L17 10.9c.8-.5.8-1.6 0-2.1L3.8.8C3 .3 2 .9 2 1.8Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className={styles.assistir}>Assistir</span>
    </button>
  );
}
