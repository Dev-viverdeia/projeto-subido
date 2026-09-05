# Reuniões — reagendamento, cancelamento e recuperação

## Entrega

- Alterar data e duração na agenda ou a partir da preparação da reunião.
- Cancelamento com confirmação explícita. Sem excluir o histórico.
- Mesmo registro, sala pública e evento do Google no reagendamento.
- Convite pendente visível também após recarregar, inclusive em reunião cancelada.
- Reconexão recupera o formulário na mesma aba. Rascunho por conta, com validade de duas horas, descartado ao fechar ou concluir.
- Horário local convertido usando o fuso da data selecionada; datas impossíveis são rejeitadas.

## Consistência

`agenda-servico.ts` é o único caminho para criar/atualizar/remover eventos Google de uma reunião. A alteração local é reservada por comparação de `atualizada_em`, preenchido pelo trigger existente. Uma reserva dura dois minutos; cada requisição ao Google tem limite de 15 segundos.

Falhar no Google não apaga a alteração nem a referência ao evento. A próxima tentativa usa o mesmo identificador. Cancelamento pendente sempre tenta remover, nunca recriar.

O transporte confirma o vínculo privado do evento com a reunião. PATCH altera somente o horário, preserva convidados e usa ETag. Notificações usam `sendUpdates=all`. Eventos removidos não são recriados; referências legadas sem agenda confirmável exigem recuperação explícita.

O histórico registra o reagendamento no banco, na mesma transação. A data da próxima ação só acompanha o novo horário quando ainda corresponde à ação automática daquela reunião. Uma ação manual é preservada.

## Validação

- Unitários: autorização, fuso, data inválida, concorrência, falhas do Google/banco, repetição segura, agenda legada e rascunhos.
- Componentes: portal global, confirmação, feedback parcial, reconexão e preservação do Live Coach.
- Navegadores: desktop/Chromium e mobile/WebKit, campos de 16px, footer acessível e ausência de overflow horizontal.
- SQL: `supabase/tests/reagendamento_historico.sql`, transacional com rollback; não altera reuniões existentes.

## Limites

- A sincronização é das reuniões da Subido para o Google. Não importa a agenda inteira nem acompanha automaticamente mudanças feitas diretamente no Google.
- Pendências de convite têm recuperação manual explícita; este bloco não adiciona uma nova fila em background.
- A verificação pública do aplicativo OAuth depende da decisão do Google, não de um deploy.
