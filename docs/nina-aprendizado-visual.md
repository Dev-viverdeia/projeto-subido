# Nina: exemplos antes das instruções

## O padrão

Aulas e implementação usam exemplos didáticos, não simulações de uma integração em funcionamento.
Três formatos mostram relações concretas: fluxo com desvio, ficha preenchida e conversa com cenários.
As superfícies, contraste, tipografia e foco usam os tokens existentes do design system.
O texto de apoio permanece acessível sob demanda; exercícios, modelos e critérios de conclusão foram preservados.

## Limites importantes

- Nada nesta camada envia mensagens, consulta agendas, consome créditos ou grava progresso.
- A pessoa ainda precisa executar o projeto do cliente e marcar sua conclusão explicitamente.
- Os exemplos são específicos da Nina. Passos usam IDs estáveis; aulas usam correspondência por título, nunca apenas por índice.
- Outro projeto, passo desconhecido ou aula alterada mantém a leitura original. Não recebe conteúdo genérico por aproximação.
- Ao voltar a um passo concluído, a conferência vem primeiro.
- As três situações ilustrativas de teste não substituem os vinte testes exigidos na implementação.

## Onde manter

- `src/lib/projetos/exemplos-nina.ts`: conteúdo editorial e correspondência.
- `ExemploNina.tsx` e seu CSS Module: apresentação, sem dependências novas ou chamadas de rede.
- `/preview/nina`: página apenas de desenvolvimento, com snapshot do roteiro público em 08/09/2026. Não contém dados de alunos ou clientes.
- Se o roteiro mudar, revisar exemplos e fixture juntos. Os testes verificam cobertura dos dez passos e das três aulas.

## Verificação

Testes unitários cobrem correspondência, fallback, teclado, recursos e ausência de gravação ao consultar.
`e2e/nina-visual.spec.ts` percorre as três aulas e os dez passos em Chromium e WebKit móvel, verifica persistência da conclusão explícita e acessibilidade em 320 px.
Testes anteriores de leitura guiada e projetos continuam cobrindo os demais roteiros.

Validação desta alteração: 1.029 testes unitários e 42 testes de navegador aprovados.
O roteiro real também foi conferido com o menu lateral em 1440, 1280, 1100, 900 e 390 px.
O fluxo se reorganiza pela largura do próprio card, não apenas pela janela.
Lighthouse no preview local de desenvolvimento: performance 96, acessibilidade 100, boas práticas 100 e CLS 0.
Essa medição local não é uma certificação da performance da sessão autenticada em produção; não há orçamento Lighthouse configurado no repositório.
