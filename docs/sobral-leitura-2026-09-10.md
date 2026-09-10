# Sobral AI — leitura e próxima ação

## O que muda

- Respostas longas começam pelo primeiro parágrafo, com “Ler resposta completa”. A dobra ocorre somente entre parágrafos inteiros: acima de 1.100 caracteres, com pelo menos três parágrafos e abertura de até 700 caracteres. Respostas curtas ou sem uma quebra segura ficam abertas.
- Copiar continua levando o texto integral. Durante a geração ou em uma resposta interrompida, nenhum trecho é recolhido.
- Ação de Vendas e plano deixam de competir em dois cartões. A revisão e a confirmação continuam necessárias antes de registrar a ação.
- Sem ação de Vendas, o próximo passo usa o nome do destino: Escolher projeto, Ver formações, Criar proposta etc.
- Primeira recomendação visível; demais em “Mais recomendações”. Títulos, destinos, ordem e motivos completos são preservados. Nenhuma classificação nova é inventada.
- Parágrafos com medida de leitura, sem divisórias repetidas; tipografia de 16–17px; ícones do produto e superfícies dos tokens oficiais. Detalhes nativos funcionam sem JavaScript.
- Reabrir uma conversa começa pela última resposta concluída, sem rolar a página inteira nem esconder o cabeçalho. Conversas pendentes mantêm a recuperação no fim.

## Limites

Bloco de apresentação. Não altera modelo, prompt, catálogo, créditos, permissões, mensagens salvas ou regras de confirmação. Não adiciona biblioteca de markdown, resumo automático ou integração.

## Validação local

- 1.289 testes unitários aprovados; 12 testes previamente desabilitados mantidos.
- Leitura por teclado, cópia integral, motivos sem corte, destinos, resposta curta, ausência de recomendações, leitura sem JavaScript e revisão/registro em modo de demonstração.
- 52 cenários Playwright aprovados, incluindo regressões de histórico, rascunhos, primeiro envio, anexos/áudio e recuperação de resposta.
- Verificação automática AA em desktop e WebKit móvel, incluindo 320px, sem transbordamento; revisão visual do build autenticado.
- Typecheck, lint, formatação, integridade do DS, identidade, fronteira client/server e build. Landing permanece estática. Avisos preexistentes de AVIF no build.
- Lighthouse local da landing: performance 97, acessibilidade 100, boas práticas 100. Medição de laboratório, não nota de toda a plataforma.
- Conta temporária com resposta e recomendações fictícias: nenhuma geração de IA, envio ou alteração de conta real; limpeza dos registros ao terminar.

Publicação depende de CI aprovado no commit exato, deployment de produção pronto e nova conferência autenticada no domínio público.
