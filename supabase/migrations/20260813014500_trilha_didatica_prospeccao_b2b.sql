-- Prepara o profissional para entregar uma lista B2B rastreável e aceita pelo
-- comercial. Os vídeos vêm das soluções equivalentes Prospecta.AI B2B e
-- Enriquecimento de Leads no CRM, já publicadas no Viver de IA.

update public.projeto_roteiros as roteiro
set
  roteiro = jsonb_set(
    roteiro.roteiro,
    '{trilhaDidatica}',
    $trilha$
    {
      "tempoTotal": "35 a 45 minutos antes de montar o primeiro lote",
      "aulas": [
        {
          "titulo": "Transforme o ICP em evidência pesquisável",
          "objetivo": "Sair de descrições vagas como empresa boa ou empresa grande e criar critérios que uma fonte consegue confirmar, negar ou manter como desconhecidos.",
          "duracao": "12 min",
          "topicos": [
            "Critérios de perfil, exclusões e sinais recentes tratados separadamente",
            "Campo observável, fonte possível e validade esperada para cada critério",
            "Exemplos positivos e negativos que reduzem interpretações diferentes"
          ],
          "exercicio": "Escolha cinco clientes aderentes e cinco contas que não deveriam entrar na lista. Compare os dois grupos e converta as diferenças em critérios observáveis, exclusões e sinais opcionais.",
          "prontoQuando": "Cada critério tem uma definição objetiva, uma fonte possível, exemplos, peso e comportamento explícito quando não houver evidência suficiente."
        },
        {
          "titulo": "Enriqueça sem perder origem, validade ou identidade",
          "objetivo": "Organizar busca, enriquecimento e deduplicação para que cada dado possa ser rastreado até a empresa certa e a fonte que o sustentou.",
          "duracao": "12 min",
          "topicos": [
            "Domínio, CNPJ e identificadores usados para impedir empresas duplicadas",
            "Fonte, URL, data de coleta e validade guardadas junto de cada campo",
            "Dados profissionais permitidos e lacunas que nunca devem ser completadas por suposição"
          ],
          "exercicio": "Pesquise a mesma empresa em duas fontes, normalize domínio e nome, compare divergências e registre qual valor será usado, com origem, data e motivo.",
          "prontoQuando": "Uma segunda pessoa consegue reconstruir cada campo do registro, identificar divergências e repetir a deduplicação sem depender da memória de quem montou a lista."
        },
        {
          "titulo": "Priorize, audite e entregue ao comercial",
          "objetivo": "Criar um score explicável, revisar uma amostra e enviar ao CRM somente contas que o time comercial entende e aceita trabalhar.",
          "duracao": "15 min",
          "topicos": [
            "Aderência ao perfil separada de sinal de momento ou intenção",
            "Cálculo aberto, evidência por critério e empate mantido quando faltam fatos",
            "Aceite, descarte e correção do comercial usados para calibrar o próximo lote"
          ],
          "exercicio": "Calcule manualmente o score de cinco empresas, peça a outra pessoa para repetir a conta e revise todos os casos em que as duas leituras não chegaram ao mesmo resultado.",
          "prontoQuando": "O comercial consegue abrir a conta, entender cada ponto do score, acessar as fontes e aceitar ou descartar sem descobrir um erro básico de identidade ou duplicidade."
        }
      ],
      "videosReferencia": [
        {
          "titulo": "Prospecta.AI B2B",
          "descricao": "Veja a solução de referência do Viver de IA para busca segmentada, coleta de empresas e preparação de uma lista B2B para exportação.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=ba62ae7e-10ee-4148-a4c6-5d049e437c43"
        },
        {
          "titulo": "Enriquecimento de Leads no CRM",
          "descricao": "Observe como dados da empresa, decisores e sinais públicos viram contexto organizado para o comercial, com o CRM como destino final.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=f4a54a84-9e8c-4eac-acc3-85399e0e0f8c"
        }
      ],
      "demonstracao": {
        "titulo": "De um ICP abstrato a vinte contas aceitas no CRM",
        "contexto": "Um prestador quer vender um SDR de IA para redes de clínicas odontológicas. Em vez de comprar uma base genérica, ele precisa encontrar empresas compatíveis, provar cada critério e entregar um primeiro lote que o comercial consiga usar.",
        "passos": [
          {
            "etapa": "ICP convertido em filtros",
            "oQueAcontece": "Redes com três ou mais unidades, atendimento por WhatsApp e presença em duas regiões entram como hipóteses pesquisáveis; clínicas individuais e franquias sem operação própria entram nas exclusões.",
            "evidencia": "Versão do ICP, critérios e exclusões"
          },
          {
            "etapa": "Empresas encontradas",
            "oQueAcontece": "As fontes retornam candidatas com nome, domínio e localização; cada consulta e cada limite do provedor ficam registrados para repetição do lote.",
            "evidencia": "Consulta, fonte e data de coleta"
          },
          {
            "etapa": "Identidade normalizada",
            "oQueAcontece": "Domínio, nome legal e identificadores disponíveis são normalizados antes do enriquecimento para impedir que filiais ou grafias diferentes virem empresas duplicadas.",
            "evidencia": "Chave de deduplicação e possíveis duplicatas"
          },
          {
            "etapa": "Conta enriquecida",
            "oQueAcontece": "Unidades, atividade, canais, decisores profissionais e sinais recentes são coletados com URL, data e validade; o que não aparece permanece desconhecido.",
            "evidencia": "Campo, valor, origem e coletado em"
          },
          {
            "etapa": "Score explicado",
            "oQueAcontece": "Cada critério recebe confirmado, não confirmado ou desconhecido. O score de perfil e os sinais de momento aparecem separados, com cálculo aberto.",
            "evidencia": "Critérios, pesos, evidências e soma"
          },
          {
            "etapa": "Lote aceito no CRM",
            "oQueAcontece": "Uma revisão humana remove erros, o comercial aceita ou descarta cada conta e somente as aprovadas entram no CRM com briefing e próxima ação ainda não executada.",
            "evidencia": "Decisão, motivo, responsável e destino"
          }
        ],
        "resultadoEsperado": "as vinte contas não têm duplicidade, cada dado importante abre sua fonte, o score pode ser refeito manualmente e o comercial entende por que trabalhar ou descartar cada empresa."
      },
      "materiais": [
        {
          "titulo": "Ficha de ICP observável",
          "quandoUsar": "No diagnóstico, para converter o cliente ideal em critérios que podem ser pesquisados e auditados.",
          "conteudo": "FICHA DE ICP OBSERVÁVEL\n\nOferta que será vendida:\nProblema que ela resolve:\nRecorte geográfico:\nTipo de empresa:\n\nCRITÉRIOS DE PERFIL\nCritério | Definição objetiva | Campo observável | Fonte possível | Peso | Se faltar evidência\n\n1. Critério:\nDefinição:\nCampo observável:\nFonte:\nPeso:\nSe faltar:\n\nEXCLUSÕES\nCondição | Como identificar | Fonte | Motivo da exclusão\n\nSINAIS DE MOMENTO\nSinal | Janela de validade | Fonte | Efeito na prioridade\n\nEXEMPLOS DE CALIBRAÇÃO\nCinco empresas aderentes:\nPor que cada uma entra:\nCinco empresas não aderentes:\nPor que cada uma não entra:\n\nVersão do ICP:\nResponsável pela aprovação:\nData da próxima revisão:"
        },
        {
          "titulo": "Matriz de fontes e dados",
          "quandoUsar": "Na preparação, para definir de onde vem cada campo, quanto custa e quando deixa de ser confiável.",
          "conteudo": "MATRIZ DE FONTES E DADOS\n\nCampo | Fonte primária | Fonte alternativa | Identificador | Validade | Custo | Limite | Uso permitido | Se falhar\n\nEMPRESA\nNome legal:\nNome comercial:\nDomínio:\nCNPJ ou identificador:\nSegmento:\nPorte:\nLocalização:\nNúmero de unidades:\nTecnologias ou canais:\n\nPESSOA PROFISSIONAL\nNome:\nCargo:\nÁrea:\nPerfil profissional:\nE-mail corporativo:\nTelefone corporativo:\n\nCONTROLE\nComo registrar URL de origem:\nComo registrar data de coleta:\nRegra de dado divergente:\nRegra de dado expirado:\nRegra de opt-out ou remoção:\nCusto máximo por conta:\nResponsável pelas fontes:"
        },
        {
          "titulo": "Calculadora de score explicável",
          "quandoUsar": "Antes do primeiro lote, para tornar a prioridade reproduzível e separar aderência de sinal de momento.",
          "conteudo": "CALCULADORA DE SCORE EXPLICÁVEL\n\nCONTA:\nDATA DA ANÁLISE:\nVERSÃO DO ICP:\n\nSCORE DE PERFIL\nCritério | Peso | Status: confirmado, não confirmado ou desconhecido | Evidência | Pontos\n1.\n2.\n3.\n4.\n5.\nSubtotal de perfil:\n\nSINAIS DE MOMENTO\nSinal | Peso | Data do sinal | Validade | Evidência | Pontos\n1.\n2.\nSubtotal de momento:\n\nRESULTADO\nScore de perfil:\nScore de momento:\nFaixa de prioridade:\nCritérios desconhecidos:\nMotivo resumido:\nRequer revisão humana?\n\nREGRAS\nAusência de evidência não soma pontos.\nPerfil e momento não são misturados.\nEmpate permanece empate sem novo fato.\nTodo ponto precisa abrir a fonte correspondente."
        },
        {
          "titulo": "Auditoria do primeiro lote",
          "quandoUsar": "Na validação, para revisar identidade, aderência, contato e rastreabilidade antes de enviar ao CRM.",
          "conteudo": "AUDITORIA DO PRIMEIRO LOTE\n\nConta | Domínio correto? | Duplicada? | ICP confirmado? | Decisor confirmado? | Fontes abrem? | Dados válidos? | Score confere? | Decisão | Motivo | Correção\n\nAMOSTRA MÍNIMA\n[ ] Revisar as vinte primeiras contas\n[ ] Recalcular manualmente cinco scores\n[ ] Abrir todas as fontes das cinco maiores prioridades\n[ ] Conferir possíveis duplicatas por domínio e identificador\n[ ] Confirmar cargo e vínculo profissional dos decisores\n[ ] Verificar se dado desconhecido permaneceu desconhecido\n[ ] Remover informação pessoal ou sem uso permitido\n\nMEDIDAS\nContas recebidas:\nContas únicas:\nContas aderentes:\nContas com decisor confirmado:\nContas com fonte completa:\nFalsos positivos:\nCusto total e por conta aceita:\n\nAprovado por:\nPendências:\nData do reteste:"
        },
        {
          "titulo": "Pacote de passagem ao CRM",
          "quandoUsar": "Na entrega, para enviar somente contas aceitas com contexto suficiente e sem iniciar contato automaticamente.",
          "conteudo": "PACOTE DE PASSAGEM AO CRM\n\nEMPRESA\nNome:\nDomínio:\nIdentificador:\nSegmento e porte:\nLocalização:\nResumo factual da atividade:\n\nADERÊNCIA\nCritérios confirmados:\nCritérios não confirmados:\nCritérios desconhecidos:\nScore de perfil e cálculo:\n\nMOMENTO\nSinais recentes:\nData e validade dos sinais:\nScore de momento e cálculo:\n\nPESSOA PROFISSIONAL\nNome:\nCargo e área:\nFonte do vínculo:\nContato corporativo permitido:\n\nBRIEFING\nPor que esta conta entrou no lote:\nFatos que podem orientar a conversa:\nHipótese explicitamente rotulada:\nPergunta de abertura sugerida:\nRiscos ou lacunas:\nFontes principais:\n\nOPERAÇÃO\nDecisão do comercial: aceitar ou descartar\nMotivo da decisão:\nResponsável:\nPróxima ação sugerida, ainda não executada:\nData para revisar dados:\nOrigem e versão do lote:"
        }
      ]
    }
    $trilha$::jsonb,
    true
  ),
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'maquina-prospeccao-b2b';

-- Mantém o vídeo principal coerente com a solução de referência para qualquer
-- tela de fallback; a página guiada usa os dois vídeos da trilha.
update public.solucoes
set video_url = 'https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=ba62ae7e-10ee-4148-a4c6-5d049e437c43'
where slug = 'maquina-prospeccao-b2b';
