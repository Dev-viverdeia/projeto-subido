# Assistente de reuniões: da fala ao trabalho revisado

As três aulas e os dez passos começam por exemplos visuais. O currículo, os vídeos, os
exercícios, os recursos, o slug e os identificadores de progresso foram preservados.

## Padrão visual

O componente compartilhado `ExemploProjeto` ganha uma comparação pós-call: trechos com
participante e horário de um lado; resumo e tarefa para revisão do outro. Em cards estreitos,
a leitura segue de cima para baixo. Três situações mostram acordo, prazo ausente e sugestão
não aceita. Nenhum botão do exemplo cria tarefa, grava, envia ou aprova uma ação real.

Os demais exemplos reutilizam fluxos de quatro etapas, fichas e cenários de conversa.
O Live Coach demonstra dica útil, ponto já respondido e áudio incerto. A calibração mantém
erros críticos visíveis, sem esconder tarefa inventada em uma média geral.

Tokens existentes de vidro, sombra navy, tipografia e foco. Estados têm rótulo e símbolo,
sem depender de cores. Alvos de 44 px e layout adaptado à largura real do card.

## Limites e manutenção

- Conteúdo editorial identificado como exemplo didático, com pessoas e falas fictícias.
- Consulta não usa provedores, gravações, créditos ou dados de clientes.
- Datas ausentes permanecem ausentes; datas internas não viram compromisso do cliente.
- O aluno continua responsável por implementar, testar e entregar o serviço.
- Conclusão só pelo comando explícito. Conteúdo desconhecido mantém a apresentação original.
- Não há alterações de banco, permissões ou integrações.
- `src/lib/projetos/exemplos-reunioes.ts` mapeia o conteúdo por slug, passo e título da aula.
- `/preview/reunioes-projeto` contém snapshot educacional de 08/09/2026 e retorna 404 em produção.

## Verificação

Testes de conteúdo, comparação de cenários, teclado, progresso explícito, recursos,
responsividade na moldura da plataforma e regressão dos projetos anteriores.
Resultado local: 1.045 testes unitários e 62 casos de navegador aprovados em Chromium e
WebKit móvel. As verificações cobrem 320, 390, 900, 1100, 1280 e 1440 px, sem recortes;
o verificador de acessibilidade não encontrou violações nas telas testadas.

Typecheck, lint, formatação, integridade do design system, tokens, fronteira cliente/servidor
e build aprovados. A landing permanece estática. O build mantém quatro avisos preexistentes
de imagens AVIF da landing, sem relação com esta alteração.

Lighthouse no preview de desenvolvimento: performance 95, acessibilidade 100,
boas práticas 100 e CLS 0. É uma medição local, não uma certificação da performance
autenticada de produção. O repositório não possui orçamento Lighthouse configurado.
