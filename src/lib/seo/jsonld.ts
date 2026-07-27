import { FAQ, PILLARS, PLANS, HERO } from '@/content/landing';

/**
 * JSON-LD gerado do MESMO dado que renderiza a página.
 *
 * O `FAQPage` sai do array `FAQ` — o mesmo que o componente percorre. Divergência
 * entre o FAQ visível e o structured data é gatilho documentado de manual action do
 * Google; gerando os dois da mesma fonte, a divergência fica estruturalmente
 * impossível em vez de depender de alguém lembrar de atualizar os dois.
 *
 * NÃO emitimos `AggregateRating`. Sem avaliações verificáveis, é a rota mais rápida
 * para uma penalidade manual — e contradiz frontalmente a postura de atribuição que
 * a própria página assume na faixa de credibilidade.
 */
export function construirJsonLd(siteUrl: string) {
  const org = {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organizacao`,
    name: 'Subido',
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    // TODO(conteúdo): perfis oficiais.
    sameAs: [] as string[],
  };

  const site = {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#site`,
    url: siteUrl,
    name: 'Subido',
    inLanguage: 'pt-BR',
    publisher: { '@id': `${siteUrl}/#organizacao` },
  };

  const produto = {
    '@type': 'Product',
    '@id': `${siteUrl}/#assinatura`,
    name: 'Subido — assinatura para implementadores de IA',
    description: HERO.sub,
    brand: { '@id': `${siteUrl}/#organizacao` },
    // TODO(preço): trocar por `Offer` com preço real quando os três tiers forem
    // definidos. Emitir Offer sem `price` é pior que não emitir: o Google marca o
    // rich result como inválido no Search Console.
    offers: PLANS.filter((p) => p.priceMonthly !== null).map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: p.priceMonthly,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/#planos`,
    })),
  };

  const cursos = {
    '@type': 'ItemList',
    name: 'O que a assinatura inclui',
    itemListElement: PILLARS.map((pilar, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: pilar.name,
      description: pilar.sub,
    })),
  };

  const faq = {
    '@type': 'FAQPage',
    '@id': `${siteUrl}/#faq`,
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [org, site, produto, cursos, faq],
  };
}
