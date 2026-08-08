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

/** Paleta institucional da Comunidade Subido de Tráfego (manual da marca). */
export const CST = {
  /** Accent. Uso PONTUAL — nunca em grandes áreas ou fundos. */
  blue: '#00A2FF',
  /** Azul-marinho institucional. */
  navy: '#0B162D',
  /** Azul-marinho escuro institucional. */
  navyDeep: '#040B1A',
  /** Branco institucional (levemente frio). */
  white: '#FAFDFF',
} as const;

/** Derivados verificados por contraste. Ver src/styles/brand.css para o racional. */
export const BRAND = {
  /** Banda mais profunda da landing. */
  navyDarker: '#02060F',
  /** Única variante do accent legível sobre superfície clara — 4,95:1. */
  accentInk: '#0072BE',
  /** Segundo tom sólido do título sobre banda escura (não é opacidade). */
  softInk: '#8FA0B8',
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
  paper: '#FCFDFF',
  soft: '#F2F6FB',
  line: '#E2E9F2',
  body: '#4F596B',
  faint: '#667085',
  coverMuted: '#AAB4C5',
  coverLine: '#2A3449',
  coverFaint: '#7E899D',
  coverDetail: '#9BA6B8',
  coverBlue: '#65CAFF',
  coverMid: '#677186',
  decisionMuted: '#AEB8C8',
  signature: '#AAB3C1',
} as const;

/**
 * Razões de contraste medidas (WCAG 2.1), para não serem re-descobertas por tentativa:
 *
 *   #00A2FF sobre #FAFDFF ....  2,70:1  ✗ reprova AA até para texto grande
 *   #00A2FF sobre #0B162D ....  6,52:1  ✓ AA
 *   #0B162D sobre #FAFDFF .... 17,62:1  ✓ AAA
 *   #0072BE sobre #FAFDFF ....  4,95:1  ✓ AA
 *   #FFFFFF sobre #00A2FF ....  2,76:1  ✗ — por isso rótulo em accent é navy escuro
 *   #040B1A sobre #00A2FF ....  7,13:1  ✓ AA
 */
export const THEME_COLOR = CST.navy;
