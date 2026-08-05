import { ImageResponse } from 'next/og';
import { BRAND, CST } from '@/lib/brand';

/** Satori não lê CSS custom properties: as cores vêm do módulo de marca, que é o
   único lugar do projeto autorizado a conter literais. */

export const alt = 'Subido — a assinatura que forma implementadores de IA';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Imagem de compartilhamento, gerada em BUILD TIME.
 *
 * Exportar `size`/`contentType`/`alt` é o que faz o Next pré-renderizar em vez de
 * gerar a cada request — numa landing estática, gerar OG sob demanda seria pagar
 * função por cada preview no WhatsApp.
 *
 * `next/og` lida mal com fonte variável: a Outfit é variável, então aqui a família
 * cai no fallback do Satori de propósito. Trocar por uma instância estática da Outfit
 * quando houver o arquivo — a diferença aparece no peso do título.
 */
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: `linear-gradient(135deg, ${CST.navy} 0%, ${CST.navyDeep} 100%)`,
        color: BRAND.white,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width="52" height="52" viewBox="0 0 100 100">
          <path
            d="M27 0 H73 A27 27 0 0 1 100 27 V55 A27 27 0 0 1 73 82 H21 L2 100 V27 A27 27 0 0 1 27 0 Z M38.5 23 H73 V57.5 H62.5 V41 L41 62.5 L33.2 54.7 L54.7 33.2 H38.5 Z"
            fillRule="evenodd"
            fill={CST.blue}
          />
        </svg>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5 }}>subido</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 62, lineHeight: 1.05, letterSpacing: -2.4, maxWidth: 900 }}>
          As empresas já decidiram usar IA.
        </div>
        <div
          style={{
            fontSize: 62,
            lineHeight: 1.05,
            letterSpacing: -2.4,
            maxWidth: 900,
            color: BRAND.softInk,
          }}
        >
          Falta quem saiba implementar.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28, fontSize: 24, color: BRAND.mutedInk }}>
        <span>Soluções</span>
        <span>Formações</span>
        <span>Builder</span>
        <span>Mentorias</span>
      </div>
    </div>,
    size,
  );
}
