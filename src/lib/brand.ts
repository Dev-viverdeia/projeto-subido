/* eslint-disable no-restricted-syntax --
 * ESTE É O ÚNICO ARQUIVO DO PROJETO AUTORIZADO A CONTER CORES LITERAIS.
 *
 * Existe porque alguns consumidores não conseguem ler CSS custom properties:
 * `themeColor` do Next (chrome do navegador), geração de OG image, e-mail
 * transacional e manifest do PWA. Sem um ponto único, esses casos viram hex
 * espalhado pelo código — que foi exatamente como a plataforma de referência
 * acumulou 69 ocorrências de `bg-[#...]`.
 *
 * A fonte da verdade para ESTILO continua sendo src/styles/brand.css. Os valores
 * abaixo espelham aquele arquivo e não podem divergir dele.
 */

/** Paleta canônica da Viver de IA. O nome CST fica apenas por compatibilidade. */
export const CST = {
  blue: '#1E3A5F',
  navy: '#0A1F3B',
  navyDeep: '#02162A',
  white: '#FFFFFF',
} as const;

/** Azul oficial da marca que assina o produto. */
export const SUBIDO = {
  blue: '#0AA9F6',
} as const;

/** Derivados verificados por contraste. Ver src/styles/brand.css para o racional. */
export const BRAND = {
  /** Banda mais profunda da landing. */
  navyDarker: '#010B1A',
  accentInk: '#0A1F3B',
  /** Segundo tom sólido do título sobre banda escura (não é opacidade). */
  softInk: '#98A2B3',
  /** Texto de apoio sobre banda escura. */
  mutedInk: '#98A2B3',
  /** Branco puro — o vidro e a tinta sobre navy precisam dele, não do branco frio. */
  white: '#FFFFFF',
} as const;

/**
 * Tintas sólidas do documento comercial.
 *
 * PDF não entende CSS custom properties. Estes valores espelham a escala clara
 * de brand.css e mantêm esse consumidor estático sem cores espalhadas no template.
 */
export const DOCUMENT = {
  paper: '#FFFFFF',
  soft: '#F7F8FA',
  line: '#E4E7EC',
  body: '#344054',
  faint: '#667085',
  coverMuted: '#AAB4C5',
  coverLine: '#2A3449',
  coverFaint: '#7E899D',
  coverDetail: '#9BA6B8',
  coverBlue: '#93A8C2',
  coverMid: '#677186',
  decisionMuted: '#AEB8C8',
  signature: '#AAB3C1',
} as const;

/**
 * Razões de contraste medidas (WCAG 2.1), para não serem re-descobertas por tentativa:
 *
 * Cores de produto devem consumir os tokens CSS semânticos. Estes valores ficam
 * reservados a consumidores que não entendem custom properties, como PDF e OG.
 */
export const THEME_COLOR = CST.navy;
