# Plano mestre do produto — Viver de IA Subido

## Decisão central

O produto não é uma área de cursos com ferramentas anexadas. É o **sistema operacional do
prestador de serviços de IA**: o lugar onde ele aprende, encontra oportunidades, vende, executa,
registra resultados e melhora o próprio método.

A navegação, os dados e a IA seguem uma única jornada:

1. **Aprender** — ganhar repertório e escolher o primeiro serviço.
2. **Prospectar** — localizar, enriquecer e qualificar oportunidades.
3. **Vender** — conduzir calls, diagnosticar e apresentar a proposta.
4. **Entregar** — executar um projeto passo a passo com evidências.
5. **Evoluir** — transformar resultados em método, recorrência e escala.

O Mapa da Jornada é a tela inicial e o orientador desse sistema. Ele não é um dashboard de
atalhos: mostra o marco atual, os fatos que sustentam a recomendação e a próxima ação.

## Arquitetura funcional

| Camada      | Módulo                 | Responsabilidade                                                         |
| ----------- | ---------------------- | ------------------------------------------------------------------------ |
| Orientação  | Mapa da Jornada        | Detectar momento, mostrar marco, checklist e próximo passo               |
| Orientação  | Sobral AI              | Orientar o profissional com contexto de CRM, calls, projetos e formação  |
| Comercial   | CRM factual            | Leads, contatos, empresas, pipeline Kanban, tarefas e histórico imutável |
| Comercial   | Calls                  | Link de reunião, participantes, gravação, transcrição e fatos extraídos  |
| Comercial   | Live Coach             | Recomendações em tempo real durante a reunião comercial                  |
| Comercial   | Enriquecimento         | Completar contexto de empresa e contato com fonte e confiança            |
| Comercial   | Propostas              | Montar, versionar, gerar PDF, enviar e acompanhar proposta               |
| Entrega     | Projetos               | Cinco playbooks padrão, profundos e executáveis passo a passo            |
| Entrega     | Estúdio                | Transformar dores reais em projeto personalizado e proposta comercial    |
| Formação    | Formações              | Educação estruturada por competência profissional                        |
| Formação    | Mentorias              | Sessões ao vivo, agenda, inscrição e histórico                           |
| Formação    | Certificados           | Evidência verificável das competências concluídas                        |
| Diagnóstico | Auditor de Atendimento | Testar o atendimento do cliente e gerar relatório comercializável        |

## A espinha dorsal dos dados

O maior ativo não é a tela do CRM nem a gravação isolada. É a **linha do tempo factual** que une
tudo o que aconteceu com uma oportunidade ou cliente.

Entidades principais:

- `workspace` — operação do profissional;
- `empresa`, `contato`, `lead` e `oportunidade` — contexto comercial;
- `etapa_pipeline`, `tarefa` e `evento` — estado atual e histórico;
- `reuniao`, `participante`, `gravacao`, `transcricao` e `fato_extraido` — memória das calls;
- `proposta` e `versao_proposta` — documento comercial e seu histórico;
- `projeto_modelo`, `projeto_cliente`, `etapa_projeto` e `evidencia` — entrega padrão ou customizada;
- `formacao`, `aula`, `progresso`, `mentoria` e `certificado` — evolução profissional;
- `recomendacao_ia` — sugestão com origem, confiança, status e feedback humano.

Regra: toda automação relevante grava um `evento`. O Kanban é uma visão do estado atual; a linha
do tempo é a prova de como ele chegou ali. Transcrição nunca atualiza o CRM de maneira opaca:
primeiro gera fatos rastreáveis, depois aplica as mudanças permitidas.

## Os cinco projetos iniciais

1. **Atendimento inteligente no WhatsApp**
   - triagem, respostas, handoff humano, base de conhecimento e métricas;
   - fácil de diagnosticar e demonstrar antes da venda.

2. **Prospecção e qualificação de leads com IA**
   - captura, enriquecimento, priorização, pesquisa e preparação de abordagem;
   - conecta diretamente CRM, enriquecimento e geração de oportunidade.

3. **Operação comercial com IA**
   - preparação de calls, Live Coach, follow-up, proposta e atualização automática do CRM;
   - prova o valor da plataforma dentro da própria venda do profissional.

4. **Máquina de conteúdo e marketing com IA**
   - pesquisa, planejamento, produção, revisão, distribuição e reaproveitamento;
   - projeto recorrente, visual e fácil de adaptar a diferentes negócios.

5. **Assistente interno de conhecimento e operações**
   - busca segura em documentos, rotinas, suporte interno e automações controladas;
   - projeto com maior profundidade e ponte para entregas personalizadas no Estúdio.

Cada projeto precisa conter: resultado esperado, pré-requisitos, diagnóstico, escopo, promessa
permitida, arquitetura, ferramentas, estimativa, roteiro comercial, proposta-base, implementação
passo a passo, testes, aceite, treinamento, métricas, manutenção e oportunidades de expansão.

## Reuso das plataformas existentes

O reuso deve ocorrer no nível de **motores e padrões**, não por cópia integral das interfaces.

| Referência             | O que reaproveitar                                                   | O que não carregar                                              |
| ---------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| Plataforma Viver de IA | formações, mentorias, certificados, autorização, padrões Supabase    | aparência que gere confusão entre produtos                      |
| CRM/Calls Viver de IA  | reunião, gravação, transcrição, análise, timeline, pipeline, tarefas | monólito antigo, dependências n8n e acoplamentos desnecessários |
| Projeto Subido atual   | base Next/Supabase, conteúdo, Estúdio, Sobral AI, design tokens      | nomenclaturas antigas e início como catálogo de atalhos         |

Integrações novas devem ser diretas e encapsuladas por adaptadores. O produto não dependerá de
Make ou n8n.

## Blocos de construção

### Bloco 0 — fundação de produto e interface

- Mapa da Jornada como início;
- nova nomenclatura e navegação;
- modelo de `workspace` e eventos preparado para os próximos módulos;
- direção visual minimalista, ilustrativa e própria.

### Bloco 1 — núcleo comercial

- empresas, contatos, leads, oportunidades, tarefas e pipeline;
- linha do tempo factual;
- enriquecimento com fonte e nível de confiança.

### Bloco 2 — calls e inteligência

- agendamento/link, sala, participantes, gravação e transcrição;
- extração de fatos, resumo, próximos passos e atualização assistida do CRM;
- Live Coach em tempo real.

### Bloco 3 — proposta e venda

- diagnóstico estruturado a partir das calls;
- editor de proposta, versões, PDF e acompanhamento;
- conexão entre proposta, oportunidade e projeto vendido.

### Bloco 4 — entrega guiada

- modelo profundo dos cinco projetos iniciais;
- execução com checklist, responsáveis, evidências e aceite;
- Estúdio transforma contexto do cliente em projeto customizado e proposta.

### Bloco 5 — orientação e evolução

- Sobral AI usa fatos de toda a plataforma;
- roadmap individual, mentorias, formações e certificados conectados aos marcos;
- auditor de atendimento após a espinha dorsal comercial estar estável.

## Restrições de produto

- Não incluir nesta fase lançamento, preço, plano, oferta ou regras comerciais do colab.
- Não inventar números, atividades ou clientes na experiência real.
- Não executar mudanças automáticas irreversíveis sugeridas pela IA sem confirmação humana.
- Não misturar dados entre workspaces.
- Não tratar transcrição como verdade absoluta: fatos precisam de origem, trecho e confiança.
- Não abrir frentes independentes sem antes conectar o fluxo principal ponta a ponta.

## Direção visual aprovada

A opção escolhida é o **Mapa da Jornada ilustrado**: sidebar navy, canvas claro, trilha
topográfica, cinco marcos e três painéis operacionais (Sobral AI, checklist, hoje). A ilustração
serve à orientação; não é ornamento. O accent azul continua pontual, o desenho é leve e os cards
têm baixa elevação.
