import type { ReactNode } from 'react';
import { SiteHeader } from './_components/chrome/SiteHeader';
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

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ENABLE_MOTION }} />
      <a href="#conteudo" className="via-skip-link">
        Pular para o conteúdo
      </a>
      <SmoothScroll />
      <SiteHeader />
      {children}
    </>
  );
}
