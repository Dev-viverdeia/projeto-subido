# Suporte: clareza e acabamento visual

## Mudanças

- Central com busca e acesso à IA antes dos guias, inclusive no celular. Um seletor de área substitui a parede de filtros. Recuperação explícita de buscas sem resultado.
- Guias com ícones por área, superfícies do design system, títulos legíveis e FAQ agrupado. Avisos de novas respostas continuam prioritários.
- Formulário de pedido centralizado, área do produto identificada corretamente, envio com estado explícito e anexos com alvos de toque de 44 px.
- Conversa do cliente em uma coluna, autoria e horário separados, botão Responder com foco direto no campo. Resolução e avaliação vêm depois da conversa, não antes das mensagens no celular.
- Notas internas identificadas por cadeado e limite tracejado. Configurações da equipe ficam depois da fila; indicadores de estado abrem o filtro correspondente.
- IA exibe imediatamente a pergunta e a consulta em andamento. Falhas preservam o rascunho. Encaminhamento à equipe continua sujeito à revisão do usuário.

## Limites preservados

Nenhuma alteração de migrations, cobrança, autorização, isolamento por usuário, RPC de envio, webhooks ou processamento de e-mail. Sem dependências novas nem alterações no design system vendorizado. Esta rodada não repete o teste de entrega real de e-mails da validação anterior.

## Validação

- 22 testes Playwright aprovados em desktop e mobile: busca/filtro, teclado, foco, estados vazios, carregamento/falha da IA, resolução, rascunhos separados e fluxo público.
- 1.196 testes unitários aprovados; 12 já ignorados pela suíte.
- Typecheck, lint, formatação, identidade, fronteira client/server, integridade do DS, lockfile e build aprovados. Landing continua estática. Quatro avisos AVIF já existentes no build.
- Inspeção autenticada em 7 telas, 1440 px e 390 px: central, pedido, IA, conversa, fila, equipe e resolvido. Sem overflow horizontal, erros de hidratação ou violações axe WCAG A/AA detectadas. Não equivale a uma certificação completa de acessibilidade.
- Script `qa-suporte-visual.mjs`: contas e atendimento próprios, verificação de nota privada invisível para o cliente, zero notificações geradas e limpeza ao terminar. Somente aplicação local; não chama RPCs de envio.
- Lighthouse mobile, build de produção local em `/ajuda`: performance 90, acessibilidade 100, boas práticas 100, CLS 0. Medição de laboratório; não representa dados de campo.

## Próximo avanço sugerido

Guias visuais das dúvidas recorrentes: passos curtos com capturas atuais de agenda, propostas e entregas, e acesso à orientação certa a partir da tela onde a dúvida surgiu. Priorizar dúvidas observadas nos atendimentos, sem ampliar a complexidade da central.
