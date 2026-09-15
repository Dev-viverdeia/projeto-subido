# Upgrade de design e interação — 14/09/2026

## Resultado e alcance

Implementação local da direção estudada a partir do Transitions.dev: menos superfícies competindo, leitura opaca e legível, vidro nos controles e nas superfícies de ação, movimento curto e sem uma nova biblioteca.

Base: `59940c8f5b4f9b02cf4b31a5e8c035339ebe6c31`. Branch: `codex/upgrade-design-2026-09-14`.

Nenhuma alteração no pacote vendorizado `src/design-system/via/`, nas dependências, em dados de clientes, pagamentos, créditos ou integrações. O Início com cards foi preservado. Não houve publicação nesta rodada.

## Entregas

| Área               | Mudança                                                                                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base compartilhada | Corrigidos tokens de duração/curva inválidos no modal e no menu móvel. Entrada desktop do modal em 8px/320ms, sem escala de texto. Mobile com duração válida e movimento reduzido com precedência correta.                  |
| Prevenção          | Novo validador no `check:identidade`: detecta token composto em duração/delay e duas curvas na mesma transição. Dez testes cobrem o contrato. Ocorrências equivalentes nos componentes de Reuniões também foram corrigidas. |
| Vendas             | Quadro e colunas mais discretos; cards de clientes em primeiro plano; próximo passo sem outra caixa interna; busca com alvo de 44px. Etapas, arquivo e desfechos preservados.                                               |
| Ficha do cliente   | A ação combinada permanece prioritária. Se já existir próxima ação, a sugestão da IA fica em uma expansão explícita, sem ser aplicada automaticamente. Fatos, hipóteses e fontes permanecem acessíveis.                     |
| Projetos           | Cabeçalho, progresso e atalhos estáveis entre as áreas. Fase atual clara sem uma segunda barra navy; guia e resultado com menos caixas. Aprendizado, implementação e entrega continuam distintos.                           |
| Sobral AI          | Resposta sobre superfície de leitura, recomendações com separadores leves e ação com vidro neutro. Título de ação concluída não é truncado. Player, anexos, envio, histórico e lógica de scroll preservados.                |
| Propostas          | Uma superfície para os campos, seções separadas por linhas, espaçamento sem padding duplicado. Prévia, versão enviada e estado de salvamento preservados.                                                                   |
| Métricas e Suporte | Menos elevação nas áreas de leitura; vidro e destaque nas ações. Busca da ajuda conserva anel de foco explícito.                                                                                                            |
| Falha global       | Mensagem direta e botão “Tentar novamente”. Detector de erro do smoke atualizado para reconhecer a nova copy e a antiga.                                                                                                    |

As correções compartilhadas alcançam os consumidores existentes dos modais e menus. Isso não equivale a uma nova auditoria de todos os estados de todas as rotas: a extensão visual aplicada nesta rodada foi seletiva, não uma substituição automática da plataforma inteira.

## Decisões de curadoria

- Mantidos os controles de abas existentes: indicador atrás do texto, navegação por setas e redução de movimento já implementados.
- Não importadas receitas, CSS global ou tokens do catálogo externo. A referência orientou a solução, sem copiar um segundo sistema visual.
- Fechamento do modal continua imediato. Uma saída animada exigiria manter DOM, foco e bloqueio durante a saída; foi deliberadamente separada para não ampliar a arquitetura de acessibilidade por um efeito visual.
- Sem números animados, porcentagens fictícias, blur na leitura, efeitos contínuos decorativos ou dependência de animação para salvar dados.

## Evidência funcional e visual

Prévia local com dados demonstrativos e configuração isolada. Nenhum convite enviado, proposta publicada ou crédito consumido.

| Verificação         | Resultado observado                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Modal, 390 × 844    | Duração `0.32s`, campo Empresa recebe foco, sem overflow horizontal. Fechar devolve o foco e libera o scroll.                                                |
| Modal, 320 × 568    | Diálogo de 560px começa em y=8. Corpo com 324px de área visível / 388px de conteúdo e `overflow:auto`. Rodapé termina em y=568.                              |
| Menu, 390 × 844     | Fundo `0.14s`, painel `0.32s`; foco em Fechar navegação. Abrir/fechar novamente não deixa bloqueio residual; foco retorna a Mais.                            |
| Projeto, 1440 × 900 | Cabeçalho de 211.0625px e abas em y=293.65625 preservados entre Visão geral e Implementar.                                                                   |
| Projeto, 768 × 1024 | Cabeçalho de 347.859375px e abas em y=403.578125 preservados entre as mesmas áreas.                                                                          |
| Vendas, 1920 × 1080 | Sem overflow horizontal.                                                                                                                                     |
| Ficha               | Sugestão da IA inicialmente recolhida com ação existente; abre por solicitação explícita.                                                                    |
| Sobral AI           | Leitura e campo de mensagem com 17px no celular; recomendações adicionais acessíveis pela expansão; sem overflow horizontal observado.                       |
| Proposta            | Alteração do nome aparece na prévia sem salvar. Troca Editar / Ver prévia no celular preserva a alteração. Nenhuma sincronização com servidor nesta fixture. |
| Suporte             | Buscar “agenda” retorna os guias correspondentes; foco visível com anel de duas camadas, sem overflow horizontal.                                            |

Capturas em `output/subido/upgrade-design-2026-09-14` no workspace principal. Alguns previews usam moldura demonstrativa; não são capturas da conta autenticada em produção.

## Verificações automatizadas

- Suíte completa: **1.782 testes aprovados**, 34 excluídos; 341 arquivos aprovados e seis excluídos. As exclusões existentes não foram removidas.
- TypeScript e ESLint aprovados.
- Formatação, identidade, fronteira client/server e lockfile aprovados.
- DS íntegro: **108 arquivos** coincidem com o upstream fixado.
- Build de produção aprovado. Permanecem quatro avisos do Turbopack sobre AVIF na landing; os arquivos são emitidos sem otimização adicional. Não foram introduzidos por este upgrade.
- Durante hot reload apareceu um aviso de hidratação na prévia do CRM. Não reapareceu após recarregamento completo. Não foi tratado como prova de um defeito novo do produto nem como validação de produção.
- A primeira execução da verificação de drift encontrou um clone temporário inválido. Reexecução em diretório temporário novo aprovou a integridade, sem alterar o clone anterior ou o vendor.

## Antes de publicar

1. Homologar o diff em Safari/WebKit e Firefox, com teclado virtual, zoom 200%, leitor de tela e preferência real de movimento reduzido. O CSS e os testes de interação cobrem os contratos, mas esses cenários não foram certificados nesta rodada.
2. Rodar a matriz E2E completa e comparar performance/bundle em build de produção contra a base. Não há ganho percentual de performance medido aqui.
3. Conferir os fluxos com dados reais em ambiente de homologação e só então publicar. A revisão visual não revalida autorização OAuth, cobrança ou integrações externas.

Próximo bloco: **homologação visual cruzada e publicação controlada deste upgrade**, antes de adicionar novas features.

## Continuação: acabamento operacional

Na homologação foram reproduzidos e corrigidos dois defeitos que os testes de estilo não detectavam:

- Escape com Select aberto fechava também o formulário. Agora a primeira tecla recolhe a lista, conserva o preenchimento e mantém o foco no campo. A segunda fecha o diálogo.
- Em 320px, o texto do convite tinha 206px dentro de um botão com 168px úteis. O rótulo agora quebra em duas linhas, sem fonte menor, truncamento ou rodapé fora da tela. O botão de fechar conserva 44px mesmo com título longo.

O fundo do aplicativo fica inerte durante o modal e recupera seu estado ao fechar. O foco retorna ao botão de origem depois dessa liberação. A descrição visível passa a ser associada ao diálogo por `aria-describedby`, sem repetir texto na tela. A biblioteca vendorizada continua intacta.

Na versão de homologação, os campos de entrada foram medidos em 14px no celular. A moldura de entrada, cadastro e recuperação agora usa campos de 16px e controles de 48px, sem mudar o fluxo de autenticação.

Há testes de regressão de componente e uma matriz dedicada de 27 verificações em Chromium desktop, WebKit móvel e Firefox desktop, integrada ao CI. Ela cobre Escape, Tab, foco, tela curta, movimento reduzido, convite completo, leitura dos campos de entrada, estabilidade do cabeçalho de Projetos e análise automatizada de acessibilidade de Projetos e Suporte. A suíte local completa da continuação aprovou 1.785 testes, com as 34 exclusões pré-existentes preservadas.

**Limite:** a matriz é automação de navegador, não um teste em iPhone físico, VoiceOver ou uma certificação integral de acessibilidade. A publicação continua condicionada aos gates do repositório.
