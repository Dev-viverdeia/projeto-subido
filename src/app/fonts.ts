import localFont from 'next/font/local';

/**
 * Geist — self-hosted, variable (100–900), roman + italic.
 * Open source (SIL OFL 1.1 / MIT) — see src/assets/fonts/LICENSE.txt.
 *
 * Fonts live in src/assets/, NOT public/: next/font fingerprints them and serves them
 * immutably cached, whereas anything in public/ would also be reachable un-hashed and
 * end up fetched twice.
 *
 * TODO(perf): subset to Latin + pt-BR diacritics with pyftsubset. Current sizes are
 * 68 KB roman / 72 KB italic / 70 KB mono; the subsets measured ~30/34/6 KB. Only the
 * roman face is on the critical path, so this is an optimisation, not a blocker.
 */
export const geist = localFont({
  src: [
    { path: '../assets/fonts/Geist-Variable.woff2', weight: '100 900', style: 'normal' },
    { path: '../assets/fonts/Geist-Italic-Variable.woff2', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-geist',
  display: 'swap',
  preload: true, // LCP font
  fallback: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  adjustFontFallback: 'Arial', // kills the CLS jump when the real face swaps in
});

/**
 * Geist Mono — numbers, labels and eyebrows. Never above the fold, so it is not
 * preloaded: the first use is the credibility strip.
 */
export const geistMono = localFont({
  src: [{ path: '../assets/fonts/GeistMono-Variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
});
