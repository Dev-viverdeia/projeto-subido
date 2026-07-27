import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Documentos legais e a página de obrigado não devem competir com a landing.
      disallow: ['/termos', '/privacidade', '/reembolso'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
