# Sobral AI: orientação contextual

## Mudanças verificadas em 10/09/2026

- O pedido atual tem prioridade sobre a venda selecionada automaticamente na conta.
- Perguntas gerais, aprendizado e outro cliente não recebem uma tarefa vinculada à venda em foco.
- Criar proposta abre o formulário, com o cliente quando identificado, sem exigir reunião.
- Prospecção e Entregas são destinos permitidos. Curso genérico não preenche recomendações de gestão.
- Uma ação basta; o plano começa pelo mesmo passo mostrado na conversa.
- Cadastros entram como dados, separados das instruções de sistema. IDs vêm do snapshot autenticado.
- Respostas curtas por padrão, aprofundamento quando solicitado. O profissional executa o serviço.

## Avaliação com IA real

Dez cenários sintéticos: aprendizado com venda pendente, proposta pelo WhatsApp, primeira
abordagem sem presumir dor, descoberta personalizada, entrega pontual, recorrência, responsabilidade
pela execução, aula inexistente, preço sem premissas e instrução maliciosa no cadastro.

A primeira execução identificou divergência entre o próximo passo e a primeira ação do plano.
A revisão de conteúdo encontrou uma recomendação de curso sem relação suficiente com a recorrência.
O primeiro problema foi corrigido por alinhamento determinístico; o segundo, pelas regras de orientação.

Segunda execução: **10/10 verificações aprovadas**, modelo configurado `gpt-5.6-terra`,
26.363 tokens totais na rodada. As dez respostas também foram lidas: sem cliente trocado,
diagnóstico de dor inventado, bloqueio de proposta por falta de reunião ou promessa de entrega automática.
Isso é evidência desta amostra, não garantia de acerto em toda pergunta futura.

## Repetir

O teste não acessa banco, não envia e-mail e não desconta créditos de usuários. Há custo de API:
dez chamadas sequenciais, limite de 3.200 tokens de saída por chamada. Fica desabilitado na suíte comum.
Use um arquivo local ignorado pelo Git com as variáveis do servidor e autorização para consumir API:

```sh
SUBIDO_AVALIAR_SOBRAL=1 node --env-file=.env.qa.local node_modules/vitest/vitest.mjs run src/lib/consultor/modelo-qualidade.test.ts --maxWorkers=1
```

O resultado fica em `tmp/sobral-qualidade/resultado.json` (ignorado pelo Git). Leia as respostas,
não apenas o placar: pertinência, premissas, utilidade do próximo passo e clareza exigem revisão.
Não substitua os dados sintéticos por informações de clientes.

## Regressão automática

Testes unitários cobrem associação ao cliente, destinos sem vínculo, botão de proposta, compatibilidade
com mensagens antigas, separação de cadastros/instruções e preservação da etapa factual.
Nesta revisão: 1.362 testes aprovados, 12 pulados preexistentes e 10 avaliações reais opt-in puladas
na suíte padrão. Os 92 testes Playwright do Sobral passaram em desktop e mobile WebKit.
