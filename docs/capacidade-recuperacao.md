# Capacidade e recuperação

O objetivo é manter perguntas, respostas, mensagens e créditos consistentes sob
concorrência e falhas. Não aumentar limites de provedores por estimativa.

## Proteções aplicadas

- Sobral AI: até duas gerações ativas por conta, inclusive em conversas diferentes.
  O limite fica em `operacoes_configuracao.sobral_geracoes_ativas_por_usuario`.
  Reconsultar uma pergunta não ocupa uma vaga extra. Uma recusa preserva a pergunta
  e retorna 429, orientação curta e `Retry-After`.
- E-mail de suporte: reserva um envio por vez, serializado entre workers. Mantém
  a chave de idempotência, o limite de 20 envios por ciclo e a janela de 23 horas.
  Cada chamada ao Resend tem prazo de 12 segundos. Uma lease abandonada volta a
  ficar elegível depois de cinco minutos; ultrapassada a janela segura, exige revisão.
- Entrada, envio e limpeza têm ciclos independentes: 55, 40 e 10 segundos. O
  cancelamento alcança o transporte HTTP, o banco e os downloads. Não usa corrida
  de promises que deixe trabalho continuar sem acompanhamento. Uma fila indisponível
  não impede as outras; o cron sinaliza 503 e preserva o motivo por fila.
- O cliente administrativo do Sobral AI tem prazo de dez segundos por consulta,
  inclusive pulso e confirmação final. Cancelamentos não reiniciam o prazo por
  retries automáticos do SDK.
- Enriquecimento: a proteção existente de duas execuções por conta e estorno
  transacional passou nos testes. Não foi reescrita sem necessidade.

## Testes reproduzíveis

```sh
node scripts/perf/capacidade.mjs --contratos
node scripts/perf/capacidade.mjs --baseline
node scripts/perf/capacidade.mjs
```

O primeiro comando roda também no CI. Os outros medem cenários sequenciais com
8 e 32 conexões, dez segundos de aquecimento e sessenta de coleta por cenário.
`--conexoes=8` repete somente o cenário menor.

O script cria um PostgreSQL 17 descartável, com duas CPUs, 1 GB, nenhuma porta
exposta e rede desabilitada. Carrega as funções diretamente das migrações indicadas
no script. O restante do esquema é uma fixture mínima, não uma cópia de produção.
Ao alterar essas funções em futuras migrações, atualize as referências do laboratório.

Nenhum e-mail é enviado, nenhuma IA é chamada e não há acesso a dados ou créditos
reais. O container e seu volume são removidos ao final. Relatórios JSON permanecem
na pasta temporária informada pelo comando.

### Contratos verificados em 09/09/2026

| Disputa simulada                            | Resultado após a correção                          |
| ------------------------------------------- | -------------------------------------------------- |
| 32 inícios de IA na mesma conta             | 2 aceitos; 30 recusados antes da geração           |
| 32 confirmações da mesma resposta           | 1 resposta e 1 registro de consumo                 |
| Retomada após expiração                     | Nova tentativa aceita; worker antigo recusado      |
| 32 pedidos de enriquecimento na mesma conta | 2 aceitos                                          |
| 32 recuperações dos enriquecimentos falhos  | 2 estornos; saldo inicial recuperado integralmente |
| Resultado atrasado após estorno             | Recusado; não altera o resultado terminal          |
| 16 workers de envio simultâneos             | 1 item reservado; nenhum ID duplicado              |
| Retomada de envio abandonado                | Mesmo ID; sem nova chave de idempotência           |
| Envio fora da janela segura                 | Expirado; sem reenvio automático                   |

Os testes de transporte usam os SDKs reais com HTTP simulado. Cobrem conexão
pendurada, cancelamento, 429 e confirmação perdida. Não comprovam entrega em
caixa postal; essa evidência pertence ao teste separado de ida e volta do suporte.

Evidência de interface: 22 testes de navegador passaram em desktop e celular
(suporte, anexos do Sobral e estados de enriquecimento). Lighthouse mobile em
`/ajuda`, no build local de produção: performance 94, acessibilidade 100, boas
práticas 100, LCP 3,0 s e CLS 0. Não há orçamento Lighthouse versionado no projeto;
esta medição não equivale a métricas de campo nem à experiência autenticada completa.

## Limites da conclusão

Medições de 09/09/2026, mesma carga SQL e ambiente, em execuções sequenciais:

| Versão / rodada    | Conexões | Transações em 60s | p50     | p95      | Falhas |
| ------------------ | -------- | ----------------- | ------- | -------- | ------ |
| Antes / 1          | 8        | 34.305            | 5,8 ms  | 65,8 ms  | 0      |
| Depois / 1         | 8        | 40.696            | 11,6 ms | 15,8 ms  | 0      |
| Antes / repetição  | 8        | 48.169            | 4,2 ms  | 61,1 ms  | 0      |
| Depois / repetição | 8        | 33.047            | 14,4 ms | 18,5 ms  | 0      |
| Antes / 1          | 32       | 19.043            | 95,9 ms | 204,6 ms | 0      |
| Depois / 1         | 32       | 29.644            | 59,4 ms | 90,9 ms  | 0      |

O p95 diminuiu nas rodadas observadas, mas a mediana e a vazão do cenário menor
não melhoraram de modo consistente. Os controles adicionais têm custo; **não há
base para anunciar uma aceleração geral**. A conclusão confirmada é a correção das
disputas e a recuperação sem duplicações nos contratos testados.

Os resultados brutos estão em [qa/capacidade-2026-09-09.json](qa/capacidade-2026-09-09.json).

As latências do laboratório são de uma transação SQL sintética mista, não do tempo
de resposta do chat nem de envio de e-mail. Não incluem RLS completo, PostgREST,
Vercel, rede, modelos ou quotas dos provedores. Também não representam o número
de usuários simultâneos que a plataforma suporta.

Os limites globais de modelos, o volume sustentado de entrada de e-mails e o tempo
real de espera precisam ser acompanhados em produção. A próxima evolução deve
integrar Sobral AI e suporte ao painel operacional existente, com alertas de fila
parada e falhas repetidas, antes de elevar limites.

## Publicação e reversão

Aplicar a migração antes do deploy da aplicação. A aplicação antiga aceita a
reserva unitária (temporariamente processa um envio por ciclo). A nova aplicação
não deve operar com a reserva antiga de vinte itens. Em reversão, voltar primeiro
a aplicação; manter a migração é seguro, embora a versão antiga envie mais devagar.
Não é necessário apagar dados nem remover a coluna de configuração para reverter.

A janela local de 23 horas mantém margem sobre as 24 horas documentadas para
[idempotência do Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).
Uma mensagem aceita pelo provedor só é considerada entregue após confirmação
do webhook; timeout não autoriza criar outra chave ou repetir fora dessa janela.
