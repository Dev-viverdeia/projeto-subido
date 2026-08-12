-- Fecha a camada didática dos cinco projetos com uma operação completa de calls:
-- captura confiável, Live Coach com limite e pós-call factual. Os vídeos vêm de
-- BriefBot, LiveCoach e Relatório de Vendas, já publicados no Viver de IA.

update public.projeto_roteiros as roteiro
set
  roteiro = jsonb_set(
    roteiro.roteiro,
    '{trilhaDidatica}',
    $trilha$
    {
      "tempoTotal": "45 a 60 minutos antes da primeira call piloto",
      "aulas": [
        {
          "titulo": "Capture a reunião como evidência confiável",
          "objetivo": "Preparar consentimento, participantes, faixas de áudio e retenção para que cada leitura futura possa voltar à conversa que realmente aconteceu.",
          "duracao": "15 min",
          "topicos": [
            "Call ligada à oportunidade e participantes identificados antes da entrada",
            "Consentimento, acesso, retenção e exclusão definidos para gravação e transcrição",
            "Áudio por participante e tempo preservados sem cruzar falas ou perder a origem"
          ],
          "exercicio": "Simule uma sala com vendedor e lead, confirme o consentimento, grave uma fala de cada participante e verifique se transcrição, nome e horário continuam ligados à faixa correta.",
          "prontoQuando": "É possível abrir uma frase transcrita, identificar quem falou, ouvir ou localizar o trecho correspondente e aplicar a política de acesso e retenção aprovada."
        },
        {
          "titulo": "Faça o Live Coach ajudar sem tomar a reunião",
          "objetivo": "Transformar um playbook aprovado em sugestões curtas, contextuais e temporárias que ajudam o vendedor somente quando existe uma lacuna real.",
          "duracao": "15 min",
          "topicos": [
            "Gatilho ligado ao diálogo e recomendação de uma ação por vez",
            "Prioridade, expiração e silêncio correto quando a conversa já está avançando",
            "Coaching de método sem inventar objeção, urgência ou julgar estilo pessoal"
          ],
          "exercicio": "Escolha cinco momentos de uma call real e compare o playbook com o diálogo. Escreva a sugestão que ajudaria, quando ela deve aparecer e em quantos segundos deixa de ser útil.",
          "prontoQuando": "Cada sugestão cita a lacuna que a provocou, cabe em uma leitura rápida, expira sozinha e não interrompe quando o vendedor já resolveu o ponto."
        },
        {
          "titulo": "Leve fatos confirmados ao CRM",
          "objetivo": "Extrair dores, objeções, decisões, compromissos e tarefas com evidência, preservando a revisão humana antes de qualquer efeito comercial.",
          "duracao": "18 min",
          "topicos": [
            "Fala do lead, proposta do vendedor, inferência e compromisso tratados como coisas diferentes",
            "Trecho, horário e participante anexados a cada fato ou ação sugerida",
            "Revisão antes de mover etapa, criar tarefa, gerar proposta ou enviar follow-up"
          ],
          "exercicio": "Analise uma transcrição curta, extraia cinco fatos e duas possíveis ações e peça a outra pessoa para abrir os trechos e decidir quais ações foram realmente combinadas.",
          "prontoQuando": "O CRM recebe somente fatos citáveis e ações confirmadas; proposta, desconto, prazo ou follow-up que não foram combinados permanecem como rascunho para revisão."
        }
      ],
      "videosReferencia": [
        {
          "titulo": "BriefBot · Plataforma de reuniões",
          "descricao": "Veja a referência do Viver de IA para sala online, gravação, transcrição, briefing e tarefas conectadas à reunião.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=17171fd9-22cd-4353-bf10-6a75d982c7ca"
        },
        {
          "titulo": "LiveCoach em tempo real",
          "descricao": "Observe como dicas treinadas no playbook podem acompanhar reuniões de vendas e CS enquanto a conversa acontece.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=cf55fd01-4b35-4f0c-87ae-f06905b1b33e"
        },
        {
          "titulo": "Relatório de Vendas com IA",
          "descricao": "Complete a jornada vendo como dores, qualificação e desempenho da reunião viram uma leitura pós-call para o time comercial.",
          "videoUrl": "https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=e4408cdf-11db-4b7a-9a7e-f1cb93faaa48"
        }
      ],
      "demonstracao": {
        "titulo": "Da sala ao próximo passo confirmado no CRM",
        "contexto": "Um prestador apresenta um projeto de SDR com IA para uma rede de clínicas. A reunião precisa gerar orientação útil ao vivo, fatos citáveis depois da call e uma próxima ação confirmada, sem criar compromisso que o lead não assumiu.",
        "passos": [
          {
            "etapa": "Call ligada à oportunidade",
            "oQueAcontece": "Sala, vendedor, lead, empresa e objetivo da reunião são ligados ao registro correto do CRM antes da entrada dos participantes.",
            "evidencia": "Call, oportunidade e participantes"
          },
          {
            "etapa": "Consentimento e captura",
            "oQueAcontece": "A gravação começa somente após o aviso aprovado; cada participante mantém sua fonte de áudio e o sistema registra entrada, saída e eventuais falhas.",
            "evidencia": "Consentimento, faixa, participante e evento"
          },
          {
            "etapa": "Coaching no momento certo",
            "oQueAcontece": "O lead descreve demora no WhatsApp, mas o impacto ainda não foi entendido. O coach sugere uma pergunta curta e remove a dica quando o vendedor avança.",
            "evidencia": "Lacuna, sugestão, criação e expiração"
          },
          {
            "etapa": "Transcrição consolidada",
            "oQueAcontece": "Os trechos ao vivo são conciliados com a transcrição final; correções preservam o original e não trocam o participante que originou a fala.",
            "evidencia": "Trecho original, revisão e horário"
          },
          {
            "etapa": "Fatos e ações extraídos",
            "oQueAcontece": "Dor, processo atual, objeção, critério de decisão e pedido de proposta são extraídos com citações. Uma data sugerida pelo vendedor não vira prazo confirmado.",
            "evidencia": "Tipo de saída, trecho e confiança"
          },
          {
            "etapa": "Revisão e CRM atualizados",
            "oQueAcontece": "O vendedor corrige o resumo, confirma o envio da proposta como próxima ação e aprova a tarefa. O follow-up permanece em rascunho até o envio humano.",
            "evidencia": "Revisor, alteração, confirmação e destino"
          }
        ],
        "resultadoEsperado": "a reunião permanece rastreável por participante e horário, o coach ajuda sem dominar a conversa e o CRM recebe fatos e ações confirmadas sem inventar prazo, desconto, etapa ou compromisso."
      },
      "materiais": [
        {
          "titulo": "Contrato da reunião e consentimento",
          "quandoUsar": "Na preparação, para fechar o que será capturado, quem poderá acessar e quais saídas a reunião deve produzir.",
          "conteudo": "CONTRATO DA REUNIÃO\n\nTipo de reunião:\nObjetivo:\nEtapa comercial relacionada:\nParticipantes esperados:\nOportunidade no CRM:\n\nCAPTURA E PRIVACIDADE\nTexto de consentimento:\nQuando a gravação pode começar:\nQuem pode acessar áudio e transcrição:\nPrazo de retenção:\nComo solicitar exclusão:\nComo tratar participante sem consentimento:\nDados que não devem ser extraídos:\n\nSAÍDAS ESPERADAS\nFatos sobre cenário atual:\nDores e impactos:\nCritérios de decisão:\nObjeções:\nCompromissos:\nPróximas ações:\nTarefas permitidas após revisão:\nSaídas que nunca podem ser automáticas:\n\nResponsável pela operação:\nResponsável pela privacidade:\nVersão e data de aprovação:"
        },
        {
          "titulo": "Playbook operacional do Live Coach",
          "quandoUsar": "Antes do piloto, para converter o método comercial em gatilhos úteis, curtos e temporários.",
          "conteudo": "PLAYBOOK DO LIVE COACH\n\nMomento | Evidência no diálogo | Lacuna | Sugestão permitida | Prioridade | Expira em | Quando ficar em silêncio\n\n1. MOMENTO\nEvidência necessária:\nLacuna:\nSugestão em uma frase:\nPrioridade:\nTempo de validade:\nNão sugerir quando:\n\nREGRAS GERAIS\n[ ] Uma sugestão por vez\n[ ] Toda sugestão nasce de uma fala ou lacuna observável\n[ ] Dica expirada desaparece\n[ ] Não repetir ponto já resolvido\n[ ] Não inventar objeção, urgência ou intenção\n[ ] Não avaliar sotaque, personalidade ou estilo pessoal\n[ ] Situação sensível sai do coaching automático\n\nResponsável pelo playbook:\nVersão:\nData da próxima calibração:"
        },
        {
          "titulo": "Contrato de fatos e ações pós-call",
          "quandoUsar": "Na construção, para definir exatamente o que a IA pode extrair e qual evidência cada saída precisa carregar.",
          "conteudo": "CONTRATO DE FATOS E AÇÕES PÓS-CALL\n\nTIPO DE SAÍDA | DEFINIÇÃO | EVIDÊNCIA OBRIGATÓRIA | DESTINO | EXIGE CONFIRMAÇÃO?\n\nDor declarada:\nImpacto declarado:\nProcesso atual:\nObjeção:\nCritério de decisão:\nPessoa envolvida:\nCompromisso do lead:\nCompromisso do vendedor:\nPróxima ação sugerida:\nTarefa confirmada:\n\nCAMPOS DE CADA SAÍDA\nParticipante que falou:\nTrecho literal:\nHorário inicial e final:\nInterpretação separada:\nConfiança:\nRevisor:\nAlteração humana:\nEstado: sugerido, confirmado, rejeitado ou corrigido\n\nNUNCA ASSUMIR\nPrazo não confirmado\nOrçamento não declarado\nAutoridade não comprovada\nDesconto ou condição\nEtapa comercial\nEnvio já realizado"
        },
        {
          "titulo": "Matriz de calibração de dez calls",
          "quandoUsar": "Na validação, para comparar a leitura da IA com vendedor e liderança antes de ampliar o piloto.",
          "conteudo": "MATRIZ DE CALIBRAÇÃO DE 10 CALLS\n\nCall | Tipo | Saída avaliada | IA | Vendedor | Líder | Trecho correto? | Participante correto? | Ação correta? | Decisão | Correção | Reteste\n\nCOBERTURA MÍNIMA\n[ ] Dez reuniões do mesmo tipo\n[ ] Calls curtas e longas\n[ ] Áudio limpo e com interrupção\n[ ] Objeção explícita e ambígua\n[ ] Compromisso confirmado e apenas sugerido\n[ ] Coach útil, tardio e desnecessário\n[ ] Falha parcial de transcrição\n\nMEDIDAS\nFatos corretos:\nFatos sem evidência:\nFatos importantes omitidos:\nParticipantes trocados:\nAções corretas:\nAções indevidas:\nDicas úteis:\nDicas ignoradas:\nDicas tardias:\n\nResponsável pela calibração:\nCorreções obrigatórias:\nCritério de aprovação:\nData do reteste:"
        },
        {
          "titulo": "Ficha de revisão e passagem ao CRM",
          "quandoUsar": "No pós-call, para revisar o resumo e confirmar cada efeito antes de atualizar a operação comercial.",
          "conteudo": "REVISÃO E PASSAGEM AO CRM\n\nCALL\nData e horário:\nEmpresa e oportunidade:\nParticipantes:\nTipo e objetivo:\nLink da gravação conforme permissão:\n\nRESUMO FACTUAL\nCenário atual com trecho:\nDor e impacto com trecho:\nObjeção com trecho:\nCritérios de decisão com trecho:\nDecisões tomadas:\nLacunas ainda abertas:\n\nAÇÕES\nAção | Foi declarada? | Responsável | Data confirmada? | Trecho | Destino\n\nREVISÃO HUMANA\n[ ] Participantes e falas estão corretos\n[ ] Inferências estão separadas dos fatos\n[ ] Datas e responsáveis foram realmente combinados\n[ ] Etapa do CRM deve mudar\n[ ] Tarefas podem ser criadas\n[ ] Proposta precisa ser gerada ou atualizada\n[ ] Follow-up está apenas em rascunho\n\nALTERAÇÕES DO REVISOR\nCampo alterado:\nAntes:\nDepois:\nMotivo:\n\nRevisado por:\nConfirmado em:\nPróxima ação aprovada:\nItens rejeitados ou pendentes:"
        }
      ]
    }
    $trilha$::jsonb,
    true
  ),
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'inteligencia-comercial-com-ia';

-- Mantém o vídeo principal coerente para telas de fallback. A jornada guiada usa
-- as três referências complementares presentes na trilha.
update public.solucoes
set video_url = 'https://player-vz-d6ebf577-797.tv.pandavideo.com.br/embed/?v=17171fd9-22cd-4353-bf10-6a75d982c7ca'
where slug = 'inteligencia-comercial-com-ia';
