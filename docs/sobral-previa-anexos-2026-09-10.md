# Sobral AI: imagens e PDFs dentro da conversa

## Entrega

- Imagens e PDFs selecionados ou já enviados abrem em um modal da plataforma.
- O compositor não desmonta: texto, anexos e estado de envio permanecem na conversa.
- Imagem com ampliação; PDF com páginas, zoom, texto extraído sob demanda e download.
- Carregamento, falha e nova tentativa dentro do modal. Fechar e baixar continuam disponíveis.
- Escape, foco de retorno, navegação por teclado e controles de pelo menos 44 px.
- Ajuste local de foco para Safari: tocar no anexo registra o gatilho antes de abrir o modal, sem devolver o teclado ao compositor ao fechar.

## Implementação e privacidade

Usa o modal operacional existente, em portal, e preserva o design system vendorizado. A revisão de design e acessibilidade orientou hierarquia curta, contraste, superfícies frias e navegação responsiva.

PDF.js 6.3.289 é importado somente ao abrir um PDF. O worker, fontes, CMaps, perfis de cor e WASM vêm da mesma versão fixada no lockfile. `predev` e `prebuild` geram esses recursos em `/public/vendor/pdfjs/`, servido pelo próprio produto. Não há visualizador de terceiros. Referência técnica: [documentação oficial do PDF.js](https://mozilla.github.io/pdf.js/examples/).

- A rota de anexos continua validando sessão, dono, conversa, caminho e tipo permitido antes de emitir uma URL assinada de 90 segundos, com `private, no-store`.
- `download=1` permite baixar imagens com o nome original; não altera a autorização.
- PDFs são lidos como bytes e renderizados em canvas, sem iframe, ações, links ou formulários executáveis do documento.
- O download é interrompido acima de 15 MB. O carregamento tem limite de 30 segundos; fechar aborta a leitura e destrói o worker.
- Apenas uma página renderizada por vez; canvas limitado a 4 milhões de pixels e renderizações serializadas no redimensionamento.
- URLs locais continuam sendo revogadas pelo ciclo de vida já existente de `useArquivoLocal`.
- Outros documentos continuam disponíveis para download. Áudio permanece no player existente.

## Validação

- TypeScript, ESLint, formato, identidade, integridade do DS e fronteira cliente/servidor.
- Build de produção; landing continua estática.
- 1.290 testes unitários aprovados, 12 testes já existentes ignorados.
- 60 cenários Playwright no conjunto do Sobral AI: desktop Chromium e mobile WebKit, incluindo prévias, leitura, histórico, rascunhos, recuperação e primeiro envio.
- PDF sintético de duas páginas: pixels de tinta reais, texto de cada página, limites da navegação, zoom, download e erro de arquivo inválido.
- Teclado, foco, largura de 320 px, movimento reduzido e axe WCAG A/AA no modal.
- QA autenticado com contas e arquivos sintéticos: renderização dos anexos armazenados, rascunho, download, isolamento entre duas contas, acesso anônimo negado e nenhuma geração de IA.
- Auditoria das dependências de produção sem vulnerabilidades reportadas pelo npm nesta execução.

Contas e arquivos de QA são removidos ao terminar. Dados de usuários reais não são usados.

## Limites explícitos

- PDF protegido por senha orienta o download; não coleta a senha dentro do chat.
- PDF digitalizado sem camada textual pode ser visto, mas não recebe OCR novo. O leitor informa a ausência de texto selecionável.
- O teste automatizado de acessibilidade não substitui uma revisão completa com leitor de tela humano.
- Lighthouse na landing é um teste de laboratório, não uma nota de desempenho de toda a plataforma.

## Próximo bloco sugerido

Centralizar os arquivos já enviados em uma lista compacta por conversa, com busca por nome e acesso direto à mensagem de origem. Reutilizar esta prévia, sem criar novos uploads ou cobrar créditos.
