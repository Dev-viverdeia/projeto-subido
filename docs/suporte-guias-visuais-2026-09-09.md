# Guias visuais de agenda, propostas e entregas

## Entrega

Quatro artigos existentes revisados, sem duplicar conteúdo: conectar Google Agenda, agendar uma reunião, criar proposta sem reunião e concluir uma entrega pontual ou manter um serviço recorrente.

- Três ou quatro passos por guia, com rótulos conferidos nos componentes atuais.
- Seis capturas de componentes reais, com dados demonstrativos. Sem contas de clientes, OAuth, convites ou cobrança durante a captura.
- Imagens responsivas, carregamento sob demanda e dimensões reservadas. Ampliação em modal no portal, tamanho real com rolagem local, Escape e devolução do foco.
- Atalhos na configuração da agenda, criação da proposta e escolha do tipo de entrega. Abrem em outra aba para preservar o formulário em andamento.
- O botão de conexão tem estilo próprio baseado nos tokens; não depende de outra rota ter carregado o CSS do botão vendorizado. A navegação OAuth continua sendo uma âncora nativa, sem prefetch.

## Conteúdo publicado e manutenção

O banco continua sendo a fonte dos artigos para a central e a IA. `guias-visuais.json` é a revisão editorial desta rodada, não um override do banco. As seis novas capturas são vinculadas ao texto exato do passo: se a equipe modificar a instrução, uma imagem antiga não aparece associada ao novo texto.

`scripts/capturar-guias-produto.mjs` reproduz as seis imagens em previews locais, bloqueando requisições de mutação e integrações. Os previews devolvem 404 em produção.

`scripts/preparar-guias-visuais.mjs` gera SQL, sem executá-lo. A publicação atualiza somente resumo, passos, dica e data dos quatro artigos, em uma transação com locks e verificação da revisão anterior. Se houver edição da equipe, a transação aborta. Repetir a mesma publicação é inócuo. Títulos, slugs, categorias, tags, estado de publicação e avaliações são preservados. A revisão anterior está no commit `45440a0` e na migração inicial dos guias.

Publicar o conteúdo pelo conector do banco somente após o deploy das imagens e conferir as quatro páginas no domínio público. Não é necessária alteração de schema.

## Validação

- 52 cenários Playwright aprovados em desktop e mobile: guias, ampliação, foco, teclado, atalhos e regressão de suporte, propostas e entregas. Nenhuma violação axe A/AA detectada nos guias e modais testados; não equivale a certificação integral de acessibilidade.
- 1.199 testes unitários aprovados; 12 testes já ignorados. Um timeout do editor durante execução concorrente foi repetido com a suíte completa em quatro workers, sem alteração no teste ou no limite.
- Typecheck, lint, formatação, identidade, fronteira client/server, DS e lockfile aprovados. Build concluído com a landing estática e os quatro avisos AVIF preexistentes.
- Lighthouse mobile no build local de produção, guia de atendimento usando o mesmo visualizador: performance 93, acessibilidade 100, boas práticas 100, CLS 0. Resultado de laboratório, não dado de campo.

## Limites

Esta rodada não altera o fluxo OAuth, aprovação do Google, processamento da IA, regras de convite, suporte por e-mail, permissões, cobranças ou dados de clientes. A imagem de agenda conectada é demonstrativa, não comprovação de uma autorização real.

## Próximo bloco recomendado

Ajuda na ocorrência de erros: apresentar a orientação pertinente ao problema e um caminho de recuperação na própria tela, preservando os dados preenchidos antes de encaminhar ao suporte.
