import localFont from 'next/font/local';

/**
 * Outfit — self-hosted, variable (100–900), roman only.
 * Open source (SIL OFL 1.1) — see src/assets/fonts/LICENSE.txt.
 *
 * Fonts live in src/assets/, NOT public/: next/font fingerprints them and serves them
 * immutably cached, whereas anything in public/ would also be reachable un-hashed and
 * end up fetched twice.
 *
 * SUBSET: `latin` (U+0000–00FF + pontuação editorial), baixado de
 * fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtqUYLknw.woff2 — 32 KB.
 * Medido com fontTools antes de escolher: o subset cobre 100% dos diacríticos do
 * pt-BR (ã ç õ á ê é) e a pontuação editorial que a landing usa (— – … “ ” ·).
 * O subset `latin-ext` (mais 14 KB) NÃO acrescenta nada que este produto escreva —
 * por isso ficou de fora do caminho crítico do LCP.
 *
 * O QUE A OUTFIT NÃO TEM, e a Geist tinha: as setas ← → (U+2190/2192). Não estão em
 * NENHUM dos dois subsets — a Outfit simplesmente não desenha esses glifos. Por isso
 * `Ver todas →` e `← Anterior` viraram ícones lucide: um caractere sem glifo cai numa
 * fonte de sistema no meio da frase, com outra métrica e outra linha de base.
 * (`✓` e `⌘` também não existem aqui — mas a Geist também não os tinha, então
 * continuam caindo em fallback exatamente como antes desta troca.)
 */
export const outfit = localFont({
  src: [{ path: '../assets/fonts/Outfit-Variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-outfit',
  display: 'swap',
  preload: true, // LCP font
  fallback: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  adjustFontFallback: 'Arial', // kills the CLS jump when the real face swaps in
});

/**
 * Geist Mono — numbers, labels and eyebrows. Never above the fold, so it is not
 * preloaded: the first use is the credibility strip.
 *
 * A Outfit não é monoespaçada e não tem `tabular-nums` de verdade, então a régua de
 * "número é prova" continua na Geist Mono. É o único resto da família Geist no repo.
 *
 * TODO(perf): subset to Latin + pt-BR diacritics with pyftsubset. 70 KB hoje, ~6 KB
 * medido no subset. Fora do caminho crítico, então é otimização, não bloqueio.
 */
export const geistMono = localFont({
  src: [{ path: '../assets/fonts/GeistMono-Variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
});
