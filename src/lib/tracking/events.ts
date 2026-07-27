import { recuperar } from './attribution';

/**
 * Camada de eventos.
 *
 * ESTE É O ÚNICO LUGAR DO CÓDIGO QUE TOCA `window.dataLayer`.
 *
 * A razão não é organização: quando cada componente empurra o próprio evento, os
 * nomes divergem, o payload muda de forma entre um lugar e outro, e três meses depois
 * ninguém consegue confiar num relatório. Com um ponto único e tipado, renomear um
 * evento é uma mudança de uma linha e o compilador acha todos os call sites.
 *
 * A conversão de COMPRA não sai daqui. Ela é disparada pelo webhook do checkout
 * (Meta CAPI + Google Enhanced Conversions), casada pelo `anonymous_id`: iOS e ITP
 * tornam evento de compra no browser não confiável, e manter o pixel pesado fora da
 * landing protege o LCP da página que recebe o clique pago.
 */

export type NomeEvento =
  | 'lp_view'
  | 'lp_video_play'
  | 'lp_video_progress'
  | 'lp_scroll'
  | 'lp_pillar_view'
  | 'lp_cta_click'
  | 'lp_faq_open'
  | 'lp_plan_select'
  | 'lp_checkout_start';

type Payload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Payload[];
  }
}

export function track(nome: NomeEvento, payload: Payload = {}) {
  if (typeof window === 'undefined') return;

  const atribuicao = recuperar();
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: nome,
    ...payload,
    // Vai junto em todo evento: é o que permite costurar a sessão do browser com a
    // conversão que chega pelo servidor.
    anonymous_id: atribuicao?.anonymous_id,
    utm_source: atribuicao?.first_touch.utm_source,
    utm_campaign: atribuicao?.first_touch.utm_campaign,
  });
}

/** Local do CTA, para saber QUAL botão converte — não só que houve conversão. */
export type LocalCta = 'hero' | 'header' | 'pilares' | 'planos' | 'final' | 'hub';
