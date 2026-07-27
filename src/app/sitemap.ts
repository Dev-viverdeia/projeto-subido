import type { MetadataRoute } from 'next';

/**
 * As páginas legais NÃO entram no sitemap: elas são `noindex` (ver o metadata de cada
 * uma), e listar no sitemap uma URL que se pede para não indexar é sinal contraditório
 * — o Search Console reporta como erro.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return [{ url: base, changeFrequency: 'weekly', priority: 1 }];
}
