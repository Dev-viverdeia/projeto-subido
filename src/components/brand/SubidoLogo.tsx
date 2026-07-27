import { SubidoMark } from './SubidoMark';
import styles from './SubidoLogo.module.css';

export interface SubidoLogoProps {
  /** Altura de referência em px. Marca e wordmark escalam a partir dela. */
  size?: number;
  /** Permite ao consumidor reduzir o conjunto sem recalcular cada medida. */
  className?: string;
}

/**
 * Logotipo do Subido: marca + wordmark.
 *
 * Substituiu o lockup de co-marca — o produto é Subido, sem assinatura visual de
 * outra marca. O design system continua sendo a base de construção (tokens `--via-*`,
 * primitivos vendorizados), mas isso é infraestrutura interna: não aparece e não é
 * referenciado no produto.
 *
 * Renderizado em UMA tinta só, via `currentColor` — segue a banda em que está (navy
 * sobre claro, branco sobre escuro). O `#00A2FF` nunca entra aqui: o manual reserva
 * o azul para elementos de destaque, e um logotipo não é destaque, é identidade.
 *
 * TODO(asset): o wordmark é composto em Geist bold como stand-in. O original tem
 * desenho próprio (não é fonte comercial); quando o SVG oficial chegar, ele entra no
 * lugar do `<span>` sem mudar a API.
 */
export function SubidoLogo({ size = 20, className }: SubidoLogoProps) {
  return (
    <span
      className={[styles.logo, className].filter(Boolean).join(' ')}
      style={{ ['--logo-h' as string]: `${size}px` }}
    >
      <SubidoMark size={size} className={styles.mark} />
      <span className={styles.word}>subido</span>
    </span>
  );
}
