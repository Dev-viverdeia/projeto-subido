# Prospecção: da pesquisa à decisão

## Conteúdo e experiência

As três aulas e os dez passos de Prospecção de clientes com IA começam por exemplos curtos.
O currículo, os vídeos, os exercícios, os recursos, o slug e os IDs de progresso permanecem iguais.

- Comparação interativa de três empresas fictícias: com perfil, fora do perfil e dados incompletos.
- Fluxos de busca, cadastro único e entrega de contas aprovadas ao CRM.
- Fichas de fontes, validade, score, qualidade e rotina do cliente.
- Rascunhos de abordagem com e sem sinal recente, além do caso de contato recusado.
- Falhas de provedor, repetição e divergência entre fontes.

Os cálculos ilustrativos de cobertura e precisão usam denominadores distintos e explícitos.
Perfil e momento são separados. Dado desconhecido não significa falta de perfil.
Não se usa ausência de informação no site como prova de que uma empresa não tem outras unidades.

## Design system

`ExemploProjeto` reutiliza a apresentação da Nina e adiciona a análise de contas.
Os critérios têm texto, símbolo e estado legíveis sem depender de cores de semáforo.
Superfícies, sombras, tipografia, raios e foco usam os tokens existentes.
Os casos aparecem um por vez. O fluxo se adapta à largura do card, inclusive com o menu lateral.

## Limites

Conteúdo editorial identificado como exemplo didático, sem dados reais de empresas ou usuários.
Consultar exemplos não pesquisa provedores, não consome créditos, não envia mensagens e não grava progresso.
O usuário ainda implementa o serviço para o cliente. Somente a conclusão explícita salva uma etapa.
Passos são associados por slug e ID; aulas por slug e título. Conteúdo desconhecido preserva a leitura original.
Não há alteração de banco, cobrança, permissões ou integração.

## Manutenção e validação

- `src/lib/projetos/exemplos-prospeccao.ts`: exemplos e correspondência com o currículo.
- `src/lib/projetos/exemplos.ts`: seleção explícita entre Nina e Prospecção.
- `/preview/prospeccao-projeto`: fixture do currículo público de 08/09/2026, indisponível em produção.
- Rever a fixture e os exemplos juntos quando houver mudança de conteúdo.

Os testes cobrem todas as aulas e passos, fallback, teclado, cenários, recursos, persistência da conclusão e ausência de gravação na leitura.
Verificação visual em 1440, 1280, 1100, 900, 390 e 320 px, com Chromium e WebKit móvel.
As suítes anteriores da Nina, de projetos e de leitura guiada também são executadas.

Resultado local: 1.037 testes unitários e 52 casos de navegador aprovados (Chromium e WebKit).
Lighthouse no preview de desenvolvimento: performance 97, acessibilidade 100, boas práticas 100 e CLS 0.
Essa medição local não certifica performance autenticada de produção. Não há orçamento Lighthouse configurado no repositório.
