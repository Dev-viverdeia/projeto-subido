import type { ReactNode } from 'react';
import { construirJsonLd } from '@/lib/seo/jsonld';
import { AttributionBoot } from './_components/chrome/AttributionBoot';
import { ConsentNotice } from './_components/chrome/ConsentNotice';
import { SmoothScroll } from './_components/chrome/SmoothScroll';

/**
 * Layout do grupo de marketing.
 *
 * REGRA DURA: nada aqui dentro pode chamar `cookies()`, `headers()` ou ler
 * `searchParams`. Qualquer um dos três tira a rota do shell estático e transforma
 * um hit de CDN de ~40ms numa invocação de função Node — em cada clique de anúncio.
 * É por isso que a captura de UTM é 100% client-side.
 *
 * Também não há QueryClientProvider nem cliente Supabase nesta árvore.
 */

/**
 * Habilita o motion antes da primeira pintura.
 *
 * Roda inline e síncrono de propósito: se fosse um `useEffect`, o conteúdo apareceria
 * e só depois seria escondido para animar — um flash visível. E o `matchMedia` garante
 * que quem pediu redução de movimento nunca recebe o estado escondido.
 *
 * Sem JS a classe nunca entra, e o CSS de reveal simplesmente não se aplica: a página
 * nasce inteira e visível para crawler, leitor de tela e usuário sem JS.
 */
const ENABLE_MOTION = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-reveal')}}catch(e){}`;

/**
 * Consent Mode v2 — NEGADO POR PADRÃO, e antes de qualquer tag.
 *
 * Precisa rodar inline e cedo: se a declaração chegar depois do GTM, as primeiras
 * tags já dispararam sem consentimento, e aí não há aviso de cookie que conserte.
 * O componente de consentimento só emite o `update`.
 */
const CONSENT_DEFAULT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`;

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT }} />
      <script dangerouslySetInnerHTML={{ __html: ENABLE_MOTION }} />
      <script
        type="application/ld+json"
        // Gerado do MESMO dado que renderiza a página — ver lib/seo/jsonld.ts.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(construirJsonLd(siteUrl)) }}
      />
      <a href="#conteudo" className="via-skip-link">
        Pular para o conteúdo
      </a>
      {/* O SiteHeader NÃO mora aqui: `(legal)` é um route group aninhado neste, então
          um header montado no layout vai junto para /termos, /privacidade e /reembolso —
          rotas onde as âncoras dele não têm alvo. Ele é montado na landing (page.tsx).
          SmoothScroll, AttributionBoot e ConsentNotice ficam: valem em qualquer rota
          desta árvore (um clique pago pode aterrissar direto numa página legal). */}
      <SmoothScroll />
      <AttributionBoot />
      {children}
      <ConsentNotice />
    </>
  );
}
