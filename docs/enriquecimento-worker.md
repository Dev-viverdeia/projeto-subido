# Enriquecimento: publicação e recuperação

As leituras continuam usando a sessão do usuário e RLS. Início, etapas e resultado exigem também uma credencial exclusiva do worker. O browser não recebe essa credencial. Não há service role na Edge.

## Primeira ativação

Preparar os arquivos da Edge e confirmar que não há enriquecimentos ativos antes do corte. A migration fecha a escrita antiga imediatamente; até concluir os passos seguintes, novas solicitações falham de forma segura, sem iniciar uma análise.

1. Aplicar `20260906013000_enriquecimento_worker_seguro.sql` pelo processo de migrations.
2. Com `SUPABASE_PROJECT_REF` e `SUPABASE_ACCESS_TOKEN` no ambiente, executar `node scripts/configurar-worker-enriquecimento.mjs --confirmar-configuracao`. O script cria 256 bits aleatórios, configura o segredo na Edge por stdin e guarda somente SHA-256 em `private`. Não inserir a chave no terminal nem no histórico.
3. Publicar a Edge `enriquecimento` com suas dependências. Preservar a configuração de autenticação existente e a verificação `auth.getUser()` dentro da função.
4. Regenerar os tipos do banco, publicar o front-end e validar uma execução com conta descartável. Conferir débito, conclusão e publicação única.

Deploys seguintes reutilizam a credencial; não executar o provisionamento novamente. Se o provisionamento inicial falhar antes de gravar o hash, pode ser repetido com as execuções paradas. Rotação exige um procedimento coordenado separado.

## Validação

- `supabase/tests/enriquecimento_worker_seguro.sql`: cria fixtures em transação, testa permissões, isolamento, duplicação, estorno e resposta tardia; desfaz tudo ao final.
- `deno test --no-lock --node-modules-dir=none --allow-env --allow-read --allow-net supabase/functions/enriquecimento/persistencia_test.ts`
- `deno check --no-lock --node-modules-dir=none supabase/functions/enriquecimento/index.ts`
- `e2e/enriquecimento-estados.spec.ts`: modal, foco, teclado, falha persistente e viewport.
- `node scripts/smoke-enriquecimento.mjs --confirmar-teste`: usa as variáveis Supabase do ambiente para criar uma conta QA, executar uma análise real, conferir duplicação, débito e publicação e remover seus dados no `finally`. Consome uma chamada real de IA. Com `SUBIDO_APP_URL=https://subido.viverdeia.ai`, também verifica a ficha autenticada em desktop e celular e salva capturas em uma pasta temporária. Nunca usar uma conta de cliente como fixture.

O watchdog operacional existente encerra trabalhos abandonados. A conclusão tardia retorna sem publicar nem reabrir uma execução encerrada. O estorno exige débito correspondente e acontece uma única vez. O polling da ficha continua enquanto o trabalho está ativo, com menor frequência após o primeiro minuto e sem consultas enquanto a aba está oculta.

Referência de provisionamento: [Management API do Supabase](https://supabase.com/docs/reference/api/v1-run-a-query).
