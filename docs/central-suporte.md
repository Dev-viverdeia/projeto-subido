# Central de suporte

## Jornada

O usuário encontra **Ajuda** no menu e no perfil. Pode buscar um guia, consultar a IA ou pedir ajuda à equipe diretamente, sem gastar créditos e sem precisar passar pela IA antes.

- `/suporte`: central dentro da plataforma, disponível em todos os planos.
- `/suporte/novo`: pedido com assunto, descrição e até três anexos.
- `/suporte/atendimentos`: pedidos do próprio usuário, com busca e filtros.
- `/suporte/[id]`: conversa, anexos, resolução, reabertura e avaliação.
- `/ajuda`: central pública, acessível também pelas telas de entrada.
- `/ajuda/acesso`: ajuda sem login. O endereço precisa ser confirmado por e-mail antes de o pedido aparecer para a equipe.
- `/ajuda/atendimento/[id]`: conversa pública somente para quem tem o acesso pessoal válido. Link expirado pode ser renovado pelo mesmo e-mail.

O encaminhamento da IA prepara um rascunho: o usuário revisa e envia. Não cria pedidos nem faz alterações na conta silenciosamente.

## Equipe

O painel em `/suporte/equipe` permite buscar por título ou número, filtrar por estado e responsável, assumir um atendimento, responder, deixar notas internas e encerrar ou reabrir a conversa. As mensagens antigas são paginadas; não são descartadas.

Administradores podem cadastrar atendentes por e-mail e escolher quem recebe avisos. Ser atendente não torna a pessoa administradora do produto. Administradores também editam os guias em `/suporte/equipe/guias`: rascunhos não aparecem na central nem são usados pela IA.

Não há promessa automática de atendimento humano 24 horas ou prazo de resposta. Horários, responsáveis adicionais e prazos precisam refletir a equipe real.

## Conteúdo e IA

Doze guias iniciais cobrem acesso, créditos, Google Agenda, reuniões, prospecção, propostas, vendas, projetos, entregas, certificados, Sobral AI e problemas técnicos. A fonte em produção é `suporte_artigos`, não um conjunto paralelo de respostas escondidas no código.

A IA consulta somente guias publicados, usa saída estruturada e devolve referências válidas. Não acessa saldo, atendimentos, documentos particulares ou integrações do cliente. Falta de evidência resulta em encaminhamento, não em promessa de correção. Há limites por usuário/IP e global; indisponibilidade da IA mantém o pedido à equipe acessível.

As perguntas não são persistidas na tabela de consumo: registra-se apenas modelo, quantidade de tokens e horário, sem identificação pessoal. O histórico da conversa é mantido no estado da página, não como prontuário permanente. O rascunho de encaminhamento usa `sessionStorage` apenas até o envio/revisão.

## Privacidade e segurança

- RLS separa clientes, atendentes e administradores. Notas internas nunca são retornadas ao cliente.
- Criação e respostas passam por funções transacionais com validação de permissão, limites e idempotência.
- Links de acesso sem login usam token aleatório, hash no banco, validade de 14 dias e cookie HttpOnly. O token sai da URL após a confirmação. Cabeçalhos impedem cache e envio do endereço como referência.
- Somente o serviço pode ler o link secreto da fila de e-mails. A equipe vê o estado da notificação, não o token.
- PNG, JPEG, WebP e PDF têm assinatura, tamanho e acesso validados. Até três arquivos de 3 MB. Bucket privado; download autorizado com `nosniff`, `attachment` e `sandbox`.
- A origem de um pedido aceita apenas rotas internas conhecidas, sem parâmetros, fragmentos ou domínio externo.
- Arquivos sem vínculo por 24 horas e pedidos públicos não confirmados com link expirado são removidos em lotes. Exclusão de metadados gera uma fila durável de remoção dos objetos privados. Falha de storage não perde a tarefa de limpeza.
- Conversas confirmadas não têm exclusão automática por prazo. Solicitações de privacidade devem passar pela operação responsável; não há promessa de retenção infinita ou eliminação instantânea.

## Notificações

Usa as conexões já existentes: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, Supabase e OpenAI, sempre pelo módulo central de ambiente no código do produto.

O cron `/api/suporte/processar` executa a cada minuto, com autenticação. Reserva até 20 notificações, usa chave de idempotência por envio e espaça solicitações ao provedor. Repetições são limitadas a cinco tentativas e à janela de 23 horas. E-mails contêm somente número do atendimento e link; não incluem a descrição do problema ou notas internas.

`enviado` significa aceito pelo provedor. `entregue` depende do evento assinado de entrega em `/api/resend/webhook`. Devoluções são registradas e não se tornam entregas por causa de um evento antigo. Falhas ficam visíveis no painel; a conversa continua disponível mesmo sem e-mail.

## Verificação

```sh
npm run lint
npm run typecheck
npm run format:check
npm run check:identidade
npm run check:ds-drift
npm run check:fronteira
npm test
npm run build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 npx playwright test e2e/suporte.spec.ts
```

Testes integrados opt-in, com ambiente de servidor já carregado:

```sh
node scripts/smoke-suporte.mjs --confirmar-teste
node scripts/smoke-suporte-email.mjs --confirmar-teste
node scripts/smoke-suporte-email.mjs --confirmar-teste --exigir-webhook
node scripts/smoke-suporte-email.mjs --confirmar-teste --devolucao --exigir-webhook
```

`SUBIDO_APP_URL` escolhe localhost ou o domínio oficial. O teste principal cria contas e atendimentos de QA identificados, verifica isolamento, anexos, atribuição, notas internas, resolução, avaliação, reabertura, acesso sem login e IA real; remove somente os próprios dados ao terminar. Executá-lo antes de configurar notificações para a equipe ou em ambiente isolado: o cron de produção pode enviar os avisos que ele enfileira.

O teste de e-mail recusa executar se houver outra notificação pendente e envia apenas aos endereços oficiais de teste do Resend. A consulta do estado no provedor requer uma chave com leitura (`QA_RESEND_READ_KEY`); o produto pode continuar com uma chave restrita a envio. Eventos de teste comprovam a integração com o provedor, não garantem a entrega na caixa de entrada de todo destinatário.

Não armazenar senhas, tokens de acesso ou links de confirmação em relatórios, prints ou logs de aplicação.
