/**
 * Conteúdo da landing como DADO TIPADO, não como JSX.
 *
 * Três motivos, e o primeiro sozinho já justifica:
 *
 *  1. O JSON-LD `FAQPage` é gerado do MESMO array que renderiza o FAQ visível.
 *     Divergência entre o texto renderizado e o structured data é gatilho documentado
 *     de manual action do Google. Assim ela fica estruturalmente impossível.
 *  2. Revisão de copy vira diff de um arquivo `.ts`, sem tocar em JSX.
 *  3. Variantes de A/B viram objeto de dado, não fork de componente.
 */

export interface Stat {
  value: string;
  label: string;
}

export interface StatGroup {
  source: string;
  stats: Stat[];
}

export interface Pillar {
  /** "01".."04" — numeração em mono, não ícone em círculo. */
  index: string;
  slug: string;
  name: string;
  /** Uma linha, para o índice do topo. */
  teaser: string;
  title: string;
  sub: string;
  facts: string[];
}

export interface Plan {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  pitch: string;
  /** null = "sob consulta" (Enterprise fala com o time em vez de ir pro checkout). */
  priceMonthly: number | null;
  features: string[];
  cta: string;
  featured?: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Testimonial {
  name: string;
  role: string;
  city: string;
  timeframe: string;
  /** Verbatim. NUNCA reescrever para a voz VIA — isso mata os dois registros. */
  quote: string;
  outcome: string;
}
