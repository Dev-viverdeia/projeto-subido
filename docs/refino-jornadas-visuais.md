# Refinamento de Projetos, Reuniões e Certificados

## Direção

O usuário precisa encontrar um projeto, executar um passo e compartilhar sua conclusão sem atravessar uma tela de instruções. Preservar os fluxos visuais e revelar detalhes somente no contexto da tarefa.

- Paleta existente: branco `#FFFFFF`, superfície `#F7F8FA`, navy `#0A1F3B`, navy profundo `#02162A`, azul `#1E3A5F`. No código, somente tokens canônicos.
- Geist para títulos e leitura; 15 px nos controles, 14 px no apoio, 17 px na leitura. Não reduzir fontes para ganhar espaço.
- Vidro claro, bordas suaves e sombras navy existentes. Sem círculos, novos ornamentos ou novas dependências.

## Composição avaliada

```text
A — atual, celular             B — escolhida, celular
Identidade                     Identidade
Resumo                         Resumo
Fluxo ilustrativo              Prazo + ação
Prazo + ação                   Fluxo ilustrativo
```

A ilustração continua presente, mas deixa de empurrar a ação para baixo da navegação fixa. No desktop, o fluxo ocupa a coluna direita; identidade e ação ficam alinhadas à esquerda. A mudança depende da tarefa, não de uma nova decoração de cards.

Na ficha, o acesso às aulas fica compacto ao lado do progresso quando couber, preservando o empilhamento para ações com títulos longos. O menu compacto de aulas e fases permanece: os testes devem abrir os controles que o usuário realmente vê.

Certificados mantêm a composição atual. O download passa a ter estado de preparação e erro recuperável: não salvar uma resposta de erro como se fosse um PNG. Compartilhar o link continua independente do download.

## Critérios

- Ação do projeto visível acima da navegação mobile, sem cortar texto.
- Aulas e passos acessíveis por teclado e pelo menu compacto, sem concluir conteúdo ao navegar.
- Permissões negadas de câmera/microfone não bloqueiam a entrada com dispositivos desligados.
- Download válido, falha de rede e nova tentativa conferidos no desktop e no WebKit mobile.
- Separar regressões reais de seletores antigos e problemas do ambiente de teste.

## Evidências de validação — 9 de setembro de 2026

- Projetos: em 375 × 667, a ação termina em 549 px, acima da navegação inferior (área útil de 593 px), sem rolagem inicial. Composição também inspecionada em 390 e 1440 px.
- Jornada visual: 136 testes aprovados no Chromium e no WebKit móvel (130 de jornada e seis adicionais do DS em certificados). Quatro casos não aplicáveis ao mobile (hover e câmera sintética) seguem explicitamente excluídos. Cobertura de 320 px, teclado, movimento reduzido, contraste, todas as aulas e todos os passos dos três projetos completos.
- Certificado: geração de PNG válida, download, prévia, impressão, cópia e compartilhamento. Novos testes cobrem erro HTTP, HTML disfarçado de arquivo, imagem inválida, nova tentativa, carregamento e fechamento durante a espera.
- Reunião: permissão de mídia negada permite continuar sem câmera/microfone. O mock do teste agora permite que o shim do Safari envolva `getUserMedia`; não era uma falha comprovada da aplicação.
- Testes unitários: 1.152 aprovados, 12 excluídos. Uma execução concorrente apresentou um timeout em Propostas; o arquivo isolado e a suíte completa com três workers passaram sem alterações nesse módulo.
- Build aprovado com a landing estática. Tipagem, lint, formatação, identidade, integridade do DS e fronteira client/server aprovados.
- Lighthouse mobile na landing do build de produção local: desempenho 87, acessibilidade 100, boas práticas 100, SEO 100; LCP 3,9 s, CLS 0,017 e TBT 20 ms. É uma medição de laboratório da landing, não uma nota da área logada. Há espaço para melhorar o carregamento inicial em uma rodada própria; nenhum arquivo da landing foi alterado aqui.

Esta rodada não representa uma nova aprovação de toda a plataforma: outras pendências legadas de Vendas e do portal permanecem fora deste recorte. Nenhum conteúdo, progresso real, integração OAuth ou regra de negócio foi alterado.
