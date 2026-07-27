import type { Metadata, Viewport } from 'next';
import { THEME_COLOR } from '@/lib/brand';
import { geist, geistMono } from './fonts';
import './globals.css';

/**
 * `data-theme="light"` é PINADO no <html>.
 *
 * O tokens.css vendorizado carrega blocos [data-theme="dark"] e um
 * @media (prefers-color-scheme: dark). Pinar o atributo neutraliza os dois sem
 * precisar editar o design system — ligar dark mode depois vira um flip de
 * atributo em vez de um re-vendor. ThemeProvider/useTheme continuam proibidos.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Viver de IA × Subido — a assinatura para virar implementador de IA',
    template: '%s · Viver de IA × Subido',
  },
  description:
    'Soluções prontas com passo a passo, formações completas, um gerador que monta o projeto a partir da sua ideia e mentoria com quem já entregou. Uma parceria Viver de IA e Comunidade Subido.',
  applicationName: 'Viver de IA × Subido',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${geistMono.variable}`}
      /* O script inline de motion (ver (marketing)/layout.tsx) adiciona `js-reveal`
         ao <html> antes da hidratação, então o className do cliente diverge do que o
         servidor renderizou. Este é o mesmo padrão que bibliotecas de tema usam, e
         `suppressHydrationWarning` só vale UM nível — não mascara divergência real
         em nenhum filho. */
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
