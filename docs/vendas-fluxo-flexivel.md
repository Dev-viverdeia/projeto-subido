# Vendas: fluxo flexível

## Comportamento

- O quadro tem quatro colunas: Preparar, Descobrir, Propor e Ganho.
- Ganho confirma a venda. Não conclui nem cria uma entrega automaticamente. O card abre a entrega existente ou a ficha para preparar o trabalho.
- O menu de cada card e da ficha permite criar proposta, mover, arquivar, desclassificar e registrar perda.
- Arquivar ou desclassificar retira a oportunidade do quadro, dos seletores e das recomendações de próximas ações. O histórico permanece em **Fora do fluxo**.
- Restaurar devolve o registro à etapa que tinha. Uma venda perdida continua perdida até ser movida para uma etapa aberta.
- Reuniões, propostas e entregas existentes não são canceladas por uma retirada.
- Uma proposta pode ser criada sem reunião, a partir de uma oportunidade ativa. Reuniões são contexto opcional; quando informadas, o vínculo e a permissão continuam validados.

## Resultados e consistência

`situacao` é independente de `etapa`: arquivar não registra perda nem apaga um ganho. As métricas de carteira aberta excluem retiradas; os resultados históricos são preservados.

O registro guarda motivo e data da retirada, com evento de auditoria. A operação usa bloqueio de linha, estado anterior e confirmação idempotente. Uma aba desatualizada não pode mover uma oportunidade retirada.

Uma oportunidade ganha não pode ser desclassificada. Se o cliente aceitar depois uma proposta de um lead desclassificado, o aceite continua válido e restaura a oportunidade como ganha, com auditoria. Arquivar uma oportunidade não cancela suas propostas implicitamente.

## Banco e validação

Migrações: `20260907193739_crm_retirada_do_fluxo.sql` e `20260907195141_crm_retirada_concorrencia.sql`.

O teste transacional `supabase/tests/crm_retirada_fluxo.sql` valida isolamento entre contas, plano atual, anônimo, idempotência, conflitos, restauração, aceite posterior e preservação de resultados. Termina com rollback integral.

Os testes de interface cobrem as quatro etapas no desktop e celular, movimentação e motivo de perda. A validação autenticada também cobre arquivar, restaurar, desclassificar, criar rascunho sem reunião e persistir ganho. Não é necessário enviar convites ou propostas para validar esses fluxos.
