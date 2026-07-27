import { PILLARS } from '@/content/landing';
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
 * RITMO DE BANDAS — o mecanismo de co-branding da página.
 * Exatamente TRÊS momentos escuros num corpo claro. Banda escura é território da
 * Comunidade Subido (navy institucional + accent pontual); corpo editorial claro é
 * território do Viver de IA. Isso comunica a parceria melhor do que repetir um lockup
 * em toda seção — e é por isso que o lockup aparece só em quatro lugares.
 *
 *   ESCURO   hero
 *   claro    credibilidade · contexto · pilares (índice + 01–04) · caminhos
 *   ESCURO   HUB                 ← o destino, logo antes do preço: justifica o valor
 *   claro    resultados · comparação · planos+garantia · quem faz · perguntas
 *   ESCURO   CTA final + rodapé
 */
export default function LandingPage() {
  return (
    <main id="conteudo">
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
