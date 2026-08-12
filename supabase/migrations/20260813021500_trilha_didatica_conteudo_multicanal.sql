-- Ensina a entregar uma operação editorial baseada em fontes, com adaptação real
-- por canal e aprovação humana. Os vídeos vêm de SocialMedia AI e Blog Post 4.0,
-- soluções já publicadas no Viver de IA.

update public.projeto_roteiros as roteiro
set
  roteiro = jsonb_set(
    roteiro.roteiro,
    '{trilhaDidatica}',
    $trilha$
    {
      "tempoTotal": "35 a 45 minutos antes da primeira pauta",
      "aulas": [
        {
          "titulo": "Comece pela fonte, não pelo prompt",
          "objetivo": "Transformar falas, documentos, cases e dados aprovados da empresa em matéria-prima rastreável antes de pedir qualquer texto à IA.",
          "duracao": "12 min",
          "topicos": [
            "Origem, autoria, permissão, data e validade registradas em cada fonte",
            "Fato, fala, opinião e hipótese separados antes da redação",
            "Número, case e experiência proibidos quando não houver prova aprovada"
          ],
          "exercicio": "Escolha uma transcrição própria e um documento aprovado. Extraia dez fragmentos úteis e marque em cada um o tipo de evidência, a origem e o que ainda precisa de confirmação humana.",
          "prontoQuando": "Cada afirmação utilizável abre a fonte correspondente, tem contexto suficiente e não depende da IA para completar um nome, número, resultado ou experiência."
        },
        {
          "titulo": "Converta evidência em decisão editorial",
          "objetivo": "Escolher uma tese específica, a prova que a sustenta e a consequência prática para um público definido, evitando pautas genéricas.",
          "duracao": "12 min",
          "topicos": [
            "Tensão concreta do público e opinião que a empresa realmente defende",
            "Tese, prova e consequência ligadas sem salto lógico",
            "Ângulos derivados da mesma fonte sem repetir a mesma peça"
          ],
          "exercicio": "A partir do pacote de fontes, escreva três teses diferentes. Para cada uma, cite a prova, a consequência e a pergunta que a peça deve responder; descarte as que continuarem verdadeiras sem a fonte.",
          "prontoQuando": "A pauta deixa claro para quem fala, o que afirma, qual evidência sustenta a afirmação e o que a pessoa deve entender ou decidir depois."
        },
        {
          "titulo": "Adapte, aprove e aprenda por canal",
          "objetivo": "Transformar a mesma tese em peças nativas de cada canal, preservar o sentido e fechar um ciclo de aprovação e leitura de resultado.",
          "duracao": "15 min",
          "topicos": [
            "Contrato de formato, voz, abertura e chamada específico para cada canal",
            "Versão, fonte e aprovação explícita preservadas até a publicação",
            "Métrica de atenção, resposta e ação lida no contexto de cada formato"
          ],
          "exercicio": "Adapte uma pauta para LinkedIn e e-mail. Depois compare abertura, profundidade, ritmo e chamada, confirmando que tese e prova continuam iguais apesar da forma diferente.",
          "prontoQuando": "As versões parecem pertencer aos seus canais, passam pelo checklist factual e de voz e nenhuma delas pode ser publicada sem responsável, versão e aprovação registrados."
        }
      ],
      "videosReferencia": [
        {
          "titulo": "SocialMedia AI",
          "descricao": "Veja a solução de referência do Viver de IA para organizar pesquisa, referências e produção de roteiros para redes sociais.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=7bbb80ed-1f25-45a9-af1d-8981189f9b6a"
        },
        {
          "titulo": "Blog Post 4.0",
          "descricao": "Observe uma operação editorial com pesquisa, rascunhos, calendário e estados de publicação funcionando como sistema.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=b0a06c65-f5fe-4377-95ca-8881f47d2dae"
        }
      ],
      "demonstracao": {
        "titulo": "De duas fontes aprovadas a oito peças publicáveis",
        "contexto": "Uma empresa B2B gravou uma conversa de quarenta minutos com o fundador e possui um case aprovado. O objetivo é transformar esse material em quatro peças para LinkedIn e quatro e-mails sem inventar opinião, resultado ou experiência.",
        "passos": [
          {
            "etapa": "Fontes registradas",
            "oQueAcontece": "Transcrição e case entram na biblioteca com autoria, permissão, data, contexto, trechos sensíveis e responsável pela validação.",
            "evidencia": "Fonte, versão, permissão e proprietário"
          },
          {
            "etapa": "Pacote factual extraído",
            "oQueAcontece": "Falas, números, argumentos, objeções e aprendizados são separados; cada fragmento preserva página, minuto ou trecho de origem.",
            "evidencia": "Fragmento, tipo e localização na fonte"
          },
          {
            "etapa": "Mapa editorial decidido",
            "oQueAcontece": "Quatro tensões do público viram quatro combinações de tese, prova e consequência. Ideias sem prova ou posição própria são descartadas.",
            "evidencia": "Público, tensão, tese, prova e consequência"
          },
          {
            "etapa": "Peças de origem escritas",
            "oQueAcontece": "Cada ângulo recebe um texto-base fiel à voz aprovada, com marcação clara de qualquer lacuna que ainda dependa do porta-voz.",
            "evidencia": "Texto-base, fontes e lacunas abertas"
          },
          {
            "etapa": "Oito versões adaptadas",
            "oQueAcontece": "Os quatro ângulos viram quatro posts e quatro e-mails. Abertura, ritmo, profundidade e chamada mudam por canal; argumento e prova permanecem.",
            "evidencia": "Versão de origem e contrato do canal"
          },
          {
            "etapa": "Aprovação e calendário fechados",
            "oQueAcontece": "Uma pessoa revisa fatos, voz, composição e restrições. As versões aprovadas entram no calendário e cada resultado futuro volta para a ficha da pauta.",
            "evidencia": "Aprovador, versão, data e hipótese de leitura"
          }
        ],
        "resultadoEsperado": "as oito peças abrem suas fontes, defendem uma tese real da empresa, parecem nativas de LinkedIn ou e-mail e só ficam publicáveis depois de uma aprovação humana registrada."
      },
      "materiais": [
        {
          "titulo": "Ficha de entrada da fonte",
          "quandoUsar": "Na captação, para registrar o que pode ser usado, em qual contexto e quem responde pela validação.",
          "conteudo": "FICHA DE ENTRADA DA FONTE\n\nTítulo da fonte:\nTipo: entrevista, call, documento, case, dado ou referência\nOrigem e autor:\nData de criação:\nPeríodo a que se refere:\nLink ou arquivo:\nResponsável interno:\n\nPERMISSÃO E CONTEXTO\nPode ser usada publicamente?\nHá cliente, pessoa ou dado que precisa ser anonimizado?\nHá números que exigem validação?\nHá trechos confidenciais ou fora de contexto?\nAté quando a informação é válida?\n\nVALOR EDITORIAL\nPúblico relacionado:\nProblema ou tensão abordada:\nOpiniões declaradas:\nFatos e provas disponíveis:\nPerguntas que a fonte ajuda a responder:\nLacunas que precisam de confirmação:\n\nStatus: recebida, revisada, aprovada ou bloqueada\nAprovado por:\nVersão e data:"
        },
        {
          "titulo": "Pacote de fatos e evidências",
          "quandoUsar": "Antes da pauta, para separar matéria-prima confiável de interpretação ou hipótese editorial.",
          "conteudo": "PACOTE DE FATOS E EVIDÊNCIAS\n\nFragmento | Tipo | Fonte | Localização | Contexto | Pode publicar? | Validade | Observação\n\nTIPOS\nFato verificável:\nNúmero ou resultado:\nFala direta:\nOpinião declarada:\nObjeção do público:\nExemplo ou experiência:\nHipótese a confirmar:\n\nCHECKLIST\n[ ] Todo número tem origem e período\n[ ] Toda fala preserva o sentido do contexto\n[ ] Todo case tem permissão e versão aprovada\n[ ] Hipótese está identificada como hipótese\n[ ] Dado pessoal desnecessário foi removido\n[ ] Lacuna não foi completada pela IA\n\nResponsável pela revisão factual:\nData da revisão:\nFontes bloqueadas ou expiradas:"
        },
        {
          "titulo": "Briefing de tese, prova e consequência",
          "quandoUsar": "Na pauta, para impedir que o texto comece antes de existir uma decisão editorial clara.",
          "conteudo": "BRIEFING EDITORIAL\n\nPúblico específico:\nSituação em que essa pessoa está:\nTensão ou pergunta concreta:\n\nTESE\nO que a empresa realmente defende:\nO que torna essa posição específica:\nO que ela rejeita ou corrige:\n\nPROVA\nFonte principal:\nFato, fala ou exemplo que sustenta a tese:\nFonte complementar:\nLimite do que a prova permite afirmar:\n\nCONSEQUÊNCIA\nO que muda para o público se a tese for verdadeira:\nDecisão, ação ou pergunta que deve surgir:\n\nPEÇA\nObjetivo:\nÂngulo:\nPromessa permitida:\nPromessa proibida:\nLacunas para o porta-voz:\nChamada coerente:\nCritério para rejeitar a pauta:"
        },
        {
          "titulo": "Contrato de adaptação por canal",
          "quandoUsar": "Antes da produção, para definir como cada canal muda a forma sem alterar tese, prova ou sentido.",
          "conteudo": "CONTRATO DE ADAPTAÇÃO POR CANAL\n\nCANAL 1\nNome:\nPapel na jornada:\nFormato:\nTamanho ou duração:\nTipo de abertura:\nRitmo e estrutura:\nNível de profundidade:\nUso de links e fontes:\nChamada permitida:\nElementos obrigatórios:\nElementos proibidos:\nExemplo aprovado:\n\nCANAL 2\nNome:\nPapel na jornada:\nFormato:\nTamanho ou duração:\nTipo de abertura:\nRitmo e estrutura:\nNível de profundidade:\nUso de links e fontes:\nChamada permitida:\nElementos obrigatórios:\nElementos proibidos:\nExemplo aprovado:\n\nNÚCLEO QUE NÃO MUDA\nTese:\nProva:\nConsequência:\nRestrições factuais:\nTom da marca:\nComo ligar cada versão à peça de origem:"
        },
        {
          "titulo": "Ficha de aprovação e aprendizado",
          "quandoUsar": "Da revisão ao fechamento do ciclo, para controlar versão, aprovação, publicação e leitura de resultado.",
          "conteudo": "FICHA DE APROVAÇÃO E APRENDIZADO\n\nPEÇA\nTítulo interno:\nPauta e fonte de origem:\nCanal e formato:\nVersão:\nResponsável pela redação:\nData prevista:\n\nREVISÃO\n[ ] Tese está clara e pertence à empresa\n[ ] Provas abrem e sustentam as afirmações\n[ ] Não há case, número ou experiência inventada\n[ ] Voz e contrato do canal foram respeitados\n[ ] Composição foi revisada no formato final\n[ ] Chamada é coerente e não cria urgência artificial\n[ ] Dados sensíveis e permissões foram conferidos\n\nDECISÃO\nStatus: ajustar, aprovado ou bloqueado\nAprovado por:\nVersão aprovada:\nObservações:\n\nPUBLICAÇÃO\nPublicado por:\nData e link:\n\nAPRENDIZADO\nHipótese da peça:\nMétrica principal do formato:\nSinais de atenção:\nSinais de resposta:\nSinais de ação:\nO que funcionou:\nO que não funcionou:\nO que testar na próxima peça:\nRevisado por e data:"
        }
      ]
    }
    $trilha$::jsonb,
    true
  ),
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'operacao-conteudo-multicanal';

-- Mantém a demonstração principal coerente para telas de fallback. A experiência
-- guiada usa os dois vídeos de referência descritos na trilha.
update public.solucoes
set video_url = 'https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=7bbb80ed-1f25-45a9-af1d-8981189f9b6a'
where slug = 'operacao-conteudo-multicanal';
