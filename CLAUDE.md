<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Viver de IA × Subido — convenções do projeto

> **Este é o ÚNICO arquivo de instruções do projeto.** `AGENTS.md` é um symlink para cá.
> A plataforma de referência mantinha três arquivos (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`)
> descrevendo três design systems diferentes e contradizendo uns aos outros — foi assim que ela
> acabou com três design systems de verdade. Nunca crie um segundo arquivo.

## PRE-FLIGHT

Antes de qualquer ação, uma pergunta: **isso cruza a fronteira do merge ou de produção?**

- **Não** → modo iteração. Faça direto, ciclo curto, sem cerimônia.
- **Sim** → modo produção. Os gates abaixo são obrigatórios, sem exceção.
- **Em dúvida → trate como produção.**

Princípio: **gates na porta de saída, não a cada passo.** O pre-commit leva ~2s de propósito;
o typecheck pesado é gate de merge.

## O produto

Plataforma B2C de assinatura, joint venture entre Viver de IA e Pedro Sobral, que forma
**implementadores de IA**. Quatro pilares — Soluções, Formações, Builder, Mentorias — e um HUB
onde empresas contratam os formados. A porta de entrada é uma **landing page pública de
conversão** alimentada por tráfego pago.

## Stack

Next.js 16 App Router · React 19 · TypeScript strict · Supabase · Vercel · **npm** (um lockfile).

**Sem Tailwind.** O design system é BEM/CSS-variables; Tailwind seria um segundo sistema de
tokens no mesmo repo, e a válvula `bg-[#...]` é como 69 cores hardcoded sobreviveram na
referência. Estilo local usa **CSS Modules** lendo os `--via-*`.

**Sem biblioteca de motion.** CSS + um hook de `IntersectionObserver`. `framer-motion` são ~40 KB
na página LCP-crítica de um funil pago.

## Design System

`src/design-system/via/` é **vendorizado e gerado. NÃO EDITE NADA LÁ DENTRO.**

- Atualizar = trocar o SHA em `scripts/vendor-via.mjs` + `npm run vendor:via`. O diff é o changelog.
- `npm run check:ds-drift` roda no CI e reprova qualquer edição manual.
- Importe **sempre pelo barrel**: `import { Button } from '@/design-system/via'`.

### Server vs Client

O vendor injeta `'use client'` **por arquivo**. **14 dos 47** componentes são puros e ficam como
Server Components — `Alert`, `Avatar`, `Breadcrumb`, `Button`, `Card`, `EmptyState`, `Icon`,
`Input`, `Pagination`, `Pill`, `Progress`, `Skeleton`, `Spinner`, `Stepper`. É isso que permite
a landing rodar com ~zero JS do DS. Consequências:

- Um `<Button>` server-rendered **não aceita `onClick`**. CTA é `<Link>`/`<a href>`.
- Se uma seção precisa de interação, é a **seção** que ganha `'use client'`, não o DS.
- Ícones `lucide-react` em Server Component custam zero JS. **Ícone mora em Server Component.**
- Consulte `src/design-system/via/DS_CLIENT.json` para a classificação de cada componente.

### A fusão Viver de IA × Subido

A camada de fusão mora em `src/styles/brand.css`, carregada **depois** dos tokens do DS.
O design system vendorizado nunca é editado — é isso que mantém o `check-ds-drift` válido.

Os dois sistemas são complementares: o **VIA traz a arquitetura** (superfície clara, hierarquia
editorial, vidro + atmosfera + sombra navy, escalas, Geist) e a **CST traz a cromática** (navy
institucional, branco frio e — o que o VIA não tinha — um **accent**).

| Token              | Valor     | Origem                                        |
| ------------------ | --------- | --------------------------------------------- |
| `--via-navy`       | `#0B162D` | CST institucional                             |
| `--via-navy-deep`  | `#040B1A` | CST institucional                             |
| `--via-bg`         | `#FAFDFF` | CST branco institucional                      |
| `--via-accent`     | `#00A2FF` | CST — **uso pontual**                         |
| `--via-accent-ink` | `#0072BE` | derivado · única variante legível sobre claro |

**Regra do accent (do manual da CST, e a física concorda):**

> "Utilize o azul #00A2FF de forma pontual. Não é recomendado aplicá-lo em grandes áreas,
> especialmente em fundos. Esse tom deve ser reservado para elementos de destaque."

Medido: `#00A2FF` sobre branco dá **2,70:1** (reprova AA até para texto grande); sobre a navy CST
dá **6,52:1** (passa com folga). O azul é fisicamente uma cor de destaque **sobre escuro**.

- ✅ Eyebrow, CTA primário, anel de foco, dot de "ao vivo", ícone de destaque — **em banda escura**.
- ❌ Fundo de seção, card grande, texto corrido, qualquer coisa sobre claro.
- Texto accent sobre claro: **só** `--via-accent-ink`. Nunca `--via-accent`.
- Rótulo sobre preenchimento accent: **navy escuro** (7,13:1). Branco reprova (2,76:1).
- **A cor preta não pertence à paleta da CST.** Nada de `#000`.

**O ritmo de bandas é o mecanismo de co-branding.** Três momentos escuros (hero, HUB, CTA final)
num corpo claro: banda escura é território da CST, corpo editorial claro é território do VIA.
Isso vale mais do que repetir um lockup em toda seção — e o lockup aparece em exatamente quatro
lugares: barra sticky, eyebrow do hero, seção de autoridade e rodapé.

### Leis estéticas (não negociáveis)

- A assinatura é **glass + atmosférico + sombra navy** — **não glow**.
- Hierarquia por **peso editorial e cor sólida**, nunca por opacidade.
- Ênfase é `<em>` itálico. **Nunca `font-weight: 700`** para dar destaque.
- **Banidos**: dourado/âmbar/amarelo, roxo "IA", magenta, neon, gradiente quente "premium",
  `Sparkles`, emoji decorativo (✨🚀💪🔥), caps-lock com letterspacing alto em pills, dot
  decorativo antes de texto. (Cyan continua banido como _decoração_ — o único azul da paleta é
  o `--via-accent`, sob as regras acima.)
- **Cores só por token `var(--via-*)` / `var(--cst-*)`.** Hex literal é erro de lint.
- **Nunca Lexend**, **nunca headline caixa-alta condensada** — a tipografia é Geist, sempre.
- Logos de terceiros: **sempre monocromáticos** (navy ou branco), inclusive bandeiras de
  pagamento. Logo nunca é recolorido por `filter` CSS; respeite a angulação e o arredondamento
  do logotipo original da CST em qualquer adaptação.
- Motion: só `transform` e `opacity`. Nunca `height/top/left/margin`. Nunca `transition: all`.
  Sempre honrar `prefers-reduced-motion`.
- **Nunca enviar `opacity: 0` como default de CSS** — o estado base de reveal é aplicado por JS.
  Sem isso a página sobe invisível para o Googlebot.

### Voz

- Banido: revolucionar, transformar, potencializar, destravar, game-changer, `!`, CAIXA ALTA,
  urgência fabricada ("GARANTA JÁ").
- Preferido: número específico + fonte atribuída + verbo concreto.
- CTA: verbo infinitivo, 2–4 palavras, sentence-case.
- **Depoimento nunca é reescrito.** A voz autoral da página é VIA; a voz citada é do aluno,
  verbatim, gíria inclusa.

## Armadilhas do Next 16 (verificadas, não decoradas)

- `middleware.ts` virou **`proxy.ts`**, e roda **só em nodejs — não há edge**. Cada rota casada
  pelo matcher custa uma invocação de função.
- **O matcher do `proxy.ts` NÃO pode pegar `(marketing)`.** O matcher do quickstart do Supabase
  pega tudo menos assets estáticos; copiado literalmente, `/` deixa de ser estática e cada clique
  pago paga um cold start.
- **Nunca chame `cookies()`, `headers()` ou leia `searchParams` em `(marketing)`.** Qualquer um
  tira a rota do shell estático.
- `revalidateTag(tag)` com 1 argumento é **erro de tipo**: precisa de um perfil `cacheLife` como
  2º argumento. Todo snippet de Next 15 na internet está errado.
- **`@import` de CSS com alias `@/` falha silenciosamente no Turbopack** — CSS usa node
  resolution, não paths do tsconfig. Use caminho relativo em `globals.css`.
- `params` e `searchParams` são `Promise`. Use os helpers `PageProps<'/rota'>` / `LayoutProps<'/'>`
  gerados por `next typegen`.

## Dados

- Leitura no load → **RSC**. Sem React Query.
- Mutação → **Server Action** + `updateTag` / `revalidateTag(tag, 'max')`.
- React Query **só** para estado do cliente (lista infinita com filtro, toggle otimista, polling).
  `QueryClientProvider` mora em `(app)/layout.tsx` — marketing nunca o carrega.
- **Query key sempre pela fábrica** `@/lib/query/keys`. Array inline é erro de lint.
- `lib/supabase/server.ts` exporta uma **função**, nunca um singleton — cookies são request-scoped
  e singleton vaza sessão entre requests.
- **Nunca exponha `error.message` cru do PostgREST** ao usuário. Use `handleError`.
- Env só por `@/lib/env`. **Nunca hardcode URL ou ref do Supabase** — há grep no CI.

## Banco

- Helpers de policy vivem no schema **`private`**, com `security definer` e
  **`set search_path = ''`** (vazio, nomes qualificados).
- Sempre `(select auth.uid())` dentro de subquery — o Postgres promove a InitPlan e avalia uma vez
  por query em vez de uma por linha.
- Papéis moram em `user_roles`, **nunca** como coluna em `profiles` (evita recursão `42P17`).
- Toda policy tem `TO` explícito. Toda coluna em predicado de policy é indexada.
- **Nunca** checagem de admin por domínio de e-mail. Autorização é grant explícito.
- **Nunca edite migration já aplicada** — crie uma follow-up.

## Gates

| Momento          | O que roda                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| pre-commit (~2s) | `lint-staged` (não-bloqueante) + `check-single-lockfile` (bloqueante)                                                                                  |
| PR               | lockfile · **ds-drift** · `tsc --noEmit` · `eslint .` · `prettier --check` · testes · build · Playwright · Lighthouse budget · grep de ref do Supabase |

Nenhuma regra de lint é `warn`. Se não é aplicado no CI, é sugestão — e sugestão não sobrevive.

## Verificações que build verde não substitui

- `npm run build` deve marcar `/` como **○ (Static)**. Se virar `ƒ (Dynamic)`, algo vazou.
- **Painel de rede na landing: nenhum chunk do design system baixado.**
- Com JS desabilitado, a página renderiza inteira e visível.
- Com `prefers-reduced-motion: reduce`, nada anima e todo conteúdo está no estado final.
- `tsc + build + eslint = 0` **não basta**: nenhum deles detecta bug visual.
