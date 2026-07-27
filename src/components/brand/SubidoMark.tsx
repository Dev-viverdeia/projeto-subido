import { CST } from '@/lib/brand';

export interface SubidoMarkProps {
  /** Altura em px. A largura acompanha (a marca é quadrada + rabicho). */
  size?: number;
  /**
   * `mono` desenha o balão em `currentColor` com a seta VAZADA — o fundo aparece
   * através dela. É o tratamento monocromático que o manual permite ("aplicações
   * específicas em negativo ou positivo").
   * `brand` usa o azul institucional com a seta branca, como o logotipo principal.
   */
  variant?: 'mono' | 'brand';
  className?: string;
}

/**
 * Marca da Comunidade Subido de Tráfego.
 *
 * SIMBOLOGIA, conforme o manual: o formato vem da letra P (Pedro), o balão significa
 * Comunidade, e a seta ascendente significa Subido. As três coisas somadas são a
 * marca — por isso a seta é vazada do balão e não desenhada por cima: elas são um
 * corpo só, não duas formas sobrepostas.
 *
 * O `fill-rule="evenodd"` num único path é o que produz isso: o contorno externo
 * pinta, o contorno interno (a seta) fura. Em `mono`, o furo mostra a banda por
 * trás; em `brand`, mostra o branco declarado abaixo.
 *
 * TODO(asset): esta é uma RECONSTRUÇÃO a partir do PDF do manual, não o arquivo
 * oficial. O manual manda respeitar a angulação e o arredondamento do logotipo
 * original, então o SVG oficial deve substituir este assim que chegar — a API do
 * componente não muda.
 */
export function SubidoMark({ size = 28, variant = 'mono', className }: SubidoMarkProps) {
  const balloonAndArrow =
    // Balão: cantos arredondados, rabicho descendo no canto inferior esquerdo.
    'M27 0 H73 A27 27 0 0 1 100 27 V55 A27 27 0 0 1 73 82 H21 L2 100 V27 A27 27 0 0 1 27 0 Z ' +
    // Seta ascendente, vazada (sentido oposto → fura o balão com evenodd).
    'M38.5 23 H73 V57.5 H62.5 V41 L41 62.5 L33.2 54.7 L54.7 33.2 H38.5 Z';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Comunidade Subido de Tráfego"
      fill="none"
    >
      {variant === 'brand' ? (
        <>
          {/* Fundo branco só sob o furo da seta, para que ela não fique transparente. */}
          <path
            d="M38.5 23 H73 V57.5 H62.5 V41 L41 62.5 L33.2 54.7 L54.7 33.2 H38.5 Z"
            fill={CST.white}
          />
          <path d={balloonAndArrow} fillRule="evenodd" fill={`var(--cst-blue, ${CST.blue})`} />
        </>
      ) : (
        <path d={balloonAndArrow} fillRule="evenodd" fill="currentColor" />
      )}
    </svg>
  );
}
