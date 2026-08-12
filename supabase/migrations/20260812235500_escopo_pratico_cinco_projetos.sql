-- Torna o catálogo vendável e executável para um profissional iniciante:
-- prazo, piloto, prova, limites e kit de entrega passam a fazer parte do conteúdo.

update public.projeto_roteiros as roteiro
set
  roteiro = roteiro.roteiro || $meta$
  {
    "perfil": {
      "nivel": "avancado",
      "prazo": "3 a 5 semanas",
      "formatoPiloto": "Um número de WhatsApp, uma fila comercial e uma agenda de destino.",
      "primeiraProva": "Vinte conversas reais concluídas sem resposta inventada, perda de contexto ou transferência sem responsável.",
      "recomendadoParaComecar": false
    },
    "escopo": {
      "inclui": [
        "Atendimento baseado somente em conhecimento aprovado",
        "Qualificação por critérios confirmáveis e uma pergunta por vez",
        "Agendamento e passagem para uma pessoa com contexto",
        "Estados, eventos, auditoria e fila de exceções"
      ],
      "preRequisitos": [
        "Acesso oficial ao WhatsApp Business Platform",
        "FAQ, oferta, políticas e critérios comerciais aprovados",
        "Uma pessoa responsável por receber transferências",
        "Agenda e ambiente de testes separados da operação real"
      ],
      "naoInclui": [
        "Negociação, desconto ou fechamento comercial autônomo",
        "Disparo em massa ou prospecção ativa pelo WhatsApp",
        "Substituição completa do CRM ou da equipe de atendimento"
      ],
      "evolucoes": [
        "Adicionar novas filas, unidades e agendas",
        "Conectar outros canais mantendo o mesmo histórico",
        "Criar inteligência de motivos, conversão e qualidade"
      ]
    },
    "artefatosEntrega": [
      {
        "titulo": "Mapa da jornada e exceções",
        "descricao": "Caminho real da conversa, estados, responsáveis, prazos e situações que exigem uma pessoa."
      },
      {
        "titulo": "Matriz de qualificação e passagem",
        "descricao": "Critérios, perguntas, evidências, limites, destinos humanos e acordos de atendimento."
      },
      {
        "titulo": "Base aprovada e contrato de resposta",
        "descricao": "Fontes permitidas, lacunas conhecidas e comportamento seguro quando falta informação."
      },
      {
        "titulo": "Suíte de vinte conversas",
        "descricao": "Cenários comuns, ambíguos e críticos com resultado esperado, evidência e reteste."
      },
      {
        "titulo": "Manual do piloto e da operação",
        "descricao": "Ativação, monitoramento, passagem humana, contingência, indicadores e rotina de revisão."
      }
    ]
  }
  $meta$::jsonb,
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'sdr-atendimento-qualificacao';

update public.projeto_roteiros as roteiro
set
  roteiro = roteiro.roteiro || $meta$
  {
    "perfil": {
      "nivel": "intermediario",
      "prazo": "2 a 4 semanas",
      "formatoPiloto": "Um ICP, duas fontes e um lote de vinte a cinquenta empresas.",
      "primeiraProva": "Um lote pequeno aceito pelo comercial, com empresas deduplicadas, decisores confirmados, score explicado e fontes abertas.",
      "recomendadoParaComecar": false
    },
    "escopo": {
      "inclui": [
        "ICP, exclusões e sinais de aderência versionados",
        "Busca, enriquecimento, validade e deduplicação de empresas",
        "Score explicável com fontes e campos ainda ausentes",
        "Revisão humana e envio controlado ao CRM"
      ],
      "preRequisitos": [
        "Oferta clara e histórico mínimo de clientes aderentes",
        "Fontes licenciadas com custo, limite e validade conhecidos",
        "CRM com responsável pelo aceite ou descarte das contas"
      ],
      "naoInclui": [
        "Disparo automático de e-mail, WhatsApp ou LinkedIn",
        "Compra ou uso de base sem origem e permissão verificáveis",
        "Promessa de localizar todo decisor ou contato de uma empresa"
      ],
      "evolucoes": [
        "Adicionar sinais de intenção com janela de validade",
        "Gerar briefing personalizado para a primeira conversa",
        "Realimentar o score com aceite e conversão do comercial"
      ]
    },
    "artefatosEntrega": [
      {
        "titulo": "ICP, exclusões e sinais",
        "descricao": "Critérios observáveis, exemplos, pesos, fontes e versão usada para produzir o lote."
      },
      {
        "titulo": "Matriz de fontes e custos",
        "descricao": "Campos, origem, validade, limites, custo esperado, contingência e regra de opt-out."
      },
      {
        "titulo": "Esquema da conta e score",
        "descricao": "Dados obrigatórios, evidências, lacunas e cálculo explicado sem esconder componentes."
      },
      {
        "titulo": "Primeiro lote auditado",
        "descricao": "Empresas revisadas, motivos de aceite ou descarte, briefing e próxima ação no CRM."
      },
      {
        "titulo": "Playbook de repetição",
        "descricao": "Consultas, revisão, exportação, indicadores, contingência e próxima calibração."
      }
    ]
  }
  $meta$::jsonb,
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'maquina-prospeccao-b2b';

update public.projeto_roteiros as roteiro
set
  roteiro = roteiro.roteiro || $meta$
  {
    "perfil": {
      "nivel": "avancado",
      "prazo": "4 a 6 semanas",
      "formatoPiloto": "Dois ou três vendedores, um tipo de reunião e dez calls acompanhadas.",
      "primeiraProva": "Dez reuniões com fatos citáveis, revisão preservada e tarefas corretas no CRM sem nenhuma ação comercial não confirmada.",
      "recomendadoParaComecar": false
    },
    "escopo": {
      "inclui": [
        "Sala, consentimento, captura e transcrição por participante",
        "Live Coach curto e orientado pelo playbook aprovado",
        "Fatos, objeções, compromissos e tarefas com trechos",
        "Revisão pós-call e atualização confirmada do CRM"
      ],
      "preRequisitos": [
        "Política de consentimento, retenção e acesso às gravações",
        "CRM com oportunidade e participantes identificados",
        "Playbook comercial versionado e líder para calibrar a leitura",
        "Vendedores disponíveis para um piloto acompanhado"
      ],
      "naoInclui": [
        "Mover etapa do funil sem confirmação do vendedor",
        "Enviar follow-up, proposta ou compromisso automaticamente",
        "Avaliar pessoas por um score único sem trechos e contexto"
      ],
      "evolucoes": [
        "Conectar a análise ao gerador de proposta",
        "Criar coaching por tipo de reunião e etapa comercial",
        "Ampliar indicadores para liderança e treinamento"
      ]
    },
    "artefatosEntrega": [
      {
        "titulo": "Mapa da call e contrato de saída",
        "descricao": "Momentos, fatos, evidências, sugestões, destinos e ações que exigem confirmação."
      },
      {
        "titulo": "Checklist de captura e privacidade",
        "descricao": "Consentimento, participantes, faixas de áudio, acesso, retenção, exclusão e contingência."
      },
      {
        "titulo": "Playbook do Live Coach",
        "descricao": "Lacunas, gatilhos, sugestões permitidas, silêncio correto e critérios de expiração."
      },
      {
        "titulo": "Relatório de calibração",
        "descricao": "Comparação por tipo de saída entre IA, transcrição, vendedor e líder comercial."
      },
      {
        "titulo": "Manual do piloto comercial",
        "descricao": "Papéis, jornada ponta a ponta, revisão, indicadores, pausa, correção e rotina semanal."
      }
    ]
  }
  $meta$::jsonb,
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'inteligencia-comercial-com-ia';

update public.projeto_roteiros as roteiro
set
  roteiro = roteiro.roteiro || $meta$
  {
    "perfil": {
      "nivel": "intermediario",
      "prazo": "2 a 4 semanas",
      "formatoPiloto": "Um tema, duas fontes oficiais, dois canais e um ciclo de aprovação.",
      "primeiraProva": "Oito peças aprovadas e publicáveis, todas ligadas à fonte correta, adaptadas por canal e sem afirmação inventada.",
      "recomendadoParaComecar": false
    },
    "escopo": {
      "inclui": [
        "Captação e organização de fontes aprovadas da empresa",
        "Extração de teses, provas e consequências rastreáveis",
        "Adaptação real de formato e linguagem por canal",
        "Revisão humana, calendário e leitura de resultado"
      ],
      "preRequisitos": [
        "Fontes próprias com permissão e porta-voz disponível",
        "Guia de voz, restrições da marca e exemplos aprovados",
        "Uma pessoa com autoridade para revisar e aprovar",
        "Acesso aos canais e às métricas do período"
      ],
      "naoInclui": [
        "Promessa de alcance, viralização ou geração garantida de demanda",
        "Publicação automática sem aprovação editorial",
        "Criação de cases, números, depoimentos ou opiniões não declaradas"
      ],
      "evolucoes": [
        "Adicionar novos canais e formatos visuais",
        "Transformar conteúdo vencedor em mídia paga",
        "Criar biblioteca de fontes, teses e aprendizados por tema"
      ]
    },
    "artefatosEntrega": [
      {
        "titulo": "Mapa editorial e de fontes",
        "descricao": "Público, tensões, teses, provas, restrições e materiais que podem sustentar o conteúdo."
      },
      {
        "titulo": "Contrato de voz por canal",
        "descricao": "Tom, estrutura, tamanho, abertura, chamada, proibições e exemplos aprovados."
      },
      {
        "titulo": "Pipeline e ficha de conteúdo",
        "descricao": "Estados, responsáveis, fonte, tese, prova, versão por canal e histórico de aprovação."
      },
      {
        "titulo": "Lote piloto de oito peças",
        "descricao": "Conteúdos revisados em contexto, com ligação à fonte e variação real por canal."
      },
      {
        "titulo": "Playbook do ciclo editorial",
        "descricao": "Captação, produção, revisão, publicação, contingência, métricas e ritual de aprendizado."
      }
    ]
  }
  $meta$::jsonb,
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'operacao-conteudo-multicanal';

update public.projeto_roteiros as roteiro
set
  roteiro = roteiro.roteiro || $meta$
  {
    "perfil": {
      "nivel": "entrada",
      "prazo": "5 a 10 dias úteis",
      "formatoPiloto": "Um momento da jornada, uma pesquisa curta e um responsável pela recuperação.",
      "primeiraProva": "Trinta respostas processadas com nota, tema, evidência, alertas rastreáveis e relatório semanal revisado.",
      "recomendadoParaComecar": true
    },
    "escopo": {
      "inclui": [
        "Pesquisa curta disparada após um evento definido",
        "Nota, comentário, tema e urgência no mesmo registro",
        "Alerta de risco com responsável e prazo",
        "Resumo semanal com evidências e ações propostas"
      ],
      "preRequisitos": [
        "Evento de envio e público claramente definidos",
        "Canal autorizado para pedir a avaliação",
        "Uma pessoa responsável por recuperar casos críticos",
        "Critérios simples para nota, tema e urgência"
      ],
      "naoInclui": [
        "Pesquisa longa para mapear toda a experiência do cliente",
        "Resposta automática ao cliente insatisfeito",
        "Modelo preditivo de churn sem histórico suficiente"
      ],
      "evolucoes": [
        "Adicionar outros momentos da jornada do cliente",
        "Conectar a recuperação ao CRM e à operação de atendimento",
        "Criar tendências por produto, unidade, equipe ou segmento"
      ]
    },
    "artefatosEntrega": [
      {
        "titulo": "Mapa do momento e do gatilho",
        "descricao": "Público, evento, pergunta, canal, prazo, responsável e condição que impede o envio."
      },
      {
        "titulo": "Pesquisa e taxonomia aprovadas",
        "descricao": "Texto da mensagem, escala, pergunta aberta, temas, urgência e exemplos de classificação."
      },
      {
        "titulo": "Fila e regra de recuperação",
        "descricao": "Alertas, prioridade, responsável, prazo, registro da ação e condição de encerramento."
      },
      {
        "titulo": "Relatório das primeiras respostas",
        "descricao": "Notas, temas, trechos, casos críticos, tendência inicial e ações recomendadas."
      },
      {
        "titulo": "Manual da rotina semanal",
        "descricao": "Envio, monitoramento, recuperação, revisão da amostra, contingência e próximos testes."
      }
    ]
  }
  $meta$::jsonb,
  versao = roteiro.versao + 1
from public.solucoes as projeto
where roteiro.projeto_id = projeto.id
  and projeto.slug = 'radar-satisfacao-com-ia';
