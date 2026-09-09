# Central de ajuda: plano de evolução

Data: 9 de setembro de 2026.
Status: blocos 1 a 4 implementados e fluxo de e-mail validado no domínio público.

Evidências: [validação de produção](validacao-suporte-2026-09-09.md). A meta experimental de 60 segundos não é uma promessa: recebimento medido entre 4 e 63 segundos no cron normal, e a saída também aguarda sua fila. Não foi feita certificação de capacidade ou garantia de entrega em qualquer caixa.

Implementação: conversa única, rascunhos separados, fila por espera, respostas e notas privadas, entrada de e-mail autenticada, configuração da equipe, indicadores e guia ilustrado. A referência operacional atual é [Central de suporte](central-suporte.md). O diagnóstico abaixo registra o ponto de partida, não as limitações da versão nova.

## Direção

O cliente precisa conseguir pedir ajuda, receber uma resposta e retomar o trabalho.
A equipe precisa enxergar quem está esperando, assumir o atendimento e resolver o problema.
Plataforma e e-mail devem alimentar a mesma conversa.

Não criar outro sistema de tickets: evoluir a base existente, com menos esforço para os dois lados.

## Diagnóstico inicial (antes da execução)

Revisão do código em `eb14087` e confirmação de que esse commit é a versão ativa no domínio público.
Não foi executado um novo atendimento real, nem uma nova rodada de entrega de e-mails nesta revisão.

| Área          | Já existe                                                                         | O que precisa evoluir                                                    |
| ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Central       | Busca, guias, FAQ, IA e acesso direto à equipe                                    | Dar mais destaque a pedidos com resposta e reduzir caminhos concorrentes |
| Abrir pedido  | Formulário, protocolo, categoria, página de origem e anexos privados              | Menos decisões, rascunho recuperável e confirmação clara                 |
| Acompanhar    | Conversa, quatro estados, reabertura e avaliação                                  | Não lidos visíveis, próxima ação e atualização sem atrapalhar a escrita  |
| Administração | Aba Suporte, fila, responsáveis, prioridade, respostas e notas internas           | Fila orientada à espera, controles seguros de resposta e contexto útil   |
| E-mail        | Avisos, confirmação de acesso, fila de envio, tentativas e conciliação de entrega | Receber respostas por e-mail dentro do mesmo atendimento                 |
| Equipe        | Agentes com permissão própria e configuração de avisos                            | Distribuição clara e proteção contra atendimento duplicado               |
| IA e conteúdo | Respostas baseadas em guias publicados; transferência revisada pelo usuário       | Resumo útil para a equipe e melhoria contínua dos guias                  |

### Lacunas específicas observadas no código

- O e-mail atual diz expressamente para responder pela plataforma. Não há `Reply-To` de atendimento nem processamento de `email.received` neste fluxo.
- Os horários de leitura são armazenados, mas a lista não os usa para destacar respostas novas. O registro de leitura da equipe é compartilhado, não individual por agente.
- A fila ordena pela atualização mais recente. Um pedido antigo sem resposta pode ficar abaixo de pedidos menos urgentes.
- Uma resposta pública da equipe muda automaticamente para “Aguardando você”, mesmo quando é apenas “estamos investigando”. A ação seguinte deve ser explícita.
- O texto digitado no formulário é preservado em uma falha na mesma página, mas não é salvo como rascunho a cada edição. O armazenamento de sessão atual recebe principalmente o conteúdo transferido da IA.
- A transferência da IA concatena mensagens. Não organiza problema, tentativas e dúvida pendente.
- `/admin/suporte` já existe e redireciona para a fila. Não é necessário inventar uma segunda área administrativa.
- Há registros de primeira resposta, resolução e reaberturas no banco. Podemos reutilizá-los, validando sua semântica, antes de criar novas métricas.

## Objetivos e limites

1. Chegar ao formulário em um clique a partir da central, sem falar com IA primeiro.
2. Abrir o pedido com dois campos essenciais e sem redigitar dados da conta.
3. Permitir que o cliente responda na plataforma ou pelo e-mail, mantendo um protocolo.
4. Mostrar para a equipe quem espera uma ação dela, sem confundir leitura com resolução.
5. Preservar mensagens, privacidade e contexto mesmo em falhas de rede ou de e-mail.

Suporte continua gratuito em todos os planos. A IA ajuda a usar o produto; Sobral AI continua sendo o consultor para aprender, vender e entregar projetos de IA.

Fora deste ciclo: WhatsApp, central telefônica, aplicativos externos de atendimento, dezenas de status, construtor de automações, cobrança de suporte e mudanças automáticas de conta feitas pela IA.

## Experiência proposta

### Cliente

`Ajuda → Pedir ajuda → Conversa → Resolvido`

- Na central: busca, “Pedir ajuda” e “Meus atendimentos”. Quando existir resposta nova, ela ganha prioridade sobre o catálogo de guias.
- No formulário: “O que você precisa resolver?” e “Conte o que aconteceu”. Anexos opcionais. A categoria é sugerida pela página de origem e pode ser alterada sem bloquear o envio.
- Identidade vem da sessão; página de origem sem parâmetros, horário e identificador de erro quando disponível. Nada de capturar tela, áudio, conteúdo comercial ou dados de terceiros silenciosamente.
- Após enviar: “Pedido recebido”, protocolo e conversa. Informar o canal de resposta, sem prometer prazo não configurado.
- Na conversa: mensagem nova destacada, resposta em destaque, anexos acessíveis e “Marcar como resolvido” / “Reabrir atendimento”. Detalhes secundários recolhidos no celular.
- Acesso bloqueado: preservar o caminho público com verificação de e-mail. Não vincular automaticamente pedidos públicos a contas pelo simples texto do endereço informado.

### Equipe

`Administração → Suporte → Precisa de resposta → Responder`

- Filtros úteis: “Precisa de resposta”, “Meus”, “Sem responsável” e “Resolvidos”. Categoria, prioridade e demais filtros ficam como refinamento.
- Cada linha: assunto, cliente, tempo de espera, responsável e estado. Uma prévia curta da última mensagem pública, sem o corpo inteiro do ticket.
- Dentro do atendimento: conversa principal e painel compacto com cliente, origem, responsável e prioridade. Nenhum acesso irrestrito a todas as fichas e documentos do usuário.
- Separar visualmente “Responder ao cliente” de “Nota interna”. A nota nunca gera e-mail ao cliente.
- Ao responder, escolher o resultado: manter em atendimento, aguardar informação do cliente ou resolver. Não transformar toda resposta em pendência do usuário.
- Configuração de equipe e avisos fora do caminho de trabalho diário. Preservar o papel de agente sem dar privilégios gerais de administrador.

### Estados: manter os quatro atuais

| Estado          | Quem precisa agir | Regra                                                        |
| --------------- | ----------------- | ------------------------------------------------------------ |
| Recebido        | Equipe            | Pedido confirmado ainda sem atendimento iniciado             |
| Em atendimento  | Equipe            | Equipe está respondendo ou investigando                      |
| Aguardando você | Cliente           | Equipe pediu uma informação ou ação explícita                |
| Resolvido       | Ninguém           | Solução registrada; nova resposta do cliente reabre o pedido |

Estado do atendimento, mensagem não lida e entrega de e-mail são informações diferentes. “A equipe abriu” não significa “resolvido”; “e-mail entregue” não significa “cliente leu”.

## Blocos de execução

### Bloco 1 — Ticket e atendimento com acabamento completo · P0

**Entregas**

- Refinar central, formulário, lista e conversa usando os componentes existentes.
- Dar destaque às respostas novas na central e em “Meus atendimentos”, sem criar notificações globais genéricas.
- Rascunho por usuário e atendimento, recuperável durante a sessão, limpo após envio/logout; arquivos não ficam armazenados no navegador como conteúdo bruto.
- Ordenação por necessidade de resposta e tempo de espera; prioridade é um critério explícito, não apenas cor.
- Diferenciar resposta pública de nota interna e permitir responder com o estado final escolhido em uma única operação.
- Mostrar responsável e proteger atribuição contra sobrescrita silenciosa quando dois agentes assumirem juntos.
- Usar o último identificador de mensagem efetivamente exibido para leitura. Notas internas, ações próprias e simples alterações de estado não podem criar falsos avisos de resposta nova.
- Identificar o autor da equipe pelo nome de exibição autorizado, mantendo a marca “Equipe Subido” como fallback.

**Aceite**

- Cliente abre pedido, recebe protocolo, acompanha a resposta, resolve, avalia e reabre sem sair da jornada.
- Admin abre a fila pela Administração, assume, responde e usa nota interna. Agente de suporte faz isso sem acesso à administração financeira.
- Falha de envio preserva o texto; retry não duplica mensagem ou anexos. Falha incerta é reconciliada antes de confirmar sucesso.
- Um agente lendo não apaga a obrigação da equipe de responder. Aviso individual, se necessário, não usa a leitura compartilhada como fonte.
- Responder “estamos investigando” mantém a responsabilidade com a equipe.
- Navegação por teclado, foco, leitor de tela e celular não exigem rolagem dentro de pequenos painéis ou diálogos cortados.

### Bloco 2 — E-mail e plataforma na mesma conversa · P0

**Entregas**

- Habilitar recebimento usando Resend e um subdomínio exclusivo de suporte, após verificar a configuração atual. Não alterar os MX do e-mail corporativo existente.
- Remetente “Equipe Subido”, identidade visual leve, versão texto e botão “Ver atendimento”. Protocolo estável no assunto.
- Nas respostas públicas, incluir somente a nova mensagem da equipe e o link do atendimento; não anexar todo o histórico nem notas internas. Arquivos continuam privados na plataforma.
- Endereço de resposta específico por atendimento, com identificador opaco. A resposta do cliente entra na conversa com indicação “Recebida por e-mail”.
- Continuar o encadeamento de mensagens usando os identificadores de e-mail; não localizar tickets apenas pelo número escrito no assunto.
- Mensagens novas dirigidas ao endereço geral de suporte também podem abrir pedido, mas só entram na fila após verificação do remetente. Spam e robôs não criam tickets ilimitados.
- Avisar a equipe responsável, com cobertura para pedidos sem dono. Suprimir avisos redundantes e nunca criar loops com respostas automáticas.
- Mostrar falhas de entrega e tentativas no admin. Não ocultar a mensagem salva porque seu e-mail falhou.

**Segurança e confiabilidade obrigatórias**

- Verificar assinatura do provedor, destinatário do ticket e remetente autorizado; `From` e número de protocolo isolados não são autenticação.
- Identificador opaco de resposta não dá acesso de leitura. Mensagens de remetente diferente ou autenticidade inconclusiva ficam em revisão/verificação, sem revelar o ticket.
- Confirmação de recebimento do webhook somente após persistência durável. Processamento em fila, deduplicação por evento e identificador do provedor, reprocessamento seguro e acompanhamento de atrasos.
- Remover HTML ativo e rastreadores; separar assinatura e texto citado sem destruir o conteúdo original necessário ao atendimento.
- Validar tamanho, tipo e conteúdo dos anexos antes de disponibilizar. Quando um arquivo for rejeitado, manter a mensagem e explicar como enviar um formato aceito. Não buscar URLs arbitrárias recebidas no corpo do e-mail.
- Não adicionar pessoas em cópia como participantes automaticamente; endereço corporativo igual não concede acesso aos pedidos de terceiros.
- Resposta recebida depois da resolução reabre o ticket uma única vez. Evento de entrega atrasado não reverte uma devolução.

**Aceite**

- Pedido na plataforma → resposta do admin → recebimento em caixa de teste → resposta pelo e-mail → mesma conversa no Subido → nova resposta do admin encadeada.
- Validar recebimento real em caixas controladas de Google e Microsoft, além dos testes do provedor. Não prometer ausência de spam com base apenas em `delivered`.
- Testar duplicidade, reordenação, indisponibilidade, resposta automática, remetente indevido, anexo rejeitado e falha permanente.
- Meta técnica de aceite: mensagem incorporada em até 60 segundos em condições normais nos cenários controlados; medir e ajustar antes de prometer isso publicamente.
- Capacidade de envio/recebimento, domínio e limites da conta verificados antes de habilitar para todos. Prever desligar o recebimento e voltar ao link da plataforma sem perder eventos já recebidos.

O Resend documenta recebimento e resposta encadeada. A adoção proposta reutiliza o fornecedor atual, mas a disponibilidade/configuração de recebimento desta conta ainda precisa ser validada. Referências: [recebimento](https://resend.com/docs/dashboard/receiving/introduction), [domínio dedicado](https://resend.com/docs/dashboard/receiving/custom-domains) e [respostas encadeadas](https://resend.com/docs/dashboard/receiving/reply-to-emails).

### Bloco 3 — Guias e IA que reduzem esforço · P1

**Entregas**

- Guias com passos curtos, capturas reais recortadas, ação direta e data de revisão. Não inventar fluxos que a plataforma ainda não oferece.
- Priorizar acesso, Agenda, créditos, enriquecimento, propostas, entregas e certificados pelos pedidos reais, não pela quantidade de artigos.
- No formulário, sugerir no máximo dois guias relacionados sem bloquear o ticket ou apagar seu rascunho.
- Transferência da IA organizada em “Problema”, “O que já foi tentado” e “O que falta resolver”, revisada pelo cliente antes do envio. Perguntas do usuário e sugestões da IA permanecem distinguíveis.
- Rascunhos de respostas para a equipe com fontes dos guias; envio sempre revisado por uma pessoa. Nenhuma resolução automática por inferência.
- Sugestão de novo guia a partir de problemas recorrentes, anonimizada e aprovada pelo admin antes de publicação.

**Aceite**

- Toda orientação de produto aponta para um guia publicado ou declara a limitação e oferece a equipe.
- Se a IA falhar ou atingir limite, o ticket continua disponível e gratuito.
- A IA não declara que consultou saldo, alterou plano, conectou agenda ou corrigiu uma conta sem executar uma operação autorizada. Essas operações não fazem parte deste bloco.
- O cliente não precisa repetir sua dúvida na passagem para a equipe e pode remover informações antes de compartilhá-las.

### Bloco 4 — Gestão, monitoramento e revisão final · P1

**Entregas**

- Configurar responsáveis, cobertura e horário real de atendimento. Definir metas internas por prioridade antes de publicar compromissos ao cliente.
- Métricas enxutas: pedidos aguardando equipe, tempo de primeira resposta humana, tempo de resolução, reabertura e satisfação. Separar espera pelo cliente da espera pela equipe e mostrar tamanho da amostra.
- Alertas para fila sem responsável, pedido parado e falhas persistentes de e-mail. Incidente conhecido aparece apenas quando realmente registrado e atualizado pela equipe.
- Reaproveitar eventos e tabelas existentes; adicionar histórico de transições apenas onde os dados atuais não permitem medir os ciclos corretamente.
- Rotina de revisão de guias, acesso de agentes, retenção e exclusão de dados. Não adotar prazo de retenção ou promessa jurídica sem revisão da política do produto.
- Ensaio completo com cliente comum, agente, admin e usuário sem login, sem disparar mensagens para usuários reais durante QA.

**Aceite**

- Um pedido não some da fila por ter sido lido ou por uma notificação falhar.
- Primeira resposta humana não conta confirmação automática, IA ou nota interna.
- Retirada de permissão impede novos acessos do agente imediatamente, inclusive em links de anexos.
- Logs técnicos não contêm senha, token, corpo do ticket ou arquivo. Alertas levam ao registro protegido.
- Isolamento entre usuários, notas internas e arquivos privados testado nas rotas e no banco.
- Evidência final reúne versão publicada, testes de jornada, e-mails recebidos e capturas desktop/mobile. Deploy sozinho não fecha o bloco.

## Direção visual transversal

- Canvas branco/frio, navy para ações e texto. Liquidglass discreto em superfícies de navegação, formulário e painéis; leitura de mensagens em fundo estável e contrastante.
- Geist e tokens oficiais. Texto principal de conversa confortável, preferencialmente 16–17 px; rótulos 14–15 px, metadados a partir de 13 px. Não reduzir fonte para fazer caber.
- Uma ação principal por contexto. Categorias não viram uma parede de cards. Dados operacionais não viram grandes placares decorativos.
- Esquinas, sombras, estados de foco e ícones seguem o DS. Sem círculos de fundo, amarelo, brilhos de IA, texto escuro sobre navy ou barras laterais sem função.
- No desktop, fila legível e conversa com detalhes laterais discretos. No celular, lista e conversa em telas próprias, detalhes recolhíveis e compositor acessível ao teclado virtual.
- Carregamento local, confirmação explícita, arquivo em processamento e falha com retry. Sem porcentagens fictícias ou apagar a tela toda a cada atualização.
- Validar larguras de 375, 768, 1280 e 1920 px, zoom de 200%, teclado, foco e movimento reduzido; contraste AA e fallback de vidro sem blur.

## Métricas de sucesso

| Medida                  | Definição                                    | Critério inicial                                                          |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| Esforço de abertura     | Navegação da central até o formulário        | Um clique; dois campos essenciais                                         |
| Confiança no envio      | Pedido/mensagem persistidos, retries e erros | Zero duplicatas ou perdas nos testes de falha                             |
| Continuidade por e-mail | Respostas legítimas ligadas ao ticket certo  | Todos os cenários de aceite; nenhum vazamento entre tickets               |
| Resposta e resolução    | Tempos reais, mediana e percentil 90         | Coletar base antes de definir metas humanas                               |
| Qualidade da ajuda      | Avaliação, reaberturas e utilidade dos guias | Medir com amostra explícita; não confundir ausência de ticket com solução |

## Ordem e dependências

1. Bloco 1 estabelece a conversa e a fila corretas. A preparação de domínio do bloco 2 pode ser verificada sem alterar DNS.
2. Bloco 2 conecta entrada e saída de e-mail usando a mesma lógica de mensagens e estados.
3. Bloco 3 melhora resolução e passagem de contexto sobre uma jornada já confiável.
4. Bloco 4 consolida operação e aceite. Segurança, monitoramento mínimo e testes acompanham todos os blocos; não ficam para o fim.

**Escolhas da operação, sem bloquear o início:** quem atende e substitui quem, horários/fuso, prazo humano que a equipe consegue cumprir e política de retenção. Responsável: Rafael/equipe. Até serem definidos, não exibir “24 horas”, “resposta imediata” ou prazo inventado.

**Verificações técnicas:** configuração de recebimento no Resend, subdomínio disponível, autenticação de remetente, limites, permissões e contas de teste. Responsável: execução técnica automática, sem expor segredos nem pedir credenciais antes de procurar as conexões existentes.

## Mapa para implementação

- Central e tickets: `src/components/suporte/`.
- Contratos e ações: `src/lib/suporte/contrato.ts`, `actions.ts`, `servidor.ts`.
- E-mail atual: `src/lib/suporte/notificacoes.ts`, `src/app/api/resend/webhook/route.ts` e cron de suporte.
- Administração: `src/app/(app)/admin/suporte/page.tsx` e `src/app/(app)/suporte/equipe/`.
- Dados: migrações `20260909*_suporte*` e `20260909023544_central_suporte.sql`; alterações futuras em novas migrações.
- Referência existente: `docs/central-suporte.md`.

Os quatro blocos foram executados sobre a central existente. O encerramento depende da publicação verificada e do percurso real de e-mail, não apenas dos testes locais.
