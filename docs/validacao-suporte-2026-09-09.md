# Suporte — validação de produção

9 de setembro de 2026 · domínio: https://subido.viverdeia.ai

## Produto entregue

- Um pedido, uma conversa: abertura, resposta, nota interna, resolução, avaliação e reabertura.
- Formulário de dois campos essenciais, anexos privados e rascunhos recuperáveis; resposta e nota interna têm rascunhos separados.
- Fila orientada à espera, responsável, prioridade, próxima ação explícita e indicadores com amostra.
- Administração de agentes independente do papel de admin; horários, avisos e meta interna configuráveis, sem promessas inventadas.
- Entrada e resposta por e-mail, confirmação de novos remetentes, DKIM real, fila durável e revisão de exceções.
- Treze guias publicados, incluindo um passo a passo ilustrado. IA gratuita para ajuda e sugestão revisável para a equipe.

## Evidência observada

Release principal: PR #192, commit `c24bba3513d19a220640ff18efce317fdcac5db7`, deployment `dpl_CVxgayfFJD9qTwdCrkcWyTPzLxJB`. HTML do domínio público conferido com o mesmo deployment; só então o webhook de entrada foi habilitado.

Foram usados somente dois e-mails controlados pelo proprietário, um Google Workspace e um Microsoft Outlook/Hotmail, com assuntos `QA-SUPORTE-20260909-*`. Nenhum cliente externo foi contatado.

| Percurso                                               | Resultado                                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| E-mail novo → fila durável → confirmação               | Dois pedidos criados sem liberar leitura antes da confirmação                 |
| Confirmação recebida nas caixas                        | Google e Microsoft; eventos de entrega conciliados                            |
| Agente de suporte sem admin → responder pela interface | Duas respostas públicas e duas notas privadas                                 |
| Nota interna → cliente/e-mail                          | Ausente da conversa pública e do e-mail; nenhuma notificação criada pela nota |
| Resposta pelo Gmail e pelo Outlook                     | Mesma conversa, uma mensagem por réplica e uma única reabertura               |
| Nova resposta da equipe após a réplica                 | Recebida nas duas caixas; Gmail conservou o mesmo thread                      |
| Entrega                                                | Seis notificações com `entregue`, uma tentativa por envio                     |
| Anexo de e-mail                                        | PNG validado, download com acesso autorizado e 404 sem acesso                 |
| Repetição de webhook                                   | Quatro replays assinados, sem nova mensagem nem novo processamento            |
| Sugestão com IA                                        | Gerada de verdade, revisável e sem reproduzir nota interna                    |

Entradas incorporadas em aproximadamente 4, 28, 52 e 63 segundos a partir da persistência do evento. O cron e os limites são explícitos; não há garantia pública de resposta instantânea. Aceitação pelo Resend, confirmação de entrega e presença na caixa foram verificações separadas.

## Qualidade técnica e visual

- 1.162 testes unitários aprovados no bloco principal, mais um teste de regressão do acesso público no acabamento.
- 456 cenários Playwright aprovados; 12 pulados conforme a configuração existente. Os 14 cenários da central passaram em desktop/mobile.
- Teste transacional no banco real, com rollback: isolamento entre clientes, agente sem admin, notas privadas, estados, idempotência, cursor de leitura e permissões. Verificação adicional da categoria de e-mails também revertida.
- Build de produção, lint, tipos, formatação, fronteira client/server, integridade do DS e identidade aprovados. Auditoria de dependências de produção sem vulnerabilidades conhecidas na execução.
- Lighthouse mobile no domínio público `/ajuda`: performance 95, acessibilidade 100, boas práticas 100; LCP 2,8 s, CLS 0. Medição de laboratório, não certificação de WCAG nem indicador de campo.
- Desktop/mobile e larguras 375/768/1280/1920 verificadas. As imagens do novo guia são capturas dos componentes reais com dados demonstrativos.
- Seletores antigos de testes de propostas, kanban e portal foram atualizados para os nomes/layout já existentes; esses módulos não foram redesenhados neste bloco.

O acabamento decorrente do teste real mantém o autor e o canal na conversa pública, evita classificar todo e-mail como problema de acesso e retira “Assumir” quando já existe responsável.

## Operação e limites

Recebimento em `ajuda@subido.viverdeia.ai`, sem alterar MX corporativo. Respostas usam endereço opaco de 63 caracteres, que não concede leitura. Eventos suspeitos não são incorporados à força. O original depende da retenção do provedor.

A infraestrutura começa com dois recebidos por execução/minuto e até vinte notificações de saída. Não houve teste de carga em escala de lançamento. A fila administrativa expõe atraso e falhas; evoluir a capacidade conforme demanda real.

Horário, escala humana e meta de atendimento devem refletir a equipe. Os controles estão prontos, mas não foram inventados turnos ou compromissos de resposta. Suporte não consome créditos e não depende de pagamentos.

O script `scripts/qa-suporte-caixas-reais.mjs` exige confirmação explícita, restringe as caixas de destino e remove somente seus próprios atendimentos/anexos/agente. Não registra senhas ou links pessoais. Registros mínimos de eventos processados podem permanecer para impedir reprocessamento de webhooks atrasados.

Encerramento: os dois atendimentos, o anexo privado e o agente temporário foram removidos. Ficaram somente quatro identificadores de eventos ignorados, sem conteúdo, remetente ou vínculo com pessoa. A fila de notificações terminou sem pendências. O acabamento da PR #193 foi confirmado no domínio público (`3d40ba7611829a1f7a6b075b9f8892829de34b63`), incluindo autor, origem da mensagem e responsável.
