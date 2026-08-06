import { PILLARS } from '@/content/landing';
import { SiteHeader } from './_components/chrome/SiteHeader';
import Image from 'next/image';
import appSolucoes from '@/assets/img/app-solucoes.avif';
import appFormacoes from '@/assets/img/app-formacoes.avif';
import appBuilder from '@/assets/img/app-builder.avif';
import appMentorias from '@/assets/img/app-mentorias.avif';
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
/**
 * PRINTS REAIS DA PLATAFORMA, não mockup — é o que a doutrina exige da moldura de
 * produto, e o que separa esta página de uma landing de template.
 *
 * Capturados em 3200×2000 (16:10, a proporção exata do DeviceFrame) com a plataforma
 * rodando e sessão real, depois reduzidos para 2400×1500 e convertidos para AVIF:
 * 532 kB somados contra 5 MB em PNG. 2400 cobre o maior uso — a moldura do Builder,
 * que na variante destaque vai a 1214 CSS — em tela 2×.
 *
 * NÃO AUDITE ISTO POR `naturalWidth`. Com `srcset`, o `naturalWidth` vem CORRIGIDO
 * PELA DENSIDADE que o navegador escolheu: aqui ele mediu 666×416 e me levou à
 * conclusão FALSA de que o otimizador devolvia 1/3 da resolução. O que vale é pedir a
 * URL do otimizador direto e medir os bytes — `w=3840` devolve 2400×1500, e com
 * `Accept: image/avif` sai em 35 kB.
 *
 * O ALT DESCREVE O QUE A TELA MOSTRA, não "captura de tela do produto". Quem usa
 * leitor de tela precisa da informação que a imagem carrega; repetir o rótulo da
 * seção não acrescenta nada e ainda faz o leitor anunciar duas vezes a mesma coisa.
 */
const ALT = {
  solucoes:
    'Catálogo de soluções da plataforma: 10 disponíveis, filtradas por área, cada card com resumo, ferramentas e número de etapas.',
  formacoes: 'Catálogo de formações: 4 disponíveis, com capa, estado de progresso e busca.',
  builder:
    'Tela inicial do Builder: o campo onde se descreve o problema do cliente e o histórico de projetos no canto.',
  mentorias:
    'Agenda de mentorias: a próxima sessão em destaque com mentor, horário e vagas, e a lista por dia embaixo.',
} as const;

/* A moldura ocupa metade da grade nos pilares alternados e a largura do contêiner no
   destaque. Sem `sizes` o Next assume 100vw e serve variante grande demais nos três
   primeiros. */
const SIZES = {
  coluna: '(min-width: 1024px) 50vw, 100vw',
  larga: '(min-width: 1280px) 1280px, 100vw',
} as const;

export default function LandingPage() {
  return (
    <main id="conteudo">
      <SiteHeader />
      <HeroSection />
      <CredibilityStrip />
      <PillarsIndex />

      {/* COMPOSIÇÃO EXPLÍCITA, e não `i % 2`. O módulo dava a cada pilar o mesmo peso
          por construção — e o resultado era medível: 614 / 601 / 601 / 601px de
          altura, três idênticas ao pixel. Escrito à mão, a exceção do Builder fica
          visível no código em vez de escondida numa aritmética de índice, e mudar a
          ordem dos pilares deixa de reatribuir silenciosamente tom e lado.
          O Builder é o único que a concorrência não tem: biblioteca de soluções e
          trilha em vídeo são commodity, gerador de projeto não é. */}
      <PillarSection
        pillar={PILLARS[0]!}
        tone="light"
        media={<Image src={appSolucoes} alt={ALT.solucoes} sizes={SIZES.coluna} />}
      />
      <PillarSection
        pillar={PILLARS[1]!}
        flip
        tone="tint"
        media={<Image src={appFormacoes} alt={ALT.formacoes} sizes={SIZES.coluna} />}
      />
      <PillarSection
        pillar={PILLARS[2]!}
        variante="destaque"
        tone="light"
        media={<Image src={appBuilder} alt={ALT.builder} sizes={SIZES.larga} />}
      />
      <PillarSection
        pillar={PILLARS[3]!}
        flip
        tone="tint"
        media={<Image src={appMentorias} alt={ALT.mentorias} sizes={SIZES.coluna} />}
      />

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
