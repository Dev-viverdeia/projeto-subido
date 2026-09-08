# Certificados: galeria e documento co-branded

## Experiência

- Cards grandes, em duas colunas no desktop e uma no celular.
- Prévia do documento com nome, conteúdo e data de conclusão; ação de abrir fora do papel.
- Marcas oficiais Subido e Viver de IA, sem assinaturas ou acreditações inventadas.
- Um único componente de documento para galeria, folha individual e página pública.
- Progresso incompleto separado das conquistas, com retomada direta.
- Estado vazio com modelo explicitamente ilustrativo e sem validade.
- Cabeçalho curto, sem navegação numerada ou blocos explicativos redundantes.
- Carregamento claro acompanha a nova galeria.

## Design e manutenção

`DocumentoCertificado` é puro e não consulta dados nem emite certificados. Reutiliza
as logos existentes, Geist e os tokens navy/branco da plataforma. O vidro e a sombra
ficam nos cards externos; a folha mantém fundo branco para leitura e impressão.

O documento expande no celular em vez de cortar nomes, títulos ou o código. Na
impressão, somente a folha ocupa o A4 horizontal. Datas usam o fuso de São Paulo
nas três superfícies. Não há dependência nova nem alteração do DS vendorizado.

## Limites preservados

A conclusão continua calculada pelo progresso real. Projetos exigem aulas e
implementação. Emissão e código público continuam validados no servidor, pelo
comando explícito de preparar o compartilhamento. Nenhum progresso, crédito,
certificado ou política de acesso é alterado por abrir esta tela.

## Verificação

- Casos de galeria concluída, progresso parcial, estado vazio e nomes longos.
- Testes de navegação e acessibilidade em Chromium e WebKit móvel; largura mínima de 320 px.
- Cópia de link e comando de impressão testados sem publicar ou emitir registros reais.
- Dois PDFs de QA, incluindo nome e título longos: uma página A4 cada, inspecionados visualmente.
- Previews de desenvolvimento retornam 404 em produção.

Resultado local: 1.047 testes unitários aprovados (12 testes previamente ignorados)
e 16 casos de navegador aprovados. Uma primeira execução geral excedeu o tempo de
um teste do editor de propostas enquanto outras verificações estavam concorrendo;
a suíte completa passou ao limitar a concorrência, sem editar o teste existente.

Lighthouse do preview local: performance 96, acessibilidade 100, boas práticas 100,
CLS 0. Não representa uma medição autenticada de produção.

Os PDFs de QA são artefatos de teste, não certificados emitidos. O compartilhamento
no LinkedIn mantém o link público existente; a imagem social personalizada pode
ser evoluída em um bloco separado.
