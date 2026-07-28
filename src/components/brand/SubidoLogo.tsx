import { SubidoMark } from './SubidoMark';
import styles from './SubidoLogo.module.css';

export interface SubidoLogoProps {
  /** Altura de referência em px. Marca e wordmark escalam a partir dela. */
  size?: number;
  /** Permite ao consumidor reduzir o conjunto sem recalcular cada medida. */
  className?: string;
  /**
   * `brand` — marca no azul institucional, wordmark na tinta corrente. É o
   * logotipo principal, e o padrão sobre superfície clara.
   * `mono` — conjunto inteiro em `currentColor`. Obrigatório sobre banda escura e
   * sobre preenchimento colorido, onde o azul institucional não tem contraste
   * contra o fundo e a marca desaparece.
   */
  variant?: 'brand' | 'mono';
}

/**
 * Logotipo do Subido: marca + wordmark.
 *
 * Substituiu o lockup de co-marca — o produto é Subido, sem assinatura visual de
 * outra marca. O design system continua sendo a base de construção (tokens `--via-*`,
 * primitivos vendorizados), mas isso é infraestrutura interna: não aparece e não é
 * referenciado no produto.
 *
 * DUAS TINTAS, e a escolha é da BANDA, não do gosto.
 *
 * `brand` (padrão) põe a marca no azul institucional e deixa o wordmark em
 * `currentColor`. É o logotipo principal do manual e o tratamento correto sobre
 * superfície clara: ali o azul é o único ponto de cor da tela, e é a marca que o
 * carrega. Logotipo é a exceção sancionada à regra de "accent só sobre escuro" —
 * o manual e a WCAG isentam logotipo de mínimo de contraste, e é a única isenção
 * que este projeto usa.
 *
 * `mono` põe o conjunto inteiro em `currentColor`. Obrigatório sobre preenchimento
 * colorido e onde o azul brigaria com a banda em vez de ancorá-la.
 *
 * TODO(asset): o wordmark é composto em Geist bold como stand-in. O original tem
 * desenho próprio (não é fonte comercial); quando o SVG oficial chegar, ele entra no
 * lugar do `<span>` sem mudar a API.
 */
export function SubidoLogo({ size = 20, className, variant = 'brand' }: SubidoLogoProps) {
  return (
    <span
      className={[styles.logo, className].filter(Boolean).join(' ')}
      style={{ ['--logo-h' as string]: `${size}px` }}
    >
      <SubidoMark size={size} variant={variant} className={styles.mark} />
      <span className={styles.word}>subido</span>
    </span>
  );
}
