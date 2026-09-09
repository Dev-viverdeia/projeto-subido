# Saúde da IA e do suporte

Em **Administração → Operações**, `/admin/operacoes`, o painel mostra a atividade
do Sobral AI, recebimentos e respostas por e-mail. Use **Atualizar painel** para
consultar novamente. Não há polling nem envio de alertas por e-mail neste bloco.

## Leitura dos sinais

- **Sem alertas:** não há ocorrências nas contagens consultadas. Não equivale a um
  teste sintético de disponibilidade de todos os provedores.
- **Acompanhar:** falha recente, mensagem para revisão ou cinco minutos sem
  confirmação de uma rotina.
- **Ação necessária:** fila com item aguardando há mais de cinco minutos, geração
  de IA expirada, três falhas de IA nas últimas 24h, três falhas atuais de uma fila,
  três ciclos seguidos com falha ou dez minutos sem confirmação.
- **Sem confirmação:** consulta indisponível, dado inválido ou rotina sem recibo.
  Ausência de dados nunca aparece como zero ou como rotina saudável.

Os três recibos confirmam a execução de recebimento, envio e limpeza, não entrega
na caixa postal. A fila de entrada continua respeitando a configuração de ativação
do suporte; o recibo não substitui a validação de domínio, webhook ou credenciais.

## Contagens e recuperação

O painel usa contagens agregadas, sem conteúdo de conversas ou mensagens. Filas
pendentes incluem itens antigos. Resultados de 24h são uma coorte pela criação do
pedido (início da tentativa no Sobral AI), não pelo horário de entrega ou conclusão.
No Sobral AI, cada pergunta conta pela última tentativa. Paradas pedidas pelo
usuário não são falhas. A geração só entra no alerta de expiração quando seu prazo
persistido termina, não por um cronômetro visual.

Abra o diagnóstico para ver a causa e a orientação. Em suporte, confira o
atendimento antes de reenviar. **Aceito pelo provedor não significa entregue**:
a entrega depende do recibo do webhook. Envios expirados exigem revisão; o painel
não cria chaves novas, não reenvia mensagens e não reinicia trabalho.

As verificações executam no cron existente a cada minuto. A observação é limitada
a três segundos por fase; falhar ao registrar o recibo não repete trabalho nem
impede a próxima fila. Uma confirmação antiga ou repetida não sobrescreve um
ciclo mais novo. Cada fase ocupa uma única linha, sem histórico crescente.

## Segurança e publicação

A função de leitura verifica a permissão de administração **antes** de abrir o
cliente privilegiado, mesmo com layouts paralelos. RPCs e tabela de recibos só
admitem `service_role`; usuários comuns não consultam contagens globais.

Aplicar `20260909172709_saude_ia_suporte.sql` antes da aplicação. Ao publicar,
aguardar ciclos reais do cron e conferir os três recibos e seus horários. Não
preencher recibos manualmente para simular saúde. Na reversão, a aplicação anterior
continua compatível; mantenha tabela, funções e índices. Não é preciso apagar dados.

## Validação reproduzível

- `npm test`: autorização, estados sem dados, falhas, ordem dos recibos e isolamento.
- `node scripts/perf/capacidade.mjs --contratos`: PostgreSQL descartável, permissões,
  idempotência, ciclos fora de ordem e contagens de filas antigas. Sem clientes reais.
- `npx playwright test e2e/operacoes-saude.spec.ts`: leitura, teclado, contraste,
  estados de falha, 375–1920 px e fonte ampliada. A fixture só abre em desenvolvimento.

Esses testes não enviam e-mails, não chamam modelos e não gastam créditos de usuários.
