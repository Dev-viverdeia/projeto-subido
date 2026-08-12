-- Incorpora aprendizagem à execução sem criar uma segunda área de curso.
-- Os vídeos foram selecionados das soluções equivalentes na plataforma Viver de IA:
-- Nina - Plataforma de SDR com IA e Pesquisa de Satisfação Automatizada.

update public.projeto_roteiros as roteiro
set
  roteiro = jsonb_set(
    roteiro.roteiro,
    '{trilhaDidatica}',
    $trilha$
    {
      "tempoTotal": "35 a 45 minutos antes do primeiro diagnóstico",
      "aulas": [
        {
          "titulo": "Desenhe a conversa antes de configurar o agente",
          "objetivo": "Entender a jornada real do lead e definir onde a IA responde, pergunta, espera ou entrega a conversa para uma pessoa.",
          "duracao": "12 min",
          "topicos": [
            "Estados da conversa e próximo movimento permitido em cada um",
            "Uma pergunta por vez e contexto preservado entre mensagens",
            "Gatilhos objetivos para passagem humana e encerramento"
          ],
          "exercicio": "Selecione cinco conversas reais, marque o objetivo de cada trecho e desenhe o caminho entre entrada, qualificação, agendamento, passagem humana e encerramento.",
          "prontoQuando": "Cada estado tem uma entrada verificável, uma saída permitida, um responsável e uma exceção que impede a automação de continuar sozinha."
        },
        {
          "titulo": "Qualifique por fatos, não por intuição",
          "objetivo": "Converter o perfil de cliente ideal em perguntas, evidências e lacunas que a operação consegue registrar e revisar.",
          "duracao": "10 min",
          "topicos": [
            "Critério observável, pergunta correspondente e fonte da resposta",
            "Diferença entre fato confirmado, inferência e dado ainda ausente",
            "Efeito de cada critério na rota, sem esconder o motivo da decisão"
          ],
          "exercicio": "Transforme os critérios do ICP em uma matriz com pergunta, resposta aceita, evidência necessária, impacto na rota e comportamento quando o dado não aparecer.",
          "prontoQuando": "Uma segunda pessoa consegue ler a matriz e chegar à mesma classificação sem completar lacunas com opinião própria."
        },
        {
          "titulo": "Valide a operação antes de abrir o canal",
          "objetivo": "Aprender a testar respostas, integrações e exceções sem expor leads reais a uma automação ainda não aprovada.",
          "duracao": "15 min",
          "topicos": [
            "Base aprovada e resposta segura quando a fonte não resolve a dúvida",
            "Cenários comuns, ambíguos, críticos e falhas de integração",
            "Evidência, reteste e aceite humano antes da entrada em produção"
          ],
          "exercicio": "Rode três conversas controladas: uma comum, uma sem informação suficiente e uma que exige passagem imediata para uma pessoa.",
          "prontoQuando": "Nenhum teste inventa preço, disponibilidade ou política, toda passagem chega com contexto e cada falha deixa uma evidência reproduzível."
        }
      ],
      "videosReferencia": [
        {
          "titulo": "Implementação de referência · Parte 1",
          "descricao": "Acompanhe a primeira parte da construção da Nina, a solução de SDR usada como referência técnica e visual para este projeto.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=d16274fc-5d9a-4729-825a-4080df4b9508"
        },
        {
          "titulo": "Implementação de referência · Parte 2",
          "descricao": "Continue a implementação e observe como a entrega deixa de ser uma conversa isolada para virar uma operação acompanhável.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=c250e539-a93c-4622-ac64-b2f0d0287a3e"
        }
      ],
      "demonstracao": {
        "titulo": "Do primeiro contato ao CRM, sem perder o contexto",
        "contexto": "Um lead chega pelo WhatsApp perguntando preço e disponibilidade. O agente precisa entender a necessidade, qualificar o que for possível, consultar fontes reais e envolver uma pessoa quando necessário.",
        "passos": [
          {
            "etapa": "Entrada registrada",
            "oQueAcontece": "A mensagem, o canal, a origem e o identificador do contato entram na linha do tempo antes da primeira resposta.",
            "evidencia": "Evento inbound com contato e horário"
          },
          {
            "etapa": "Resposta com fonte",
            "oQueAcontece": "O agente usa somente a base aprovada, responde o que está confirmado e faz uma única pergunta para avançar.",
            "evidencia": "Fonte citada e pergunta registrada"
          },
          {
            "etapa": "Fatos qualificados",
            "oQueAcontece": "Necessidade, contexto, prazo e demais critérios são salvos como fatos; campos ausentes continuam explicitamente vazios.",
            "evidencia": "Matriz com fatos e lacunas"
          },
          {
            "etapa": "Agenda consultada",
            "oQueAcontece": "A disponibilidade vem do calendário real e o horário só é apresentado quando a consulta retorna com sucesso.",
            "evidencia": "Consulta e slot de origem"
          },
          {
            "etapa": "Passagem humana",
            "oQueAcontece": "Uma dúvida comercial fora do limite interrompe a automação e chega ao responsável com resumo, histórico e próxima ação sugerida.",
            "evidencia": "Dono, prazo e pacote de contexto"
          },
          {
            "etapa": "CRM atualizado",
            "oQueAcontece": "Contato, qualificação, reunião e compromisso confirmado aparecem na mesma linha do tempo sem ação comercial inventada.",
            "evidencia": "Evento, responsável e próximo passo"
          }
        ],
        "resultadoEsperado": "o agente não inventa preço ou agenda, a pessoa recebe todo o contexto e o CRM mostra com clareza o que aconteceu, quem assumiu e qual é o próximo passo."
      },
      "materiais": [
        {
          "titulo": "Briefing de atendimento",
          "quandoUsar": "Na primeira reunião, para fechar as fontes, os limites e os responsáveis antes de discutir ferramenta.",
          "conteudo": "BRIEFING DE ATENDIMENTO\n\nEmpresa e unidade:\nCanal do piloto:\nObjetivo do atendimento:\nPúblico atendido:\nPrincipais intenções de contato:\n\nOFERTA E FONTES\nProdutos ou serviços permitidos:\nFonte oficial de cada informação:\nPreços que podem ser informados:\nPolíticas que podem ser informadas:\nHorários e disponibilidade:\nLacunas conhecidas da base:\n\nLIMITES\nO agente nunca pode:\nSituações que exigem uma pessoa:\nDestino da transferência:\nResponsável principal:\nPrazo de resposta humana:\n\nOPERAÇÃO\nHorário de funcionamento:\nMensagem fora do horário:\nComo encerrar uma conversa:\nComo registrar opt-out:\nIndicador principal do piloto:\nData de revisão do briefing:"
        },
        {
          "titulo": "Matriz de qualificação",
          "quandoUsar": "Antes de escrever prompts, para transformar o ICP em critérios que qualquer pessoa consegue auditar.",
          "conteudo": "MATRIZ DE QUALIFICAÇÃO\n\nCritério | Por que importa | Pergunta | Resposta aceita | Evidência | Efeito na rota | Se faltar dado\n\n1. Critério:\nPor que importa:\nPergunta:\nResposta aceita:\nEvidência exigida:\nEfeito na rota:\nComportamento se faltar:\n\n2. Critério:\nPor que importa:\nPergunta:\nResposta aceita:\nEvidência exigida:\nEfeito na rota:\nComportamento se faltar:\n\nREGRA FINAL\nO que define qualificado:\nO que define não aderente:\nO que exige revisão humana:\nVersão e responsável pela aprovação:"
        },
        {
          "titulo": "Contrato de passagem humana",
          "quandoUsar": "Na preparação, para impedir transferências sem dono, sem contexto ou fora do prazo combinado.",
          "conteudo": "CONTRATO DE PASSAGEM HUMANA\n\nGatilho da passagem:\nDestino responsável:\nHorário de cobertura:\nPrazo para assumir:\nEstado aceito pelo destino:\n\nPACOTE OBRIGATÓRIO\nIdentificação do contato:\nMotivo da conversa:\nFatos confirmados:\nDados ainda ausentes:\nPergunta que ficou aberta:\nÚltima mensagem do lead:\nPróxima ação sugerida:\nRisco ou urgência:\n\nCONFIRMAÇÃO\nComo o sistema confirma que uma pessoa assumiu:\nO que acontece se ninguém assumir no prazo:\nComo a conversa volta para automação:\nQuem revisa falhas de passagem:\nData da próxima revisão:"
        },
        {
          "titulo": "Roteiro de vinte conversas",
          "quandoUsar": "Na validação, para cobrir o cotidiano, as ambiguidades, os riscos e as integrações antes da ativação.",
          "conteudo": "ROTEIRO DE 20 CONVERSAS\n\nCaso | Tipo | Entrada | Contexto prévio | Resposta esperada | Deve perguntar? | Deve transferir? | Não pode acontecer | Evidência | Resultado | Correção | Reteste\n\nDISTRIBUIÇÃO MÍNIMA\n6 casos comuns\n4 casos com informação ausente\n3 casos ambíguos\n3 casos críticos\n2 falhas de integração\n1 opt-out\n1 retorno após passagem humana\n\nCRITÉRIOS GERAIS\n[ ] Não inventou informação\n[ ] Fez uma pergunta por vez\n[ ] Preservou o contexto\n[ ] Registrou fatos e lacunas\n[ ] Transferiu no gatilho correto\n[ ] Gerou evidência reproduzível"
        },
        {
          "titulo": "Checklist de entrada em produção",
          "quandoUsar": "No aceite do piloto, para ativar somente quando canal, dados, exceções e pessoas estiverem realmente prontos.",
          "conteudo": "CHECKLIST DE ENTRADA EM PRODUÇÃO\n\nCANAL E ACESSO\n[ ] Número e conta oficial confirmados\n[ ] Webhook validado em ida e volta\n[ ] Chaves no servidor e permissões mínimas\n[ ] Ambiente de teste separado\n\nCONHECIMENTO E CONVERSA\n[ ] Base aprovada e versionada\n[ ] Lacunas conhecidas documentadas\n[ ] Limites de resposta testados\n[ ] Opt-out e encerramento funcionando\n\nINTEGRAÇÕES\n[ ] Agenda consulta disponibilidade real\n[ ] CRM evita duplicidade\n[ ] Retry não duplica mensagem ou evento\n[ ] Falha externa cria alerta\n\nPESSOAS E OPERAÇÃO\n[ ] Responsável de passagem disponível\n[ ] Prazo e contingência combinados\n[ ] Vinte conversas aprovadas\n[ ] Indicadores e rotina de revisão definidos\n\nAceite do cliente:\nResponsável técnico:\nData e janela da ativação:\nCritério de pausa imediata:"
        }
      ]
    }
    $trilha$::jsonb,
    true
  ),
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'sdr-atendimento-qualificacao';

update public.projeto_roteiros as roteiro
set
  roteiro = jsonb_set(
    roteiro.roteiro,
    '{trilhaDidatica}',
    $trilha$
    {
      "tempoTotal": "25 a 35 minutos antes do primeiro piloto",
      "aulas": [
        {
          "titulo": "Escolha o momento que merece uma pergunta",
          "objetivo": "Definir um único momento da jornada, uma métrica compreensível e a ação que cada faixa de resposta pode gerar.",
          "duracao": "8 min",
          "topicos": [
            "Diferença prática entre NPS, CSAT e uma pergunta aberta",
            "Evento elegível, público da campanha e motivo para excluir contatos",
            "Consentimento, opt-out e frequência que não desgasta a relação"
          ],
          "exercicio": "Escolha um evento real do cliente e escreva em uma frase o que a pesquisa deve descobrir e qual decisão a empresa tomará com a resposta.",
          "prontoQuando": "Evento, público, pergunta, método, exclusões, frequência e responsável pela ação cabem em uma página e foram aprovados pelo cliente."
        },
        {
          "titulo": "Transforme comentário em fila de ação",
          "objetivo": "Classificar o feedback sem apagar a fala do cliente, inventar causa ou deixar uma resposta crítica sem responsável.",
          "duracao": "10 min",
          "topicos": [
            "Comentário original preservado e trecho usado como evidência",
            "Tema, urgência e sentimento separados de hipótese sobre a causa",
            "Regra de alerta com dono, prazo e comportamento quando houver dúvida"
          ],
          "exercicio": "Classifique dez comentários de exemplo, cite o trecho que sustenta cada classe e marque como desconhecido tudo que o texto não permite afirmar.",
          "prontoQuando": "Duas pessoas chegam ao mesmo tema e à mesma urgência usando a taxonomia, e todo alerta mostra o comentário que o originou."
        },
        {
          "titulo": "Feche o retorno e prove valor",
          "objetivo": "Organizar a recuperação humana, registrar o desfecho e produzir um relatório que separa número, evidência e recomendação.",
          "duracao": "8 min",
          "topicos": [
            "Reconhecimento do problema sem promessa automática de compensação",
            "Tentativa, contato, ação e fechamento registrados na mesma linha do tempo",
            "Relatório com tamanho da base, período, temas, citações e ações"
          ],
          "exercicio": "Simule uma resposta positiva, uma neutra e uma crítica; acompanhe as três até o relatório e feche a crítica com uma ação humana registrada.",
          "prontoQuando": "Cada alerta tem fonte, dono, prazo, contato e desfecho, e o relatório não apresenta hipótese como fato nem média sem contexto."
        }
      ],
      "videosReferencia": [
        {
          "titulo": "Pesquisa de satisfação automatizada",
          "descricao": "Veja a solução equivalente do Viver de IA para entender a experiência final de coleta, leitura e fechamento do retorno.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=8231ee9f-6e19-487b-9067-32dfb54dac94"
        }
      ],
      "demonstracao": {
        "titulo": "Da consulta concluída ao retorno fechado",
        "contexto": "Uma clínica odontológica envia uma pesquisa curta depois da consulta. Uma paciente dá nota baixa e explica que esperou quarenta minutos. O radar precisa preservar a fala, alertar a pessoa certa e acompanhar o retorno.",
        "passos": [
          {
            "etapa": "Evento elegível",
            "oQueAcontece": "A consulta concluída cria uma participação somente se a paciente estiver dentro das regras da campanha e puder receber o contato.",
            "evidencia": "Evento, campanha e regra de elegibilidade"
          },
          {
            "etapa": "Pesquisa enviada",
            "oQueAcontece": "A paciente recebe uma pergunta curta, identificação da clínica e opção clara de não receber novos contatos.",
            "evidencia": "Entrega, versão da pergunta e opt-out"
          },
          {
            "etapa": "Resposta preservada",
            "oQueAcontece": "A nota dois de cinco e o comentário sobre a espera são gravados integralmente antes de qualquer análise por IA.",
            "evidencia": "Nota, comentário original e horário"
          },
          {
            "etapa": "Leitura com evidência",
            "oQueAcontece": "O radar classifica o tema como espera, mantém a urgência moderada e cita o trecho exato sem inventar a causa do atraso.",
            "evidencia": "Tema, urgência e trecho citado"
          },
          {
            "etapa": "Recuperação humana",
            "oQueAcontece": "A responsável recebe o alerta, entra em contato, reconhece a experiência e registra a ação sem promessa autônoma do sistema.",
            "evidencia": "Dono, prazo, contato e ação"
          },
          {
            "etapa": "Ciclo fechado",
            "oQueAcontece": "O desfecho entra no histórico e o relatório semanal atualiza o tema, a citação anonimizada e a ação com responsável.",
            "evidencia": "Fechamento e relatório atualizado"
          }
        ],
        "resultadoEsperado": "a fala original permanece acessível, o alerta chega com responsável e prazo, o retorno humano é fechado e o relatório mostra o problema e a ação sem atribuir uma causa que a paciente não declarou."
      },
      "materiais": [
        {
          "titulo": "Briefing do radar",
          "quandoUsar": "No diagnóstico, para fechar o recorte do piloto e a decisão que o feedback deve melhorar.",
          "conteudo": "BRIEFING DO RADAR\n\nObjetivo da pesquisa:\nDecisão que ela deve apoiar:\nMomento da jornada:\nEvento que inicia o envio:\nPúblico elegível:\nQuem deve ser excluído:\nMétodo: NPS, CSAT ou pergunta aberta:\nPergunta principal:\nPergunta complementar:\nCanal:\nFrequência máxima:\nRegra de opt-out:\n\nAÇÃO\nFaixa positiva gera:\nFaixa neutra gera:\nFaixa crítica gera:\nResponsável pelos alertas:\nPrazo para primeiro contato:\nComo registrar o fechamento:\nIndicador principal do piloto:\nData de revisão:"
        },
        {
          "titulo": "Taxonomia de feedback",
          "quandoUsar": "Antes da automação, para ensinar a IA e a equipe a classificar do mesmo jeito e com a mesma evidência.",
          "conteudo": "TAXONOMIA DE FEEDBACK\n\nTema | Definição | Inclui | Não inclui | Exemplos | Urgência padrão | Gera alerta?\n\nTema 1:\nDefinição:\nInclui:\nNão inclui:\nExemplos reais anonimizados:\nUrgência padrão:\nGera alerta quando:\n\nREGRAS DE EVIDÊNCIA\n[ ] Preservar o comentário original\n[ ] Citar o trecho que sustenta o tema\n[ ] Não inventar causa, intenção ou diagnóstico\n[ ] Marcar desconhecido quando faltar contexto\n[ ] Separar sentimento de urgência\n[ ] Enviar ambiguidade para revisão humana\n\nResponsável pela taxonomia:\nVersão:\nData de calibração:"
        },
        {
          "titulo": "Roteiro de recuperação",
          "quandoUsar": "Quando houver uma resposta crítica, como guia humano para reconhecer, entender e combinar o próximo contato.",
          "conteudo": "ROTEIRO DE RECUPERAÇÃO\n\n1. RECONHECER\nOlá, [nome]. Obrigado por contar o que aconteceu em [momento]. Eu li seu comentário sobre [fato declarado] e quero entender melhor a experiência.\n\n2. CONFIRMAR\nO que mais pesou para você nesse momento?\nHá algum detalhe importante que ainda não apareceu no comentário?\n\n3. ASSUMIR O PRÓXIMO PASSO\nVou levar esse contexto para [responsável]. Posso retornar por [canal] até [prazo aprovado]?\n\n4. REGISTRAR\nFato relatado:\nContexto adicional:\nAção aprovada:\nResponsável:\nPrazo:\nResultado do contato:\nStatus do fechamento:\n\nNÃO FAZER\nNão prometer desconto, compensação, prazo ou solução sem aprovação.\nNão discutir com a percepção do cliente.\nNão afirmar a causa antes de investigar."
        },
        {
          "titulo": "Checklist de aceite",
          "quandoUsar": "No piloto, para provar que o radar funciona tanto na coleta quanto no alerta e no fechamento humano.",
          "conteudo": "CHECKLIST DE ACEITE DO RADAR\n\nCAMPANHA\n[ ] Evento correto cria uma participação\n[ ] Exclusões e frequência são respeitadas\n[ ] Identidade e pergunta estão corretas\n[ ] Opt-out funciona e fica registrado\n[ ] Link inválido ou repetido não duplica resposta\n\nLEITURA\n[ ] Comentário original é preservado\n[ ] Tema tem trecho de evidência\n[ ] Urgência segue a regra aprovada\n[ ] Ambiguidade vai para revisão\n[ ] Falha de IA não perde a resposta\n\nRECUPERAÇÃO\n[ ] Resposta crítica cria um único alerta\n[ ] Alerta tem dono e prazo\n[ ] Responsável recebe contexto completo\n[ ] Contato e ação ficam registrados\n[ ] Fechamento atualiza o relatório\n\nAceite do cliente:\nPendências:\nResponsável pelo reteste:\nData:"
        },
        {
          "titulo": "Relatório semanal",
          "quandoUsar": "Na entrega e na rotina, para mostrar sinais reais, casos críticos e ações sem exagerar o que a amostra permite concluir.",
          "conteudo": "RELATÓRIO SEMANAL DO RADAR\n\nPeríodo:\nCampanha e versão da pergunta:\nBase elegível:\nConvites enviados:\nEntregues:\nRespostas:\nTaxa de resposta:\nOpt-outs:\n\nRESULTADO\nDistribuição de notas:\nNPS ou CSAT com fórmula:\nTemas por ocorrência:\nComentários positivos representativos:\nComentários críticos anonimizados:\nCasos ainda em revisão:\n\nRECUPERAÇÃO\nAlertas abertos:\nAlertas no prazo:\nAlertas vencidos:\nAlertas fechados:\nAções realizadas:\n\nLEITURA RESPONSÁVEL\nFatos confirmados:\nHipóteses a investigar:\nLimites da amostra:\nRecomendações:\nAção | responsável | prazo:\nPróxima campanha ou revisão:"
        }
      ]
    }
    $trilha$::jsonb,
    true
  ),
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'radar-satisfacao-com-ia';

-- Mantém o vídeo principal coerente com a solução de referência. A página nova usa
-- os vídeos da trilha; este campo continua correto para qualquer fallback ou painel.
update public.solucoes
set video_url = case slug
  when 'sdr-atendimento-qualificacao'
    then 'https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=d16274fc-5d9a-4729-825a-4080df4b9508'
  when 'radar-satisfacao-com-ia'
    then 'https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=8231ee9f-6e19-487b-9067-32dfb54dac94'
  else video_url
end
where slug in ('sdr-atendimento-qualificacao', 'radar-satisfacao-com-ia');
