# Voltar à empresa na Prospecção

## Decisão de experiência

Preservar a tela publicada. O único ajuste visível na ficha é o link de retorno, que passa a dizer `Voltar para Prospecção` quando a pessoa veio de uma lista. Sem banner de boas-vindas, novos painéis ou animação de rolagem.

```text
Lista → empresa → Abrir ficha / Criar oportunidade
                    ↓
             Ficha do cliente
             Voltar para Prospecção
                    ↓
Mesma lista → mesma empresa → posição e foco recuperados
```

Paleta preservada: branco #FFFFFF, superfície #F7F8FA, navy #0A1F3B, navy profundo #02162A, azul #1E3A5F e texto #4F596B. Geist em toda a leitura. Link de retorno em 14 px, área mínima de 44 px e foco do design system.

Revisão do plano: um segundo botão para Vendas seria redundante com a navegação principal. O link existente muda de destino; a entrada direta em uma ficha continua voltando para Vendas.

## Implementação e limites

- Destinos internos construídos com IDs validados, sem aceitar uma URL livre de retorno.
- Lista e empresa via URL: funcionam após recarregar ou abrir outra aba.
- Posição temporária na aba, sem nome, contato ou conteúdo do cliente; somente lista, empresa, medida de posição e validade. O alvo precisa existir na lista autorizada que o servidor carregou.
- Histórico do navegador preservado, sem observar cada evento de rolagem.
- Armazenamento indisponível, mudança de largura ou registro removido: retorno utilizável ao card ou à lista, nunca uma tela quebrada.
- Sem mudança de créditos, integrações, regras comerciais ou banco.

## Verificação

Cobrir ficha existente, criação e falha, ida pelo modal, voltar da ficha, voltar do navegador, recarregar, armazenamento bloqueado, IDs inválidos, lista diferente e alvos removidos. Conferir foco e posição em desktop e celular. Publicar somente após os gates do repositório.

Validação local: 72 execuções aprovadas (8 cenários em Chrome, Safari e Firefox, repetidos três vezes, sem retries). A criação é simulada na prévia isolada, sem POST nem alteração de registros. O redirecionamento da ação real possui teste unitário separado. A matriz de acabamento do CI passa a incluir estes cenários.

A revisão encontrou e corrigiu uma segunda rolagem quando a lista em cache era confirmada pelo servidor. O alvo já restaurado não é reposicionado; uma nova saída continua registrando uma nova posição. Há um teste de regressão para essa sequência.
