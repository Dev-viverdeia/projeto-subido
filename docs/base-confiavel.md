# Base confiável

## Publicação

A branch `main` exige pull request e o check `validate`, inclusive para administradores. Force push e exclusão estão bloqueados. Na Vercel, o Deployment Check “Validação completa do Subido” exige o mesmo check do GitHub antes de atribuir o build aos domínios públicos. Não é necessário guardar um token de deploy no GitHub.

`validate` cobre tipos, lint, formatação, integridade do design system, testes unitários, concorrência PostgreSQL, limites de leitura HTTP, jornadas Playwright desktop/mobile e build de produção. `scripts/check-production.mjs` testa entrada, autenticação e previews fechados, e aplica o orçamento Lighthouse da página `/entrar`. O relatório fica nos artifacts do workflow.

Esse orçamento de entrada não substitui medições de tráfego real, capacidade de provedores ou testes das páginas autenticadas.

O Lighthouse usa três execuções fixas, cada uma com navegador novo, e a mediana por categoria: desempenho ≥85, acessibilidade ≥90 e boas práticas ≥95. Nenhuma amostra pode ter erro de navegação ou CLS acima de 0,1. Os três relatórios e o resumo são preservados, inclusive quando o orçamento reprova. Não há repetição até obter aprovação. A amostragem reduz oscilações de CPU do runner: na primeira publicação deste controle, o mesmo código marcou 98 no PR e 81 no merge; a trava manteve o domínio na versão anterior.

## Arquivos e convidados

- Downloads de entregáveis aceitam somente a chave canônica `dono/projeto/arquivo`. O banco também confere a existência e a propriedade do objeto enviado. Registros antigos passam novamente pela validação antes de qualquer assinatura.
- A sessão do convidado é assinada, vinculada à reunião e expira em duas horas. UUIDs antigos sem assinatura recebem uma identidade nova. O login e a autorização do anfitrião permanecem separados.

## Limite interno do Sobral AI

Antes de gerar, cada tentativa reserva uso de forma atômica. Texto usa uma estimativa conservadora em bytes; arquivos usam a contagem de entrada do provedor. Áudio novo reserva 128.000 unidades de proteção antes da transcrição. São controles internos de consumo, não uma cobrança de créditos na carteira do cliente.

Quando o provedor confirma o uso, a reserva é reconciliada uma única vez no mês de origem. Cancelamento ou queda sem recibo conserva a reserva; uma tentativa nova precisa de uma reserva nova. Uma transcrição já salva é reaproveitada, sem novo processamento.

Reservas não liquidadas devem ser conciliadas apenas com evidência do provedor; não liberar automaticamente por tempo. O limite técnico de transcrição não deve ser apresentado como preço ou número exato de tokens do áudio. A contagem efetiva pode diferir da reserva, e a conciliação registra o uso confirmado.

## Worker do Estúdio

A Edge usa `BUILDER_WORKER_KEY`, distinta de service role. Somente seu hash está no schema privado. A admissão é atômica, permite até dois trabalhos ativos por usuário e atribui uma tentativa à geração. Finalizações antigas não alteram um trabalho novo. A reserva não desaparece quando o projeto é excluído.

Ordem de implantação:

1. Aplicar as migrations de caminhos, orçamento e criação dos RPCs do Builder.
2. Provisionar a chave na Edge e seu hash no banco privado.
3. Publicar a Edge `builder` com os RPCs.
4. Aplicar `builder_worker_exclusivo`, retirando a edição direta de status e resultados.
5. Publicar a aplicação validada. Ao corrigir a Edge no futuro, preservar o contrato de claim/finalização; uma versão antiga que escreve diretamente na tabela não é rollback compatível.

## Escopo da verificação

As disputas foram testadas em PostgreSQL descartável, sem contas de clientes, convites, e-mails ou geração paga. O parser HTTP foi testado com streams simulados, limite de bytes, conexão travada, redirects, UTF-8 e HTML malformado.

Não equivale a certificação de segurança completa. DNS rebinding e normalização de IPv6 continuam como investigação separada; não foram declarados corrigidos neste bloco. A aprovação OAuth pelo Google também é independente desta entrega.
