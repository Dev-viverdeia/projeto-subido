# Projeto → venda → entrega no celular

9 de setembro de 2026.

## Mudanças

- “Usar com cliente” abre o contexto comercial do projeto em um clique, com foco acessível e preservação da aba consultada.
- O seletor de cliente, as ações e as etapas do kanban têm tipografia legível e alvos de toque de pelo menos 44 px (48 px no kanban).
- Entregas remove a identificação duplicada, reduz o peso dos títulos e antecipa “Continuar entrega”. No celular, a próxima tarefa não fica truncada.
- Superfícies, contraste, foco e acabamento reutilizam os tokens do design system. Nenhuma dependência, migração ou regra comercial foi adicionada.

## Validação

Teste autenticado com uma conta descartável de papel `membro`, plano Pro: projeto → nova oportunidade → proposta em rascunho sem reunião → entrega → retomada pelo projeto. Os vínculos de cliente e projeto foram preservados; a retomada abriu a entrega já existente. A área administrativa continuou indisponível para a conta comum.

A transição de proposta aceita foi uma fixture explícita, somente nos registros sintéticos do teste. Não houve envio de proposta, convite, e-mail nem consumo de IA. Usuário e registros foram removidos ao terminar. Isso não substitui uma validação de aceite por um cliente externo.

O script opt-in `scripts/qa-jornada-cliente.mjs --confirmar-teste` exige credenciais por ambiente, valida a jornada com a interface real e captura oito estados. Também verifica que a ação da entrega não é encoberta pela navegação do celular, ausência de erros JavaScript, overflow horizontal e violações automáticas axe WCAG A/AA.

Os testes de interface em `e2e/jornada-cliente-mobile.spec.ts` cobrem 320, 390, 768 e 1440 px, teclado, redução de movimento, acesso ao cliente e a navegação entre fases de vendas. A revisão visual foi feita em Chromium com emulação mobile; não equivale a testes em aparelhos físicos ou a certificação de acessibilidade.

Baseline Lighthouse local no build de produção, rota pública `/ajuda`: performance 94, acessibilidade 100, boas práticas 100, CLS 0. É uma referência do shell público, não uma medição de desempenho das rotas autenticadas alteradas.

## Próximo recorte

Revisar a preparação da entrega no celular: mostrar claramente o que já veio da proposta e o que ainda falta combinar, sem truncar informações essenciais ou esconder o próximo passo entre painéis. Preservar a revisão humana de prazo, responsáveis e escopo.
