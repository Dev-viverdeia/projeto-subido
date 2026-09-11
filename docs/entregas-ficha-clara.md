# Entregas: uma ficha de trabalho mais clara

## Decisão de design

Manter o método e as ações existentes, reduzindo a distância entre tarefa, cliente e gestão do serviço. A ficha não é um dashboard: é uma mesa de trabalho.

```
← Entregas                         estado real
Empresa / Projeto                  tipo · concluir
Prazo · tarefas concluídas         progresso
Trabalho     Cliente [pendências]     Arquivos     Acompanhamento*
Próxima ação, quando há algo a resolver
Etapas       Tarefa em foco
```

O acompanhamento só aparece quando aplicável. Concluir manualmente não significa aceite do cliente, nem conclui tarefas pendentes.

## Acabamento

- Paleta existente: navy #0A1F3B, profundo #02162A, branco #FFFFFF, fundo frio #F7F8FA. Sem novas cores de marca.
- Geist para conteúdo; mono apenas para medidas. Tokens de leitura, interface e apoio existentes, sem texto minúsculo.
- Um cabeçalho de vidro discreto; navegação curta integrada. Sem círculos, excesso de cartões ou sombras empilhadas.
- Uma ação de trabalho em destaque. Concluir entrega continua acessível, mas não compete com a tarefa enquanto houver pendências.
- No celular, cabeçalho empilhado e navegação com alvos de pelo menos 44px; nenhuma informação essencial escondida por largura.

## Comportamento e limites

- Mostrar validações e acessos aguardados do cliente com atalhos para o item exato.
- Separar entrega concluída, aceite registrado e acompanhamento ativo.
- Preservar formulários, confirmação de pendências, loading no modal, bloqueio de envio duplicado e recuperação de falhas.
- Preservar arquivos, planos, briefing, tarefas, links diretos e permissões. Sem migração, cobrança ou alteração de dados reais nos testes.
- Navegação programática deve levar o foco ao conteúdo revelado.

## Verificação

Testes de estados manual/aprovado/recorrente, pendências e navegação; desktop, tablet e celular; teclado, foco, modal sem corte, contraste e overflow. Revisar capturas antes de publicar. PR e validação completa obrigatórios; conferir domínio real depois da promoção.

## Revisão do acabamento

As primeiras capturas mostraram que a gestão no topo precisava de outra distribuição no celular: o botão de conclusão quebrava em duas linhas. A largura dos botões foi corrigida sem diminuir a fonte. A próxima ação também passou a usar o nome da pendência diretamente, sem repetir “o cliente ainda precisa resolver”.

A navegação recorrente usa “Acompanhar” para caber em 320px. Nos testes de contraste, foram corrigidos os textos de apoio da central de arquivos e o indicador do portal. A navegação até uma validação agora coloca foco no conteúdo e respeita movimento reduzido. Compromissos abrem o conteúdo recolhido, sem exigir outro clique.

O contador “Cliente” inclui validações, preparações, compromissos e mudanças de escopo aguardando o cliente; não conta ajustes que o profissional precisa fazer.

## Resultado local

- 1.473 testes aprovados; 34 já configurados como ignorados.
- 29 cenários de interface aprovados; um cenário de redimensionamento ignorado no projeto mobile por ser executado no desktop.
- Typecheck, lint, formatação, build, identidade, fronteira client/server, lockfile e integridade do DS aprovados.
- Estados em execução, aguardando validação, concluído manualmente e recorrente revisados em capturas. Larguras de 320 a 1.440px sem overflow nos estados testados.
- Os novos testes de interface passam a fazer parte da validação obrigatória no CI.
