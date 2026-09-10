# Sobral AI: arquivos da conversa

## Entrega

- Botão discreto **Arquivos** no cabeçalho da conversa, sem barra lateral permanente.
- Lista paginada de imagens, PDFs, documentos e áudios enviados. Busca literal pelo nome em toda a conversa, não apenas nas mensagens carregadas na tela.
- Prévia de imagem/PDF e player de áudio reutilizados. Um modal por vez; voltar mantém busca, resultados e foco.
- Download de outros documentos e ação **Ver mensagem** por arquivo.
- Texto e arquivos em rascunho permanecem no compositor durante a navegação.
- Estados de carregamento, vazio, falha, repetição e sessão diferente; busca cancelável com limite de 15 segundos.

O design e a revisão de acessibilidade orientaram a lista curta, os controles de 44 px, o retorno de foco, o contraste e a adaptação ao celular. O design system vendorizado não foi alterado.

## Dados, desempenho e privacidade

- `GET /api/consultor/arquivos`: exige sessão e valida conversa, conta esperada, termo e página. O dono autorizado vem da sessão, nunca do navegador.
- Filtros por dono e conversa com RLS. Nenhum caminho de armazenamento, URL assinada, transcrição ou conteúdo de mensagem é devolvido na lista.
- 20 arquivos por página, ordenação estável e contagem exata. A lista só consulta dados ao abrir; não baixa anexos nem inicia IA.
- Índices existentes por dono/data, mensagem/data e conversa/data atendem o caminho de consulta; nenhuma migração ou dependência nova.
- Origem já visível: foco e scroll apenas na leitura do chat. Origem antiga: leitura adicional limitada à mesma conversa e à mesma RLS.
- A janela da conversa passa a ler as 200 mensagens **mais recentes**, mantendo a última rodada real. A origem anterior é mostrada como trecho separado, com intervalo explícito antes da conversa recente; não cria uma nova geração.
- A rota privada de arquivos preserva seus controles de sessão, pasta e MIME. Normaliza somente o parâmetro de download que o SDK codificava duas vezes, preservando acentos e percentuais no nome sem alterar o token assinado.

## Validação antes da publicação

- TypeScript, ESLint, formatação, identidade, integridade do DS, fronteira cliente/servidor e lockfile.
- Build de produção; landing continua estática.
- Suíte unitária completa e regressão de anexos, leitura, histórico, rascunhos, primeiro envio e recuperação do Sobral AI.
- Novos testes de busca, paginação, erro, concorrência de respostas, sessão diferente, foco, prévia e cabeçalho entre 320 e 1440 px.
- Axe WCAG A/AA nos modais. Teste automatizado não substitui avaliação humana completa com leitor de tela.
- QA autenticado em build de produção: duas contas sintéticas, 25 arquivos e conversa de 212 mensagens. PDF real de duas páginas; busca com `%` e `_`; download com nome preservado; origem fora da janela inicial; texto e arquivo em rascunho preservados; acesso anônimo negado e isolamento entre contas.
- Zero gerações de IA e nenhum POST de produto pelo navegador de QA. Contas e arquivos sintéticos removidos ao finalizar; contas reais não foram alteradas.

O mesmo roteiro autenticado deve ser repetido no domínio público após confirmar o deployment correspondente ao merge. Lighthouse na landing é uma medição de laboratório, não uma nota global da plataforma.

## Limites e próximo bloco

A busca deste bloco é pelo **nome do arquivo**, não pelo texto dentro dos documentos ou das mensagens. Imagens e PDFs usam o leitor já existente; outros documentos são baixados. Não há upload, transcrição, OCR ou análise de IA adicional.

Próximo bloco sugerido: busca por trechos nas mensagens da conversa, com acesso à resposta original e navegação clara pelo histórico antigo. Reaproveitar o foco e preservar o rascunho, sem gerar novas respostas de IA.
