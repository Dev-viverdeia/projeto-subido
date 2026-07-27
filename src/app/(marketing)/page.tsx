import { PILLARS } from '@/content/landing';
import { SiteHeader } from './_components/chrome/SiteHeader';
import { HeroSection } from './_components/hero/HeroSection';
import { CredibilityStrip } from './_components/proof/CredibilityStrip';
import { PillarsIndex } from './_components/pillars/PillarsIndex';
import { PillarSection } from './_components/pillars/PillarSection';
import { TwoPathsSection } from './_components/paths/TwoPathsSection';
import { HubSection } from './_components/hub/HubSection';
import { TestimonialsSection } from './_components/social/TestimonialsSection';
import { ComparisonTable } from './_components/compare/ComparisonTable';
import { PricingSection } from './_components/pricing/PricingSection';
import { AuthoritySection } from './_components/authority/AuthoritySection';
import { FaqSection } from './_components/faq/FaqSection';
import { FinalCtaSection } from './_components/cta/FinalCtaSection';

/**
 * Landing pública.
 *
 * Totalmente pré-renderizada: nenhum `cookies()`, `headers()` ou `searchParams` nesta
 * árvore — qualquer um dos três tiraria a rota do shell estático e transformaria um
 * hit de CDN de ~40ms numa invocação de função Node, a cada clique pago.
 *
 * RITMO DE BANDAS — a estrutura de leitura da página.
 * Exatamente TRÊS momentos escuros num corpo claro. As bandas escuras marcam os três
 * momentos de decisão (abertura, destino, chamada final); o corpo claro é o argumento
 * editorial. É o ritmo que dá respiro a uma página de 11 mil pixels.
 *
 *   ESCURO   hero
 *   claro    credibilidade · contexto · pilares (índice + 01–04) · caminhos
 *   ESCURO   HUB                 ← o destino, logo antes do preço: justifica o valor
 *   claro    resultados · comparação · planos+garantia · quem faz · perguntas
 *   ESCURO   CTA final + rodapé
 *
 * O SiteHeader mora AQUI, e não no layout do grupo, porque `(legal)` é um route group
 * ANINHADO em `(marketing)`: no layout, a barra fixa era renderizada também em /termos,
 * /privacidade e /reembolso — onde suas seis âncoras de seção e o CTA "Ver planos" não
 * têm alvo e o clique não fazia nada. Montado na própria landing, o nav passa a existir
 * exatamente onde seus alvos existem, e as páginas legais deixam de baixar um client
 * component com scroll-spy que nunca teve o que observar.
 */
export default function LandingPage() {
  return (
    <main id="conteudo">
      <SiteHeader />
      <HeroSection />
      <CredibilityStrip />
      <PillarsIndex />

      {PILLARS.map((pillar, i) => (
        <PillarSection
          key={pillar.slug}
          pillar={pillar}
          flip={i % 2 === 1}
          tone={i % 2 === 1 ? 'tint' : 'light'}
        />
      ))}

      <TwoPathsSection />
      <HubSection />
      <TestimonialsSection />
      <ComparisonTable />
      <PricingSection />
      <AuthoritySection />
      <FaqSection />
      <FinalCtaSection />
    </main>
  );
}
