import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /* As páginas legais usam `noindex` no próprio metadata: assim continuam fora
         da busca, mas podem ser lidas pelos verificadores de OAuth e confiança do
         Google. Bloqueá-las aqui impedia o robô de confirmar privacidade e termos. */
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
