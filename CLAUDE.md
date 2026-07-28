<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Subido — convenções do projeto

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

Plataforma B2C de assinatura da **Comunidade Subido de Tráfego** que forma **implementadores
de IA**. Quatro pilares — Soluções, Formações, Builder, Mentorias — e um HUB onde empresas
contratam os formados. A porta de entrada é uma **landing page pública de conversão**
alimentada por tráfego pago.

**A marca do produto é Subido, e só.** O design system que serve de base tem outra origem
(ver abaixo), mas isso é infraestrutura interna: nenhuma outra marca é nomeada, assinada ou
exibida no produto.

## Stack

Next.js 16 App Router · React 19 · TypeScript strict · Supabase · Vercel · **npm** (um lockfile).

**Sem Tailwind.** O design system é BEM/CSS-variables; Tailwind seria um segundo sistema de
tokens no mesmo repo, e a válvula `bg-[#...]` é como 69 cores hardcoded sobreviveram na
referência. Estilo local usa **CSS Modules** lendo os `--via-*`.

**Motion com disciplina de dobra, não motion proibido.** `motion` e `lenis` são dependências de
produção — a regra não é "não use", é **onde**. Ver `### Motion` abaixo antes de importar
qualquer uma das duas.

## Design System

`src/design-system/via/` é **vendorizado e gerado. NÃO EDITE NADA LÁ DENTRO.**

- Atualizar = trocar o SHA em `scripts/vendor-via.mjs` + `npm run vendor:via`. O diff é o changelog.
- `npm run check:ds-drift` roda no CI e reprova qualquer edição manual.
- Importe **sempre pelo barrel**: `import { Button } from '@/design-system/via'`.

O DS não se edita, então **toda correção a ele mora numa camada de override** — `src/styles/brand.css`
para tokens, `globals.css` para comportamento de documento. Quando o DS estiver errado, sobrescreva
e **escreva o motivo medido no comentário**; um override sem número vira mistério em três meses.

### Server vs Client

O vendor injeta `'use client'` **por arquivo**. **14 dos 47** são puros e ficam Server Components —
`Alert`, `Avatar`, `Breadcrumb`, `Button`, `Card`, `EmptyState`, `Icon`, `Input`, `Pagination`,
`Pill`, `Progress`, `Skeleton`, `Spinner`, `Stepper`. É isso que permite a landing rodar com ~zero
JS do DS. Consequências:

- Um `<Button>` server-rendered **não aceita `onClick`**. CTA é `<Link>`/`<a href>`.
- Se uma seção precisa de interação, é a **seção** que ganha `'use client'`, não o DS.
- Ícones `lucide-react` em Server Component custam zero JS. **Ícone mora em Server Component.**
- Módulo que exporta ícone exporta **elemento já renderizado** (`icone: <Boxes />`), nunca a
  referência ao componente (`icone: Boxes`). Com a referência, todo consumidor cliente passa a
  importar a biblioteca para poder chamá-la. Ver `(app)/_components/navegacao.tsx`.
- Consulte `src/design-system/via/DS_CLIENT.json` para a classificação de cada componente.

### Marca e paleta

**A marca do produto é Subido, e só.** O DS vendorizado (prefixo `--via-*`) vem de outra origem e
fornece a ARQUITETURA visual: superfície clara, hierarquia editorial, vidro + atmosfera + sombra
navy, escalas, Geist. A camada de marca sobrescreve a CROMÁTICA.

> `--via-*` e o nome da pasta são NOMES INTERNOS herdados da origem do DS. Não são marca e não
> podem aparecer em copy, `alt`, `aria-label`, metadata ou asset.

| Token              | Valor     | Uso                                |
| ------------------ | --------- | ---------------------------------- |
| `--via-navy`       | `#0B162D` | banda escura, tinta primária       |
| `--via-navy-deep`  | `#040B1A` | fundo da banda de fechamento       |
| `--via-bg`         | `#FAFDFF` | branco institucional               |
| `--via-accent`     | `#00A2FF` | **uso pontual, só sobre escuro**   |
| `--via-accent-ink` | `#0072BE` | única variante legível sobre claro |

**Regra do accent — do manual da marca, e a física concorda:** `#00A2FF` sobre branco dá **2,70:1**
(reprova AA até para texto grande); sobre a navy dá **6,52:1**. O azul é fisicamente uma cor de
destaque **sobre escuro**.

- ✅ Eyebrow, CTA primário, anel de foco, dot de "ao vivo", ícone de destaque — **em banda escura**.
- ❌ Fundo de seção, card grande, texto corrido, qualquer coisa sobre claro.
- Texto accent sobre claro: **só** `--via-accent-ink`.
- Rótulo sobre preenchimento accent: **navy escuro** (7,13:1). Branco reprova (2,76:1).
- **Preto não pertence à paleta.** Nada de `#000`.

**A escala de cinza inverte entre bandas, e essa é a armadilha de contraste mais cara do repo.**
Sobre claro, "mais quieto" = mais escuro (`--via-text-soft/muted/faint`). Sobre a banda navy isso
se inverte: `--via-text-soft` (#636D80) sobre `#0B162D` dá **3,45:1** e reprova AA a 14px.

- Sobre banda escura use **`--via-gray-300`** (12,2:1) ou **`--via-gray-400`** (6,99:1).
- **Nunca** `--via-text-soft/muted/faint` sobre escuro.
- `--via-text-faint` está sobrescrito para `#667085` em `brand.css`. O `#98A2B3` do DS rende
  **2,52:1** sobre branco e pinta justamente índices, notas de fonte e preços — texto pequeno.
  Não volte ao valor do DS.

### A identidade: as quatro famílias além da cor

Por muito tempo esta camada foi **cromática e só** — 32 dos 245 tokens do DS, todos de cor e
sombra, zero de tipografia, forma, densidade ou movimento. Era por isso que o produto lia como o
design system de origem com outra paleta: **a identidade mora exatamente nas famílias que a marca
não tocava.**

E o diagnóstico não foi de gosto, foi contagem. O DS oferece 4 durações de transição e 6 valores
de tracking; os módulos do app usavam **9 durações e 5 trackings inventados** — sete componentes
faziam o **mesmo hover de card** com sete durações diferentes (260/240/200/240/260/240/240).
**Valor que varia sem motivo é o que lê como "não preparado"**, antes de qualquer ornamento.

`npm run check:identidade` reprova quem não obedecer. Escape legítimo: `/* token-ok: motivo */`
em qualquer lugar da regra — a casa não proíbe desviar, proíbe desviar **sem o porquê escrito**.

**1 · Movimento — a duração é função do TAMANHO DO QUE MUDA.**

| Token            |       | Para                                          |
| ---------------- | ----- | --------------------------------------------- |
| `--app-t-state`  | 120ms | cor, opacidade, borda — nada se desloca       |
| `--app-t-touch`  | 180ms | hover e press — deslocamento de 2–8px         |
| `--app-t-reveal` | 320ms | entrada, layout, accordion — o elemento chega |
| `--app-t-scene`  | 480ms | overlay, drawer, percurso longo               |

A regra que faz disso linguagem: **estado e entrada nunca compartilham duração.** Quando um hover
e uma revelação levam o mesmo tempo, a interface lê chapada — tudo responde igual, nada tem peso
diferente. Os pares já carregam o easing (`snap` responde ao dedo, `out` desacelera e para).

**E há TRÊS categorias de movimento; só uma é sistemática.** `transition` é interação — é o
vocabulário de resposta que a pessoa aprende, e tem que ser o mesmo em toda parte. `animation`
é ambiente (o pulso de "ao vivo") ou coreografia (a cascata da landing): **autoral**, governado
pela regra oposta — cada ato recebe uma micro-interação diferente, ou nenhuma. Por isso o gate
cobre `transition` e não toca em `animation`.

**2 · Tipografia — o tracking é função do TAMANHO, não escolha por componente.**
`--app-ls-hero` (−0.034em) … `--app-ls-micro` (+0.012em), um por degrau da escala. Corpo grande
precisa de negativo, corpo pequeno de positivo; `--app-ls-caption` (13px) é onde a curva vira.

- **Mono caixa-alta tem dois valores, e a diferença é de PAPEL:** `--app-ls-eyebrow` (0.14em)
  dentro de card, `--via-ls-label` (0.18em) para rótulo de seção isolado. A 0.18em dentro de um
  card o rótulo já lê como pill decorativa, que a seção de Voz bane.
- **Caixa-alta por CONTEÚDO conta como caixa-alta.** `HOJE · 19:00 · 90 MIN · 12/30 VAGAS` não
  tem `text-transform` e mesmo assim precisa do tracking de eyebrow: a necessidade vem da forma
  das letras, não da propriedade CSS. Uma auditoria que só procura `uppercase` erra esse caso.
- `src/styles/type.css` fica **fora** do gate: é a camada que DEFINE a tipografia fluida da
  landing, onde `clamp()` não mapeia para degrau fixo. Policia-se o consumo, não a definição —
  e é por isso que as quebras autorais do hero sobreviveram à migração.

**3 · Forma — raio por PAPEL:** `--app-radius-surface` (28, superfície que contém outra) ·
`-card` (20) · `-control` (12) · `-chip` (8) · `-track` (4). `pill` só para o que é pílula por
natureza.

E a regra que mais separa acabamento de descuido, porque quase ninguém a enuncia:
**raio aninhado = raio externo − padding.** Cantos concêntricos. Um pôster de raio 20 dentro de
um card de raio 28 com 8px de folga está certo (28−8=20); o mesmo pôster com raio 28 está errado,
e o olho percebe antes de a pessoa saber dizer o quê.

**4 · Densidade:** `--app-pad-card` (20) · `-tight` (16) · `--app-gap-stack` (12) · `-block` (24)
· `-grid` (20) · `-section` (40) · `--app-h-control` (38px). Espaço escolhido livremente dentro
de uma escala de 14 degraus não é escala, são 14 opções.

**5 · Elevação é um TRIPLO.** O que separa "premium" de "ok" não é a sombra: é a sombra, a
hairline e a superfície **andarem juntas**. `--app-elev-{1,2,3}-{bg,line,shadow}` — repouso,
erguido, sobreposto. Usar a sombra de um nível com a hairline de outro é o desvio.

**6 · Foco é um ESTADO do sistema, não um detalhe de componente.** `--app-ring` (claro) e
`--app-ring-onnavy` (sobre banda escura). Componha com a sombra de repouso —
`var(--app-ring), var(--app-elev-1-shadow)` — para o elemento não achatar ao receber foco.

**A armadilha, agora com número:** o anel do DS é `box-shadow` e o de `globals.css` usa
`:where()`, que tem especificidade ZERO. Qualquer `.classe { box-shadow: … }` num interativo
o apaga, e nada reprova — nem tsc, nem eslint, nem build. Medido no navegador com
`:focus-visible` ativo e a transição terminada: **oito seletores** estavam sem anel nenhum,
incluindo os quatro cards de pilar e o CTA primário do hero — o botão que recebe o clique pago.
`check:identidade` agora reprova `box-shadow` + `:hover` sem `:focus-visible`.

> Ao medir foco, dois erros custam caro e os dois aconteceram aqui: `el.focus()` **não** dispara
> `:focus-visible` (o navegador exige modalidade de teclado), e ler o computed no meio da
> transição devolve o valor interpolado. Meça com `transition: none`, ou logo após um Tab real.

**O que ainda NÃO está no nível:** **23 breakpoints distintos** (419, 420, 480, 520, 559, 560,
599, 640, 720, 767, 768, 860, 900, 1023, 1024, 1079, 1080, 1099, 1120, 1279, 1280, 1439, 1800).
Isso não é sistema responsivo, são 23 decisões independentes. A escala canônica é
**600 · 768 · 900 · 1080 · 1280 · 1440** (e `n−1` para `max-width`). A migração é **por tela, ao
tocá-la** — trocar 23 breakpoints de uma vez muda o layout de toda a plataforma e exige
verificação visual que a área logada ainda não permite sem sessão. Não está gateado de propósito:
gate com 23 exceções não é gate.

### Como compor uma seção

Esta é a parte construtiva: o que fazer, não só o que evitar.

**1 · Decida o RITMO antes do conteúdo.** A landing tem exatamente **três bandas escuras** (hero,
HUB, CTA final) num corpo claro. Não é decoração: é a estrutura de leitura de uma página de 11 mil
pixels, e é o que a faz respirar em vez de alternar mecanicamente. Uma quarta banda escura precisa
justificar por que vira um quarto momento de decisão.

**2 · Escolha a largura pelo TIPO de conteúdo, não pelo nível hierárquico.**

| Largura         | Para                                                      |
| --------------- | --------------------------------------------------------- |
| `wide` (1280)   | grades, tabelas, mosaicos — coisas que precisam de área   |
| `content` (760) | prosa editorial, FAQ — coisas que precisam de linha curta |
| `narrow` (560)  | desqualificador, garantia — coisas que precisam de foco   |

**Na ÁREA LOGADA a largura é `--app-canvas` (1600), não `--via-container`.** O 1280 do DS foi
dimensionado para a landing, onde a página ocupa a viewport inteira; na plataforma o trilho já
come 240px antes de o conteúdo começar. Medido: a 1920 sobravam **336px** de calha morta à
direita, a 2560 sobravam 976. Formulário e prosa (`/conta`, `/admin`) ficam em `--via-content` —
ali a página INTEIRA é uma coluna de leitura.

**E a regra que torna a largura segura, porque separa os dois casos que parecem um:**

- **GRADE ganha COLUNA.** Nunca card mais gordo. A 1600 com 3 colunas o card de solução iria a
  520px e o resumo de duas linhas viraria faixa; com 4, fica em 385 — dentro da faixa de 340–420
  em que foi desenhado. Pôster 3:4 engorda em duas dimensões (385 de largura = 513 de altura),
  então ganha a quinta coluna antes. **Skeleton repete os mesmos breakpoints da grade real** —
  contagem diferente faz a tela pular no fim do load.
- **LISTA tem MEDIDA, igual a prosa.** O item da agenda é uma linha só (hora + título + mentor +
  CTA): acima de ~1080 o miolo vira vão morto entre o título e o botão. Lista não acompanha o
  canvas; o hero acima dela acompanha, porque card com mesh gosta de largura.
- **Contagem FIXA de cards não ganha coluna** — deixaria buraco na fileira. Em vez disso a grade
  para de crescer numa largura DERIVADA: o teaser de 3 cards do `/inicio` para em
  `3 × 420 + 2 × 20 = 1300`.

Nada disso funciona sem o item 3 abaixo: é a medida de leitura viver no elemento de texto que
permite o container ser largo.

Classe tipográfica pela mesma lógica: `.t-display` = cabeçalho de largura total; `.t-title` =
cabeçalho dentro de coluna. O `clamp()` escala com a viewport, mas **o título vive numa coluna** —
por isso `--type-hero` tem teto de `4rem`. Acima disso a linha mais longa do hero quebra sozinha e
destrói as quebras autorais.

**3 · Medida de leitura em `ch` mora no ELEMENTO de texto**, nunca no container. `ch` é relativo ao
font-size de quem declara: `20ch` num container que herda 16px vale ~180px e esmaga o título em
sete linhas; no `<h2>`, vale a medida pretendida.

**E o `ch` do Geist MENTE por ~30% — a unidade é a largura do glifo `0`, que nesta fonte é bem
mais estreito que a média das minúsculas.** Medido no navegador (largura da caixa ÷ glifo médio),
na ficha do Builder: `72ch` entregava **94 caracteres** por linha, `68ch` dava 89, `62ch` dava 81 —
todos acima da faixa confortável de **45–75**, e nenhum lint pega isso. O fator é constante, então
o alvo real é **caracteres ÷ 1,3**: ~52ch para 68 caracteres. Ao escrever uma medida nova, meça;
não copie o número de outro arquivo achando que 65ch dá 65 caracteres.

**Órfã não é problema de medida, é de quebra.** Com a medida certa ainda sobrava "…compensa a API
oficial / paga." — uma palavra sozinha na última linha lê como erro de composição. `text-wrap:
pretty` nos textos secundários resolve sem mexer na largura, e só reflowa o último punhado de
linhas. `balance` fica para títulos de poucas linhas.

**4 · Hierarquia por peso editorial e cor SÓLIDA.** Nunca por opacidade — opacidade sobre banda
escura derruba o contraste abaixo de AA e some no mobile em luz forte. Dois tons sólidos fazem o
trabalho que a opacidade fingiria fazer.

**5 · Números são protagonistas.** Geist Mono, `tabular-nums`, tinta sólida, `min-width` reservado
em `ch` para não causar reflow no count-up. Todo número na página é prova; recebe tratamento de
prova, com fonte atribuída por perto.

**6 · Assimetria é composição, não desleixo.** Se todas as seções têm a mesma altura, a mesma grade
e a mesma contagem de itens, a página lê como template — mesmo que cada seção isolada esteja
bonita. Ver a seção seguinte.

### Como NÃO fazer design genérico

Estas são as assinaturas de "design gerado". Nenhuma é detectável por lint: são detectáveis
**medindo a página renderizada**. Cada uma vem com o substituto.

**Alternating feature rows.** N seções consecutivas com o mesmo layout 50/50, alternando só o lado
da imagem por `i % 2`. É o estado atual dos quatro pilares: medido a 1280px, as alturas são
**614 / 601 / 601 / 601px** — três idênticas ao pixel, com a mesma grade, o mesmo gap e uma lista
de exatamente 3 fatos em cada.
→ **Quebre pelo menos um.** Seções com peso comercial diferente não podem ter peso visual igual.
E **varie a contagem de itens**: 3/3/3/3 denuncia o molde sozinho.

**Motion uniforme.** O mesmo efeito aplicado a N seções é uma grade de cards girada 90°.
→ **Cada ato recebe uma micro-interação DIFERENTE, ou nenhuma.** Retirar um acessório é parte da
composição — depois de um momento de delícia, contenção é o certo. **Uma delícia genuína por
página, não cinco medianas.**

**Placar perfeito na tabela "nós vs. eles".** Hoje a coluna do produto acerta 6 de 6 e uma
concorrente erra 6 de 6. Placar perfeito é sinal de tabela escrita para a conclusão, não medida.
→ **Dê ao produto pelo menos um `false` honesto.** 5/6 com um ponto cedido é mais crível que 6/6, e
é coerente com uma página que se recusa a prometer renda no disclaimer do HUB.

**Largura de rótulo arbitrária em definition list.** `/conta` usa `grid-template-columns: 160px 1fr`;
medido, o `<dt>` "Nome" ocupa 160px e deixa ~135px de vazio.
→ `max-content 1fr` ou `minmax(auto, 12ch) 1fr`. Largura fixa em rótulo é chute com aparência de
decisão.

**Escassez como MECANISMO.** Banir "GARANTA JÁ" no nível lexical não impede um contador regressivo
com copy sóbria.
→ **Zero contador, zero "vagas restantes", zero "oferta expira", zero barra de lotação.** Escassez
real vira data e número verificáveis: "turma abre em 12/ago, 40 vagas". Escassez fabricada e
verificável convertem parecido no clique e divergem por completo no reembolso.

**Revelação teatral de preço.** Nada de "não vai custar R$ 100.000".
→ **Ancoragem por subtração que o leitor executa**: tabela de equivalentes de mercado com total,
depois o preço em corpo de texto seco. O H2 "Quanto custa." é a decisão, não um rascunho.

**Grade uniforme de cards com ícone em círculo**, `border-radius` idêntico em tudo, ilustração
vetorial de pessoas, badge com emoji, blob de gradiente roxo/ciano.
→ Produto real em `DeviceFrame`. Enquanto não existir, **`AssetPlaceholder` é visivelmente uma
pendência de propósito** — não o substitua por imagem de banco nem por silhueta "temporária".

**Comentário que descreve o que a página não tem.** `Reveal.tsx` promete "uma marquee" que não
existe em lugar nenhum.
→ **Comentário que lista o que existe precisa bater com o que existe.** Comentário falso ensina o
próximo agente a mentir sobre o repo — e a mentira é verificável com um grep.

### Motion

`motion` (12.x) e `lenis` **são dependências de produção**. A regra não é "não use" — é **onde**.

- **Acima da dobra: peso zero de biblioteca.** O hero é CSS puro, disparado no mount. Nenhum
  import de `motion` na árvore do hero. É a página que recebe o clique pago; o LCP é o produto.
- **Abaixo da dobra**: `motion` liberado para coreografia ligada a scroll. Hoje só em `Parallax`,
  usado por `PillarSection`.
- **Nenhum listener de `scroll` em lugar nenhum.** Só `IntersectionObserver`. É o que protege o INP.
- Anime **só `transform` e `opacity`**. Nunca `height/top/left/margin`. Nunca `transition: all`.
- **Nunca `opacity: 0` como default de CSS.** O estado base de reveal é aplicado por JS; sem isso a
  página sobe invisível para o Googlebot e para quem tem JS desabilitado.
- **Nunca anime `opacity` num ANCESTRAL de elemento com `backdrop-filter`.** Opacidade < 1 cria um
  grupo composto: o filho passa a amostrar o grupo em vez da página e o vidro simplesmente não
  acontece. Entrada de barra de vidro é só `transform`.
- `prefers-reduced-motion` sempre honrado, e "honrado" significa **conteúdo no estado final**, não
  animação rápida.
- **Cascata de entrada usa `animation-fill-mode: backwards`, NUNCA `forwards`.** `forwards` retém o
  valor **animado**, e um `to { transform: none }` interpolado resolve para `matrix(1,0,0,1,0,0)` —
  a matriz identidade. Visualmente é nada; para o CSS é um transform, e **transform cria containing
  block para `position: fixed` de qualquer descendente**. Medido na área logada: o `Modal` do DS
  (que renderiza na árvore, não em portal) ancorava na seção em vez da viewport — a 375 nascia
  348px abaixo do centro, com o CTA 234px fora da tela e nada rolando até ele.
  **Escrever `to { transform: none }` não resolve** — o problema é a retenção, não o valor. Com
  `backwards`, o `from` só vale durante o atraso e a animação, e o estado final é o do próprio
  elemento. De quebra, o estado base deixa de precisar de `opacity: 0` no CSS, o que resolve a
  regra acima em vez de contorná-la.

### Armadilhas que passam com o build verde

`tsc + eslint + build = 0` não detecta nenhuma destas. Todas custaram um bug em produção ou perto.

- **`var()` de token que não existe não dá erro em lugar nenhum — a declaração inteira é
  descartada e a propriedade cai na herança.** `--via-fs-lead` foi inventado por analogia com
  outros design systems; a escala do DS tem `h4` (18px) e não tem "lead". O resumo da ficha do
  Builder ficou em 16px herdados, sem aviso, com tsc/eslint/build verdes. **`check:identidade`
  reprova token fantasma** — `var(--x, fallback)` passa, porque o fallback declara que a ausência
  é esperada.
- **Nunca escreva `-webkit-backdrop-filter` ao lado da versão sem prefixo. Declare só
  `backdrop-filter`.** O Lightning CSS já prefixa pelo browserslist e, ao achar a duplicata manual,
  **descarta as duas**. Medido no CSSOM: saía `none`, com o conteúdo passando nítido por trás da
  barra.
- **Todo `backdrop-filter` carrega um `@supports not (backdrop-filter: blur(1px))`** que troca o
  fundo translúcido por superfície sólida. Sem suporte, translucidez vira ilegibilidade.
- **Mantenha `html { scroll-behavior: auto }` em `globals.css`** — override obrigatório do
  `smooth` que o DS declara. Com o smooth ligado, Lenis e navegador disputam o scroll e **toda
  âncora da página para de rolar**: o hash muda, a página fica parada, sem erro no console.
- **Lenis com `anchors: true` e NUNCA offset próprio.** A folga de âncora é definida uma vez só, em
  `scroll-padding-top`. Com offset próprio as duas compensações somam e as seções param a 176px do
  topo.
- **Chrome com âncoras de seção é montado na PÁGINA que tem os alvos, nunca no layout do grupo.**
  `(legal)` é um route group aninhado em `(marketing)`: montado no layout, o header ia junto para
  `/termos`, `/privacidade` e `/reembolso`, onde 7 das 9 âncoras não tinham alvo. "Header repetido,
  move pro layout" é a limpeza mais óbvia que existe e é a errada.
- **Barra fixa oculta recebe `inert` + `visibility: hidden`**, não só `transform`. Uma barra apenas
  transladada continua no fluxo de tabulação e prende quem navega por teclado.
- **Sentinela de header é uma faixa da ALTURA do hero, não um ponto**, e a geometria é lida ao vivo
  com `getBoundingClientRect()`, ignorando o `entry`. Com sentinela pontual, um salto de âncora que
  vai de "abaixo da viewport" para "acima" não muda o estado de interseção e o observer nunca
  dispara.
- **UI que depende de `localStorage` usa `useSyncExternalStore`** com snapshot de servidor, nunca
  `useEffect` + `setState`.
- **Destino de CTA é campo obrigatório do tipo**, nunca um ternário no JSX. Três botões de compra já
  apontaram para âncoras que nunca existiram: o clique trocava a URL e a página não saía do lugar,
  sem erro e sem 404.

### Voz

- Banido: revolucionar, transformar, potencializar, destravar, game-changer, `!`, CAIXA ALTA,
  urgência fabricada.
- **Banidos visuais**: dourado/âmbar/amarelo, roxo "IA", magenta, neon, gradiente quente "premium",
  `Sparkles`, emoji decorativo, caps-lock com letterspacing alto em pills, dot decorativo antes de
  texto, verde/vermelho de semáforo. Cyan segue banido como _decoração_.
- **Cores só por token.** Hex literal reprova em `check:identidade` (não é regra de
  eslint — era o que o texto dizia antes de o gate existir).
- **Nunca Lexend**, **nunca headline caixa-alta condensada** — a tipografia é Geist, sempre.
- A assinatura é **glass + atmosférico + sombra navy** — **não glow**.
- **Ênfase é `<em>` itálico. Nunca `font-weight: 700`.** Exceção única: o `<h1>` do hero, elemento
  de LCP — ali a ênfase é por tom sólido. Itálico arrastaria a face itálica (+72 KB) para o caminho
  crítico por causa de uma palavra.
- Preferido: número específico + fonte atribuída + verbo concreto.
- **Nenhuma estatística de mercado sem fonte inline.** Um "87% das empresas…" órfão anula o
  investimento da nota de atribuição, que gasta uma linha dizendo de onde vêm os números.
- CTA: verbo infinitivo, 2–4 palavras, sentence-case. **O vocabulário é travado** — rótulo novo
  exige justificar por que os existentes não servem. Com 5 CTAs na página e `lp_cta_click`
  discriminando por `local`, rótulos divergentes tornam o relatório ilegível.
- **Todo depoimento carrega nome, foto, cidade ou segmento, prazo e resultado com número.**
  Depoimento sem número é decoração — corte o card, não o número.
- **Depoimento nunca é reescrito.** A voz autoral da página é da casa; a voz citada é do aluno,
  verbatim, gíria inclusa.
- **Prova emprestada só entra ROTULADA.** Se o depoimento vem da comunidade e não desta plataforma,
  a seção muda de nome e a origem fica dita no corpo, não em nota de rodapé. É a única coisa que
  afundaria esta página, porque todo o resto dela é construído sobre atribuição.
- **Venda o que não existe pelo MECANISMO e pela DATA, nunca pelo resultado.** O disclaimer de
  não-promessa mora na própria seção, nunca em rodapé ou tooltip. Nenhum avatar silhueta é
  apresentado como membro real. Isso é exposição de CDC/CONAR, não preferência estética.

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

### O Builder roda em Edge Function, e isso muda três regras

A chave da Anthropic mora nos **secrets do Supabase**, não no `.env.local` nem na Vercel. Secret
do Supabase só é injetado no runtime Deno das Edge Functions — um Route Handler do Next lê
`process.env` do processo dele e **nunca enxerga aquele cofre**. Não é permissão, é endereço. Foi
por isso que a geração migrou para `supabase/functions/builder/`.

- **O app não sabe se a chave existe.** A tela não desabilita mais o campo por falta dela; a
  ausência aparece na primeira chamada, como erro com o nome do secret. É o preço de o segredo
  sair do alcance de quem desenha a tela — e está dito no comentário do `Compositor`.
- **A geração é TAREFA DE FUNDO, não request longo.** A plataforma derruba com 504 qualquer função
  que não responda em **150s** (`request idle timeout`) e a geração leva de 1 a 3 minutos. A rota
  responde `202` em milissegundos e continua em `EdgeRuntime.waitUntil`, cujo teto é o wall clock
  do isolate — **400s no plano pro**. De quebra, fechar a aba deixou de cancelar a geração. Quem
  conta a espera é o banco: a tela repete o RSC até o `status` mudar.
- **Nada de `SUPABASE_SERVICE_ROLE_KEY` nas funções.** Elas repassam o `Authorization` do chamador,
  então a RLS continua sendo a barreira. Com service role, `dono` viraria um campo que o código
  precisa lembrar de conferir. O JWT vale ~1h e a geração leva minutos — não é preciso escalar
  privilégio para gravar o resultado depois.
- **O schema Zod tem um dono só.** `src/lib/builder/schema.ts` é a fonte; o arquivo do Deno é
  GERADO dela (`npm run gen:schema-edge`), trocando apenas o especificador do import. `npm run
check:schema-edge` reprova se estiver atrasado. Dois arquivos que "precisam ser iguais" é
  exatamente a história que abre este documento.
- `supabase/functions/**` fica **fora** do `tsconfig` e do eslint: é Deno, com `npm:`/`jsr:` nos
  imports, `.ts` no caminho e globais que o config do Next não conhece. Quem checa é o
  `npm run check:edge` (precisa do Deno instalado).

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

| Momento          | O que roda                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pre-commit (~2s) | `lint-staged` (não-bloqueante) + `check-single-lockfile` (bloqueante)                                                                                                   |
| PR               | lockfile · **ds-drift** · **identidade** · `tsc --noEmit` · `eslint .` · `prettier --check` · testes · build · Playwright · Lighthouse budget · grep de ref do Supabase |

Nenhuma regra de lint é `warn`. Se não é aplicado no CI, é sugestão — e sugestão não sobrevive.

## Verificações que build verde não substitui

- `npm run build` deve marcar `/` como **○ (Static)**. Se virar `ƒ (Dynamic)`, algo vazou.
- **Painel de rede na landing: nenhum chunk do design system baixado.**
- Com JS desabilitado, a página renderiza inteira e visível.
- Com `prefers-reduced-motion: reduce`, nada anima e todo conteúdo está no estado final.
- `tsc + build + eslint = 0` **não basta**: nenhum deles detecta bug visual.
