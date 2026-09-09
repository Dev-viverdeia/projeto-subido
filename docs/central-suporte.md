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

O painel em `/suporte/equipe` prioriza pedidos que esperam a equipe, por prioridade explícita e tempo de espera. Permite buscar por título ou número, filtrar por estado e responsável, assumir um atendimento, responder, deixar notas internas e encerrar ou reabrir a conversa. Assumir não sobrescreve outro responsável. As mensagens antigas são paginadas; não são descartadas.

Responder e escolher o próximo estado é uma operação atômica. Uma atualização de investigação não vira automaticamente “Aguardando você”. Notas internas não mudam o estado nem notificam o cliente. Rascunhos públicos e internos ficam separados por conta e atendimento na sessão do navegador, são recuperados após recarregar e removidos após envio/logout. A atualização da conversa não interrompe a escrita. A leitura registra exatamente a última mensagem pública exibida, sem apagar uma resposta que chegou depois.

Administradores podem cadastrar atendentes por e-mail e escolher quem recebe avisos. Ser atendente não torna a pessoa administradora do produto. Administradores também editam os guias em `/suporte/equipe/guias`: rascunhos não aparecem na central nem são usados pela IA.

Não há promessa automática de atendimento humano 24 horas ou prazo de resposta. O admin configura horário, aviso temporário e meta interna (não exibida como promessa). O painel mostra espera, falhas de e-mail e métricas de 30 dias, com tamanho da amostra. Horários, responsáveis adicionais e prazos precisam refletir a equipe real.

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

O cron `/api/suporte/processar` executa a cada minuto, com autenticação. Reserva até 20 notificações, usa chave de idempotência por envio e espaça solicitações ao provedor. Repetições são limitadas a cinco tentativas e à janela de 23 horas. A resposta pública da equipe inclui somente a nova mensagem, protocolo e link. Nunca inclui notas internas, histórico completo ou anexos privados. Os outros avisos incluem protocolo e link.

`enviado` significa aceito pelo provedor. `entregue` depende do evento assinado de entrega em `/api/resend/webhook`. Devoluções são registradas e não se tornam entregas por causa de um evento antigo. Falhas ficam visíveis no painel; a conversa continua disponível mesmo sem e-mail.

## Responder pelo e-mail

`ajuda@subido.viverdeia.ai` recebe pedidos novos. O MX foi habilitado somente no subdomínio da aplicação; os MX corporativos de `viverdeia.ai` permanecem intactos. Novos pedidos exigem confirmação por link antes de aparecer na fila. Respostas usam um endereço opaco por atendimento (HMAC de 112 bits, local-part de 63 caracteres), válido somente para o remetente já confirmado. O endereço não concede leitura.

Configuração de servidor: `SUPORTE_EMAIL_ATIVO`, `SUPORTE_EMAIL_DOMINIO`, `SUPORTE_EMAIL_CHAVE`, `SUPORTE_EMAIL_API_KEY` (leitura dos recebidos) e `SUPORTE_EMAIL_WEBHOOK_SECRET`. Segredos ficam nas variáveis criptografadas de produção. O envio conserva a chave restrita já existente.

`/api/suporte/email` verifica a assinatura Resend/Svix, limita o corpo a 64 KB e confirma recebimento somente depois de persistir o evento. O cron reserva até dois recebidos por execução, com lease e deduplicação. A mensagem original precisa ter DKIM válido, domínio alinhado e corpo integral assinado; cabeçalhos `Authentication-Results` declarados pelo remetente não são confiáveis. Destinatários e remetentes são validados; CC não cria participantes. Respostas automáticas são ignoradas.

Uma transação incorpora texto, anexos e estado. Repetir o evento não duplica conteúdo nem reabre duas vezes. Até três imagens/PDFs de 3 MB são aceitos, após validação dos bytes. Uploads incertos entram na limpeza durável após 24 horas; anexos confirmados saem dessa fila atomicamente. HTML não é renderizado. Texto excessivamente longo, HTML sem texto, remetente diferente ou autenticação inconclusiva ficam em revisão; não há botão que burle autenticação. O original pode ser baixado pela equipe como EML com acesso privado. Sua disponibilidade depende da retenção do provedor: a aplicação não promete arquivo permanente de e-mails rejeitados.

Limites iniciais: 8 novos pedidos por remetente/hora, 100 novos globais/hora, 60 respostas por remetente/hora. Capacidade inicial de recebimento: até dois itens/minuto por execução de cron. A fila mostra acúmulo e falhas; revisar capacidade a partir do tráfego real, não anunciar escala ilimitada.

Desligamento seguro: definir `SUPORTE_EMAIL_ATIVO=false` e publicar; desabilitar o webhook de entrada, sem apagar eventos pendentes nem mexer no envio. O cliente continua pelo link da plataforma. Para restaurar, reativar configuração e webhook e acompanhar a fila. Não apagar nem substituir a chave HMAC: isso invalidaria endereços já enviados.

## IA para a equipe

O atendente pode pedir uma sugestão de resposta baseada no histórico público e em guias publicados. Notas internas não são enviadas ao modelo. A sugestão mostra referências, não substitui rascunho existente e só é enviada após revisão humana. Categorias recorrentes ajudam a priorizar guias; não publicam conteúdo de clientes automaticamente.

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
