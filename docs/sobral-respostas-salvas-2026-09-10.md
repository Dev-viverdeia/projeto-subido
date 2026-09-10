# Sobral AI · respostas salvas

## Experiência

- Salvar ao lado de Copiar. Estado confirmado pelo servidor, com espera e erro recuperável.
- Conversas → Salvas: biblioteca privada, carregada apenas ao abrir, com busca literal e 20 resultados por página.
- A resposta abre na conversa original em outra aba, já expandida e em foco, mesmo fora das 200 mensagens recentes. A aba atual preserva texto e arquivos não enviados.
- Remover retira somente o marcador. A mensagem e a conversa permanecem.
- Sem nova geração de IA, consumo de créditos, coluna permanente ou outro botão no cabeçalho.

## Dados e autorização

Migration `20260910191640_sobral_respostas_salvas.sql`, aplicada antes da publicação do código. Tipos conferidos com a geração do schema remoto.

`consultor_respostas_salvas` guarda dono, mensagem e data; não duplica o conteúdo. Chave composta e inserção com conflito ignorado tornam o salvamento repetível sem trocar a data. A ação recebe o estado desejado, não um toggle.

RLS e Server Action conferem dono da sessão, dono da conversa e papel consultor. A conta enviada pelo navegador é apenas a expectativa da tela, nunca fonte de autorização. Usuários não podem alterar dono, mensagem ou data de um marcador existente. Anônimos não têm acesso.

Índices cobrem dono/data e FK da mensagem. Listas devolvem somente referências e trechos. Respostas HTTP usam `private, no-store`; erros não expõem detalhes internos.

## Validação

- Unitários: contrato, sessão, autorização, idempotência, exclusão limitada ao marcador, erro, busca, paginação, rota privada e botão pendente.
- Playwright Chromium e WebKit: tabs por teclado, estados vazio/erro/retry, resultados atrasados, leitura móvel, busca literal, paginação, rascunho com arquivo e axe WCAG A/AA.
- QA autenticado com duas contas descartáveis, 212 mensagens na conversa principal e 22 respostas salvas. Salvamento real pela Server Action, leitura em outra aba, origem antiga, remoção, tentativa de sessão forjada e RLS via cliente comum. Zero gerações de IA e nenhuma mensagem apagada pela interface.
- Contas, conversas e marcadores de QA removidos ao terminar; nenhuma conta real alterada.

A evidência de CI e validação no domínio público fica registrada na PR da entrega. Não confundir teste local com publicação.
