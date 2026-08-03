/**
 * As duas vistas da agenda — o que sobrou do `SeletorVista`.
 *
 * O componente inteiro era uma CÓPIA do `ControleSegmentado`: mesmo trilho, mesmo
 * polegar animado por `layoutId`, mesmo `role="tablist"`. E o comentário do
 * próprio `ControleSegmentado` já registrava que ele havia sido extraído
 * justamente para substituir esta cópia e as abas de catálogo — a extração
 * aconteceu, a substituição aqui não. A cópia ficou para trás quando o
 * compartilhado ganhou setas de teclado, então dois controles com o mesmo papel
 * ARIA respondiam diferente ao mesmo teclado.
 *
 * O que era específico daqui são os dois ícones. Eles ficam.
 *
 * SVG inline, nunca `lucide`: quem consome é ilha cliente, e a biblioteca viria
 * junto por causa de dois desenhos de 14px.
 */
export type IdVista = 'agenda' | 'calendario';

export const ICONE_AGENDA = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M2.5 4h11M2.5 8h11M2.5 12h7"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

export const ICONE_CALENDARIO = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect
      x="2.2"
      y="3.2"
      width="11.6"
      height="10.6"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path
      d="M2.2 6.6h11.6M5.6 2.2v2M10.4 2.2v2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);
