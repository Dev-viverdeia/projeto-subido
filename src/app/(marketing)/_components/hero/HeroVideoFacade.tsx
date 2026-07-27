'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import styles from './HeroVideoFacade.module.css';

export interface HeroVideoFacadeProps {
  caption: string;
  /** URL de embed. Enquanto não houver VSL, o facade renderiza o placeholder. */
  embedUrl?: string;
  posterUrl?: string;
}

/**
 * Facade de vídeo — o player só monta depois do clique.
 *
 * Um iframe de YouTube custa ~1,2 MB e entra no caminho crítico da página que recebe
 * o clique pago. Aqui a dobra carrega um poster e um botão; o peso do player só
 * aparece para quem realmente quer assistir.
 *
 * TODO(asset): gravar a VSL. Recomendação de host: Mux ou Panda, não YouTube — além
 * do peso, o chrome de marca do YouTube briga com a estética da página. Se YouTube
 * for exigido por públicos de retargeting, usar youtube-nocookie.com atrás do mesmo
 * facade, aceitando o peso só depois da interação.
 */
export function HeroVideoFacade({ caption, embedUrl, posterUrl }: HeroVideoFacadeProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className={styles.wrap}>
      <div className={styles.frame}>
        {playing && embedUrl ? (
          <iframe
            className={styles.player}
            src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
            title="Como funciona a assinatura"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className={styles.trigger}
            onClick={() => setPlaying(true)}
            disabled={!embedUrl}
            aria-label={
              embedUrl ? 'Assistir ao vídeo de apresentação' : 'Vídeo ainda não disponível'
            }
          >
            {posterUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- poster é servido
                 pelo host de vídeo, fora do otimizador de imagem do Next. */
              <img src={posterUrl} alt="" className={styles.poster} width={1280} height={720} />
            ) : (
              <span className={styles.placeholder}>
                <span className={styles.placeholderLabel}>TODO(asset) · VSL</span>
                <span className={styles.placeholderSpec}>16:9 · poster AVIF 1600w</span>
              </span>
            )}
            {/* Sem vídeo não há botão de play: um play desabilitado sobre um vídeo
                inexistente é ruído, e ainda colidia com o texto do placeholder. */}
            {embedUrl ? (
              <span className={styles.play} aria-hidden="true">
                <Play size={20} fill="currentColor" strokeWidth={0} />
              </span>
            ) : null}
          </button>
        )}
      </div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
