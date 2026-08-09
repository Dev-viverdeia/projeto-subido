import localFont from 'next/font/local';

/** Fonte canônica do Design System Viver de IA, servida localmente e sem CDN. */
export const geist = localFont({
  src: [{ path: '../assets/fonts/Geist-Variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-geist',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

/**
 * Geist Mono fica reservada para dados, timestamps, código e metadados editoriais.
 */
export const geistMono = localFont({
  src: [{ path: '../assets/fonts/GeistMono-Variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
});
