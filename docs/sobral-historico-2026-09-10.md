# Sobral AI — encontrar e renomear conversas

## Experiência

- Busca pelo título no próprio menu Conversas, incluindo registros anteriores às 40 conversas recentes.
- Histórico em páginas de 40 itens; Carregar mais mantém os resultados já carregados.
- Renomeação no item, com confirmação do servidor, Cancelar, Enter e Escape. O endereço da conversa não muda.
- Nome de até 120 caracteres. A pergunta em edição permanece independente do histórico.
- Menu em portal, com altura limitada à tela e espaço recalculado quando o teclado móvel altera a viewport.
- Tokens oficiais de tipografia, superfície e foco. Base sólida no celular: QA WebKit a 320px exibiu conteúdo atrás mesmo com blur declarado; legibilidade não depende desse efeito.

## Dados e limites

Leituras e renomeações usam a sessão da pessoa, RLS e filtro explícito por proprietário. O dono informado pelo cliente serve apenas para rejeitar uma aba de outra conta, nunca para conceder acesso. Busca sem cache compartilhado; respostas antigas são descartadas ao alterar o filtro.

A busca ignora diferenças entre maiúsculas e minúsculas, mas considera acentos. Pesquisa títulos, não o conteúdo das mensagens. `%`, `_` e barra invertida são tratados literalmente. Renomear altera somente o título: não muda mensagens, data da última atividade, créditos ou permissões. A comparação com o nome anterior impede sobrescrever uma edição concorrente. Sem nova integração, migração ou geração de IA.

## Validação

- 1.281 testes unitários aprovados; 12 já desabilitados permanecem assim.
- 38 cenários Playwright de histórico, primeiro envio, rascunhos, anexos/áudio e recuperação de IA aprovados em desktop e WebKit móvel. Revisão adicional do histórico após o acabamento visual.
- Verificações AA do painel e da edição; teclado, foco, nomes longos, estado vazio, busca indisponível e recuperação no próprio menu.
- Build de produção, typecheck, lint, integridade do DS, identidade e fronteira client/server. Landing continua estática. Quatro avisos preexistentes de AVIF no Turbopack.
- Lighthouse local da landing: performance 90, acessibilidade 100 e boas práticas 100. Medida de laboratório, não garantia de desempenho para toda a área autenticada.
- Build local autenticado: 45 conversas sintéticas, busca além da primeira página, renomeação efetiva, título da página atualizado, rascunho preservado, recarga e cancelamento mobile. Mensagens e última atividade permaneceram intactas.
- Duas contas sintéticas: sessão trocada não renomeia; busca retorna apenas dados do proprietário; RLS bloqueia update de conversa alheia. Zero gerações de IA. Contas e registros de QA removidos ao terminar.

Publicação exige CI no commit exato e conferência autenticada no domínio público após o merge.
