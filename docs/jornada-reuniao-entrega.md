# Reunião → proposta → entrega

## Comportamento esperado

- A revisão da reunião mantém texto, data, etapa e compromissos se houver falha.
- O resultado aparece no formulário, sem redirecionar para uma página que perca a revisão.
- A próxima ação usa fatos persistidos: uma entrega ativa de uma venda ganha tem prioridade sobre a proposta antiga.
- Uma proposta aceita mostra **Abrir entrega** antes do editor. Se a criação não terminou, oferece **Preparar entrega** no mesmo lugar.
- Preparar a entrega organiza o trabalho; não implementa o serviço no lugar do profissional.
- Mensagens, foco por teclado e contrastes seguem a camada de design existente.
- Uma queda de conexão informa que o salvamento não foi confirmado, sem afirmar que nada foi salvo. Repetir a confirmação reaproveita as ações existentes.
- O seletor mantém a borda de erro no hover e no foco, independentemente da ordem de carregamento do CSS.

## Regressão automática

Testes unitários: validação, sessão, vínculo reunião/cliente, retorno sem gravação, preservação dos campos e prioridade da continuidade.

`e2e/continuidade-reuniao-entrega.spec.ts` verifica desktop e celular, interrupção de rede, CTA antes do editor, recuperação e acessibilidade.

## Verificação com conta descartável

```sh
node --env-file=/caminho/seguro/env scripts/smoke-reuniao-entrega.mjs --confirmar-teste
```

Configuração necessária: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. `SUBIDO_APP_URL` é opcional e aceita apenas localhost ou o domínio público da Subido.

O script cria uma reunião e uma análise fictícias para isolar as transições. Depois usa a interface real para revisar, salvar, criar proposta, confirmar venda e abrir a entrega. Confere a persistência e a ausência de duplicações. Captura desktop/celular e remove somente a conta e os registros de QA em `finally`.

Não envia convites, não grava chamadas, não chama IA e não testa pagamentos. Uma aprovação neste teste comprova essas transições, não a infraestrutura de vídeo nem a qualidade da análise de IA.
