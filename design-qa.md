# Design QA — Mapa da Jornada

## Evidências

- Source visual truth:
  `/Users/rafaelmilagre/.codex/generated_images/019fdd66-6f36-72c0-bc9c-ccbbdebce4df/exec-4106a984-1346-42e9-b0d5-182ba2498be8.png`
- Implementação renderizada:
  `http://127.0.0.1:3107/preview/mapa-jornada` em Next.js dev, no navegador interno do Codex.
- Screenshot de repouso usado na comparação visual:
  `/Users/rafaelmilagre/Documents/Codex/2026-08-07/v/work/design_qa/mapa-implementacao-final.png`
- Screenshot do código final após o teste de interação (foco visível em Vender):
  `/Users/rafaelmilagre/Documents/Codex/2026-08-07/v/work/design_qa/mapa-implementacao-final-2.png`
- Comparação lado a lado:
  `/Users/rafaelmilagre/Documents/Codex/2026-08-07/v/work/design_qa/comparacao-mapa-final-2.png`
- Screenshot responsivo:
  `/Users/rafaelmilagre/Documents/Codex/2026-08-07/v/work/design_qa/mapa-mobile.png`
- Viewport desktop: `1487 × 1058` CSS px.
- Source: `1487 × 1058` px. Implementação: `1487 × 1058` px.
- Densidade: capturas normalizadas em 1:1; não houve redimensionamento antes da comparação.
- Estado comparado: etapa **Vender**, primeiro diagnóstico concluído, Clínica Aurora como fixture
  de preview. A rota real usa dados do usuário e não publica a fixture.

## Full-view comparison

O frame, a sidebar navy, o cabeçalho com workspace, a hierarquia do título, os cinco marcos, a
curva topográfica, a posição do marco ativo e a grade inferior preservam a composição aprovada.
Os três painéis começam na mesma dobra e mantêm proporções equivalentes. A implementação usa a
ilustração gerada como imagem real, não CSS art, e ícones Lucide de uma única família.

A comparação final mostra duas diferenças intencionais:

- a sidebar lista apenas destinos que existem ou estão sendo renomeados no produto atual, em vez
  de criar rotas falsas para todos os itens conceituais do mock;
- as anotações manuscritas da referência não foram embutidas na ilustração; o estado atual fica no
  card central acessível e atualizável.

Nenhuma diferença altera a tarefa principal, a hierarquia, a densidade ou a navegação.

## Focused region comparison

Não foi necessário gerar crops separados: na composição lado a lado em dimensão original, o mapa,
os ícones, a tipografia dos cards, os fatos do Sobral AI, o checklist e a agenda continuam legíveis.
O estado de foco foi verificado separadamente após o clique automatizado; o retângulo ao redor de
Vender na captura de interação é o foco acessível, não parte do estado de repouso.

## Required fidelity surfaces

- **Fonts and typography:** Outfit está ativa nos dois estados; pesos e line-height mantêm a
  hierarquia do source. O título foi reduzido no primeiro passe para não dominar o mapa. Não há
  truncamento ou wrap quebrado no desktop ou no mobile.
- **Spacing and layout rhythm:** margens, cinco colunas, posição da curva, marco atual e grade
  inferior foram conferidos em 1487 × 1058. Em 390 × 844, as etapas viram uma lista vertical, os
  cards empilham e nenhum controle fica cortado.
- **Colors and visual tokens:** navy, canvas frio, accent azul pontual, hairlines e sombras baixas
  usam somente tokens existentes. O gate de identidade passou.
- **Image quality and asset fidelity:** a imagem topográfica foi gerada para o slot, exportada em
  1536 × 420 e renderizada sem distorção. Não há SVG artesanal, emoji, placeholder ou div art.
- **Copy and content:** o texto explica a jornada do prestador de IA e muda de acordo com a etapa.
  Fixtures comerciais existem somente na bancada visual local; a tela autenticada usa dados reais
  ou informa a ausência.
- **Icons:** Lucide com stroke consistente; etapa ativa troca para check, como na referência.
- **Accessibility and interaction:** etapas são botões com `aria-pressed`, select tem label, links
  têm foco, reduced motion está coberto e os alvos móveis têm pelo menos 40–44 px. Clique em
  Prospectar alterou o marco e o contexto; retorno a Vender também funcionou.
- **Console:** zero erros e zero warnings no carregamento limpo em `127.0.0.1:3107`.

## Comparison history

### Passo 1 — bloqueado

- [P2] Título grande e baixo demais em relação à referência.
- [P2] Sidebar de preview sem ícones, perdendo a gramática do source.
- [P2] Ícone ativo mostrava documento em vez de confirmação.
- [P2] Checklist e cards inferiores estavam cerca de 20 px mais altos, empurrando o rodapé.

Correções: título reduzido, padding superior do mapa removido, ícones Lucide adicionados à sidebar,
check ativo implementado, densidade do checklist reduzida e agenda completada com o terceiro item.

### Passo 2 — bloqueado

- O navegador em `127.0.0.1:3000` tinha um service worker antigo registrado e serviu um chunk
  anterior, causando mismatch de hidratação na validação local.

Correção: preview reaberto na porta isolada `3107`; o estado limpo carregou sem erros e confirmou
que o problema não vinha do componente.

### Passo 3 — passed

- Comparação final em 1:1 sem P0, P1 ou P2.
- Interação entre etapas passou.
- Desktop e mobile passaram sem overflow ou colisões.
- O build de produção passou com as credenciais já configuradas da máquina.

## Findings

Não há findings P0, P1 ou P2 abertos.

## Follow-up polish

- [P3] Quando a linha do tempo factual existir, incluir no mapa as duas microanotações do source:
  último marco concluído e prazo do próximo marco.
- [P3] Substituir as fixtures do preview pelos estados controlados de Story/fixture quando houver
  infraestrutura própria de componentes.

## Implementation checklist

- [x] Source e implementação abertos e comparados lado a lado.
- [x] Mesma dimensão e mesmo estado.
- [x] Cinco superfícies obrigatórias conferidas.
- [x] Interação principal testada.
- [x] Desktop e mobile testados.
- [x] Console verificado.
- [x] Typecheck, lint, 137 testes, gates de identidade/DS/fronteira/schema e build aprovados.

final result: passed
