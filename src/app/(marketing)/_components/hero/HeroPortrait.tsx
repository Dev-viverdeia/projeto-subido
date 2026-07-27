import { AssetPlaceholder } from '../primitives/AssetPlaceholder';
import styles from './HeroPortrait.module.css';

export interface HeroPortraitProps {
  /** PNG/WebP com fundo transparente, já recortado. */
  src?: string;
  alt?: string;
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
 * TODO(asset): a foto precisa vir de vocês, com direito de uso — é pessoa real e não
 * cabe gerar nem buscar substituto. Especificação para quem for produzir:
 *   · PNG ou WebP com ALFA (fundo removido), sem sombra embutida
 *   · enquadramento de joelho para cima, olhar para a câmera ou para o texto
 *   · ~1400×1800px, sujeito recortado com folga de 40px em volta
 *   · luz principal vindo da ESQUERDA, para casar com o mesh (que clareia à esquerda)
 */
export function HeroPortrait({ src, alt }: HeroPortraitProps) {
  return (
    <figure className={styles.wrap}>
      <span className={styles.halo} aria-hidden="true" />
      <span className={styles.contact} aria-hidden="true" />

      <div className={styles.subject}>
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element -- recorte com alfa,
             servido em tamanho fixo; o otimizador não agrega aqui. */
          <img src={src} alt={alt ?? ''} className={styles.photo} width={1400} height={1800} />
        ) : (
          <AssetPlaceholder
            label="Foto Pedro Sobral · recorte"
            spec="PNG com alfa · 1400×1800"
            tone="dark"
          />
        )}
      </div>
    </figure>
  );
}
