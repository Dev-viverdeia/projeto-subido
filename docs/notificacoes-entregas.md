# Notificações de entregas

O portal guarda a decisão do cliente. O e-mail é um aviso: uma falha de envio não apaga a entrega, o ajuste ou o aceite.

## Experiência

- O convite abre a etapa que precisa de revisão no portal público.
- Aprovação e pedido de ajuste avisam o profissional e abrem a tarefa correspondente na sala de entrega, após autenticação.
- “E-mail enviado” significa aceitação pelo provedor. “Entrega confirmada” significa recebimento pelo servidor do destinatário, não leitura.
- O status pode ser atualizado na própria entrega. Não há uma nova área para o usuário administrar.
- Falhas preservam o endereço digitado. Recusa do endereço permite correção; reclamação de spam ou supressão bloqueiam o reenvio.

## Proteções

A reserva é feita no banco antes da chamada ao provedor, sob bloqueio da linha. Apenas o backend tem permissão de executar as funções de reserva e confirmação.

- Tentativas simultâneas compartilham a reserva; apenas uma inicia o envio.
- Timeout ou resposta incerta reutilizam a mesma chave e o mesmo conteúdo dentro de 23 horas, com margem sobre a janela do provedor.
- Depois dessa janela, ou se o conteúdo de um envio incerto mudou, o reenvio fica bloqueado. Compartilhe o link e confira o evento no provedor.
- Rejeição explícita permite nova tentativa. A identificação de cada tentativa impede que uma resposta antiga sobrescreva a nova, mesmo com conteúdo igual.
- O webhook verifica a assinatura sobre o corpo bruto e pode confirmar a entrega antes da resposta da API. Eventos atrasados não regridem o status.
- Convites respondidos, substituídos ou de portais pausados não podem ser reenviados.
- O lembrete existente continua limitado a um por solicitação, após 48 horas sem resposta. O worker não deve ser disparado manualmente contra clientes para testar.

São armazenados o identificador do provedor, destinatário, assunto, status, datas e impressão digital do conteúdo. Não há cópia adicional do corpo do e-mail nem de credenciais.

## Diagnóstico

1. Confira `email_status`, `email_provider_id`, `email_erro` e as datas do evento em `projeto_portal_eventos`.
2. Consulte esse ID na conta Resend usada pela produção. Uma chave de outra conta pode responder 404 mesmo quando o e-mail existe.
3. Confira se o webhook de `/api/resend/webhook` está ativo e com a assinatura correta. Falhas de persistência retornam 500 para o provedor tentar novamente.
4. Para comprovar chegada à caixa de entrada, verifique a mensagem no destinatário controlado. O status do provedor, sozinho, não comprova leitura nem localização na caixa.

Não limpe identificadores, impressões digitais ou datas para forçar reenvio. Não troque a chave de idempotência em uma tentativa incerta.

## QA controlado

Com as variáveis de ambiente já carregadas, execute:

```sh
SUBIDO_APP_URL=http://127.0.0.1:3115 SUBIDO_QA_EMAIL=delivered@resend.dev node scripts/smoke-reuniao-entrega.mjs --confirmar-teste --validar-notificacoes
```

O teste cria uma conta descartável, percorre a interface e envia quatro avisos: convite, ajuste, novo convite e aprovação. Usa o simulador do Resend por padrão neste exemplo. O script aceita apenas esse simulador ou a caixa do proprietário autorizada para QA; não use clientes reais.

Além das capturas desktop/mobile e da acessibilidade do portal, verifica reserva concorrente, acesso negado ao usuário comum, prazo de recuperação, resposta fora de ordem, isolamento entre tentativas e bloqueio do convite respondido. A conta e seus dados são removidos no `finally`.

Na execução contra `https://subido.viverdeia.ai`, o teste também aguarda a confirmação real do webhook. A chegada dos quatro e-mails à caixa do proprietário é uma verificação separada. Os links de QA deixam de funcionar após a limpeza dos dados descartáveis.
