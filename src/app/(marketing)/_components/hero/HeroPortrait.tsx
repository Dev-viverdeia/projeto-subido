import type { CSSProperties } from 'react';
import Image, { type StaticImageData } from 'next/image';
import retratoPadrao from '@/assets/img/pedro-sobral-recorte.png';
import styles from './HeroPortrait.module.css';

export interface HeroPortraitProps {
  /** Recorte com alfa. Import estático, para o Next conhecer as dimensões. */
  src?: StaticImageData;
  alt: string;
  /**
   * `true` quando o retrato é o elemento de LCP da rota. Só UM elemento da página
   * pode sê-lo, então quem decide é o consumidor, não este componente.
   */
  prioritario?: boolean;
  /**
   * Classe de entrada. Fica no consumidor porque a coreografia é da CENA, não da
   * figura — e porque este elemento é o único da coluna que pode animar opacidade
   * sem apagar o vidro do card de vídeo (ver HeroSection.module.css).
   */
  className?: string;
  style?: CSSProperties;
}

/**
 * Retrato recortado do hero.
 *
 * O QUE FAZ UM RECORTE FUNCIONAR SOBRE FUNDO ESCURO — e o que quase sempre é
 * esquecido:
 *
 *  1. UMA LUZ ATRÁS. Sem um halo radial, a silhueta cola no fundo e a foto parece
 *     colada em cima da página. O halo é o que a assenta na cena.
 *  2. SANGRA NA BASE. O recorte termina na borda da seção, não flutuando acima dela.
 *     Recorte com "chão" invisível vira adesivo.
 *  3. SOMBRA DE CONTATO. Uma elipse escura e difusa embaixo dá peso ao corpo.
 *
 * POR QUE `next/image` E NÃO `<img>` CRU — a versão anterior deste arquivo usava
 * `<img>` com um eslint-disable, argumentando que "o otimizador não agrega" num
 * recorte servido em tamanho fixo. Medido, o argumento não se sustenta: o PNG
 * entregue tem 2,4 MB e o mesmo recorte em AVIF q90, com o alfa intacto, tem 148 kB
 * — 16× menos, no elemento mais pesado da página que recebe o clique pago. O que o
 * `next/image` agrega aqui não é redimensionar, é NEGOCIAR FORMATO: AVIF para quem
 * aceita, WebP para o resto, PNG só no fim da fila. O import estático ainda carrega
 * width/height reais, o que fecha a porta do CLS.
 */
export function HeroPortrait({
  src = retratoPadrao,
  alt,
  prioritario = false,
  className,
  style,
}: HeroPortraitProps) {
  return (
    <figure className={[styles.wrap, className].filter(Boolean).join(' ')} style={style}>
      <span className={styles.halo} aria-hidden="true" />
      <span className={styles.contact} aria-hidden="true" />

      <div className={styles.subject}>
        <Image
          src={src}
          alt={alt}
          className={styles.photo}
          priority={prioritario}
          /* O retrato ocupa a coluna da direita da grade do hero, que é ~460px no
             desktop e a largura da tela abaixo de 1024. Sem `sizes` o Next assume
             100vw e serve uma variante grande demais. */
          sizes="(min-width: 1024px) 460px, 100vw"
        />
      </div>
    </figure>
  );
}
