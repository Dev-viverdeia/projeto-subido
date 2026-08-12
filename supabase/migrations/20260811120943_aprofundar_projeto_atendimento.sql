-- =============================================================================
-- PROJETO 01 · ATENDIMENTO COM IA NO WHATSAPP · V2
--
-- Mantém o método enxuto em cinco fases e dez passos, mas transforma cada passo
-- em uma unidade realmente executável: insumos, microações, alerta e modelo.
-- O JSON continua retrocompatível; os demais projetos recebem o mesmo nível de
-- profundidade em migrações próprias, depois que este primeiro método for usado.
-- =============================================================================

update public.projeto_roteiros as pr
set
  roteiro = $atendimento_v2${
    "fundamentos": [
      {
        "titulo": "Venda uma operação, não um robô",
        "descricao": "O cliente compra menos espera, respostas consistentes e uma passagem humana que não perde contexto. A IA é uma parte invisível desse resultado."
      },
      {
        "titulo": "A base aprovada é a verdade",
        "descricao": "A IA só responde com informações revisadas pelo cliente. Quando a base não sustenta uma resposta, o fluxo pergunta ou transfere — nunca completa a lacuna."
      },
      {
        "titulo": "Toda conversa deixa um fato",
        "descricao": "Mensagem, intenção, transferência, responsável e desfecho ficam registrados. É isso que permite provar qualidade e melhorar a operação depois da entrega."
      }
    ],
    "fases": [
      {
        "id": "entender",
        "titulo": "Entender",
        "objetivo": "Transformar o atendimento atual em um mapa verificável antes de automatizar.",
        "passos": [
          {
            "id": "mapear-demanda",
            "titulo": "Medir a demanda real",
            "acao": "Use conversas reais para descobrir volume, horários, assuntos e gargalos. Esta leitura define o que vale automatizar primeiro e cria a linha de base que provará o resultado.",
            "concluidoQuando": "A planilha tem volume por faixa de horário, os dez assuntos mais frequentes e o tempo atual de primeira resposta.",
            "entregavel": "Mapa de demanda do atendimento.",
            "duracao": "60–90 min",
            "insumos": [
              "Exportação de sete dias de conversas do WhatsApp",
              "Horário oficial de atendimento da empresa",
              "Nome de quem hoje responde pelo canal",
              "Uma planilha vazia ou ferramenta equivalente"
            ],
            "execucao": [
              "Escolha uma semana comum, sem campanha ou feriado que distorça o volume, e exporte todas as conversas recebidas.",
              "Crie uma linha por conversa e registre data, hora da primeira mensagem, assunto principal, tempo até a primeira resposta e desfecho.",
              "Agrupe assuntos que significam a mesma coisa, como preço, valor e quanto custa, em uma única categoria clara.",
              "Conte entradas por faixa de horário e destaque as conversas recebidas fora do expediente ou abandonadas antes de uma resposta.",
              "Ordene os assuntos por frequência e valide com o responsável se os dez primeiros representam o atendimento real."
            ],
            "atencao": "Não leia mensagens isoladas e não use somente a percepção do gestor. A amostra precisa mostrar o caminho completo da conversa e um período comum da operação.",
            "modelo": {
              "titulo": "Planilha do mapa de demanda",
              "conteudo": "Data | Hora de entrada | Faixa de horário | Assunto principal | Subassunto | Primeira resposta em minutos | Resolvido no primeiro contato? | Houve transferência? | Motivo da transferência | Desfecho | Observação\n\nResumo da semana\nTotal de conversas:\n% fora do horário:\nTempo mediano da primeira resposta:\n10 assuntos mais frequentes:\n3 pontos com maior abandono:\nO primeiro recorte recomendado para automação:"
            }
          },
          {
            "id": "desenhar-limites",
            "titulo": "Definir o que a IA não decide",
            "acao": "Transforme risco e exceção em regras visíveis. Para cada situação sensível, defina quando a IA para, quem assume, em quanto tempo e qual contexto precisa chegar junto.",
            "concluidoQuando": "Toda situação de risco tem gatilho, destino, mensagem de transição e prazo humano definidos e aprovados.",
            "entregavel": "Matriz de limites e escalonamento.",
            "duracao": "45–60 min",
            "insumos": [
              "Mapa de demanda concluído",
              "Políticas de troca, cancelamento, cobrança e privacidade",
              "Lista de equipes e horários responsáveis por exceções"
            ],
            "execucao": [
              "Liste situações que envolvem dado sensível, risco jurídico, negociação, pagamento, reclamação grave ou pedido explícito por uma pessoa.",
              "Para cada situação, escreva um gatilho observável. Evite critérios vagos como caso difícil ou cliente importante.",
              "Defina a ação segura da IA: parar de responder, pedir um dado mínimo, avisar o prazo e criar a transferência.",
              "Nomeie a equipe ou pessoa responsável, o horário de cobertura e o prazo máximo para assumir a conversa.",
              "Simule cinco exemplos com o cliente e registre a aprovação de cada regra antes de construir o agente."
            ],
            "atencao": "Nunca use sentimento inferido como único gatilho de risco. Combine palavras, intenção declarada, tipo de solicitação e ausência de informação aprovada.",
            "modelo": {
              "titulo": "Matriz de limites e transferência",
              "conteudo": "Situação | Gatilho observável | O que a IA pode dizer | O que a IA não pode fazer | Destino humano | SLA | Mensagem de transição | Dados que acompanham a transferência\n\nExemplo:\nCancelamento | cliente pede cancelar ou encerrar | confirmar que entendeu e avisar a transferência | prometer estorno ou prazo não aprovado | Retenção | 15 min no horário comercial | Vou encaminhar seu pedido para a equipe responsável e manter todo o contexto aqui. | nome, contrato, motivo declarado e histórico"
            }
          }
        ]
      },
      {
        "id": "preparar",
        "titulo": "Preparar",
        "objetivo": "Organizar acessos, conhecimento e responsabilidades para a construção.",
        "passos": [
          {
            "id": "configurar-canal",
            "titulo": "Configurar o canal oficial",
            "acao": "Conecte um número controlado à plataforma oficial do WhatsApp e prove o caminho de ida e volta em ambiente de teste antes de envolver clientes reais.",
            "concluidoQuando": "Uma mensagem de teste entra, fica registrada e uma resposta autorizada retorna pelo canal oficial.",
            "entregavel": "Canal de teste conectado.",
            "duracao": "60–120 min",
            "insumos": [
              "Acesso administrativo ao portfólio empresarial da Meta",
              "Número exclusivo ou liberado para a integração",
              "URL pública com HTTPS para receber eventos",
              "Responsável do cliente que manterá o acesso depois da entrega"
            ],
            "execucao": [
              "Confirme que a empresa e o número estão sob uma conta empresarial controlada pelo cliente, não por uma conta pessoal do implementador.",
              "Crie ou selecione o aplicativo da Meta, conecte o número de teste e registre os identificadores da conta e do telefone em um cofre seguro.",
              "Configure a URL de eventos e uma chave de verificação. Assine somente os eventos necessários para mensagens e status de entrega.",
              "Envie uma mensagem do telefone de teste, confirme o recebimento do evento e responda pela API dentro da janela permitida.",
              "Documente quem tem acesso, onde as credenciais são renovadas e como trocar o responsável sem interromper o canal."
            ],
            "atencao": "Nunca cole token, chave ou senha em documento compartilhado, print ou mensagem. O cliente deve ser dono dos ativos; o implementador recebe apenas o acesso necessário.",
            "modelo": {
              "titulo": "Checklist de conexão do canal",
              "conteudo": "[ ] Empresa verificada ou processo de verificação iniciado\n[ ] Número pertence ao cliente e pode ser usado na API\n[ ] Aplicativo e conta do WhatsApp identificados\n[ ] URL de eventos usa HTTPS\n[ ] Chave de verificação guardada em cofre\n[ ] Evento de mensagem recebido uma única vez\n[ ] Resposta de teste entregue\n[ ] Status enviado, entregue e lido registrado\n[ ] Responsável e procedimento de renovação documentados\n[ ] Nenhuma credencial aparece em documento ou código público"
            }
          },
          {
            "id": "montar-base",
            "titulo": "Montar a base aprovada",
            "acao": "Converta documentos e conhecimento da equipe em respostas curtas, localizáveis e versionadas. Cada resposta precisa mostrar sua fonte, dono e data de revisão.",
            "concluidoQuando": "As dez perguntas mais frequentes têm resposta, fonte, responsável e data de revisão aprovadas pelo cliente.",
            "entregavel": "Base de conhecimento versionada.",
            "duracao": "90–150 min",
            "insumos": [
              "Dez assuntos mais frequentes do mapa de demanda",
              "Site, políticas, catálogo, horários e documentos oficiais",
              "Pessoa do cliente autorizada a aprovar respostas"
            ],
            "execucao": [
              "Crie uma pergunta canônica para cada assunto frequente e anexe variações reais de como os clientes perguntam a mesma coisa.",
              "Escreva uma resposta curta com uma ação clara. Separe fatos permanentes de valores, prazos e regras que mudam com frequência.",
              "Associe cada resposta à fonte original, ao responsável pela informação e a uma data de próxima revisão.",
              "Marque perguntas sem resposta aprovada como transferência obrigatória; não tente preencher a lacuna com conhecimento geral.",
              "Peça ao aprovador para revisar as dez respostas prioritárias e registre nome, data e observações da aprovação."
            ],
            "atencao": "Não envie documentos inteiros para o modelo e espere consistência. Unidades pequenas, com uma resposta por assunto e fonte explícita, são mais fáceis de buscar, revisar e corrigir.",
            "modelo": {
              "titulo": "Ficha de resposta aprovada",
              "conteudo": "ID:\nPergunta canônica:\nVariações reais da pergunta:\nResposta curta aprovada:\nAção ou link permitido:\nQuando não responder:\nDestino da transferência:\nFonte original:\nResponsável pela informação:\nAprovado por:\nAprovado em:\nRevisar em:\nVersão:"
            }
          }
        ]
      },
      {
        "id": "construir",
        "titulo": "Construir",
        "objetivo": "Fazer a mensagem percorrer entrada, decisão, resposta e transferência.",
        "passos": [
          {
            "id": "registrar-conversa",
            "titulo": "Registrar contato e conversa",
            "acao": "Crie uma entrada confiável: cada evento é validado, gravado uma vez e ligado ao contato e à conversa corretos antes de qualquer resposta da IA.",
            "concluidoQuando": "Reenviar o mesmo evento não duplica mensagem nem contato, e o histórico preserva origem e horário.",
            "entregavel": "Entrada idempotente e histórico completo.",
            "duracao": "2–4 h",
            "insumos": [
              "Canal de teste conectado",
              "Projeto Supabase com tabelas protegidas por usuário ou empresa",
              "Exemplos reais dos eventos recebidos da Meta"
            ],
            "execucao": [
              "Valide a assinatura e o formato do evento antes de aceitar qualquer conteúdo recebido pelo endereço público.",
              "Grave o identificador único do evento primeiro. Se ele já existir, confirme o recebimento e encerre sem repetir o processamento.",
              "Normalize o telefone, localize ou crie o contato e vincule a mensagem a uma conversa aberta do mesmo canal.",
              "Registre tipo, texto, mídia, horário do provedor, horário de entrada, direção e status sem sobrescrever o evento original.",
              "Responda rapidamente ao provedor e processe classificação e resposta fora do recebimento inicial para evitar repetição por timeout."
            ],
            "atencao": "Não gere a resposta antes de registrar o evento. Se a IA demorar ou falhar e o provedor reenviar a mensagem, o cliente pode receber respostas duplicadas.",
            "modelo": {
              "titulo": "Contrato mínimo do evento",
              "conteudo": "evento_id: identificador único do provedor\nempresa_id: dono da operação\ncontato_id: contato normalizado\nconversa_id: conversa aberta do canal\ncanal: whatsapp\ndirecao: entrada ou saida\ntipo: texto, imagem, áudio ou documento\nconteudo: texto ou referência privada da mídia\nocorrido_em: horário informado pelo provedor\nrecebido_em: horário da plataforma\nstatus: recebido, processando, respondido, transferido ou falhou\nerro_codigo: vazio quando não houver erro\n\nRegra: evento_id deve ser único por canal."
            }
          },
          {
            "id": "responder-transferir",
            "titulo": "Responder e transferir com contexto",
            "acao": "Classifique a intenção, recupere somente conteúdo aprovado e decida entre responder, perguntar ou transferir. A pessoa recebe o histórico e um resumo factual no mesmo lugar.",
            "concluidoQuando": "O atendente recebe conversa, resumo, motivo e prazo da transferência no mesmo painel, sem a IA continuar respondendo.",
            "entregavel": "Agente com passagem humana.",
            "duracao": "3–5 h",
            "insumos": [
              "Base de conhecimento aprovada",
              "Matriz de limites e escalonamento",
              "Entrada de mensagens estável",
              "Chave da API de IA guardada no servidor"
            ],
            "execucao": [
              "Classifique intenção e risco em uma saída estruturada. Trate baixa confiança, pedido humano e qualquer limite aprovado como transferência.",
              "Busque os trechos mais próximos na base e descarte resultados sem fonte ou abaixo do limiar definido no teste.",
              "Gere uma resposta curta que use somente os trechos recuperados, faça no máximo uma pergunta por mensagem e identifique a próxima ação.",
              "Antes de enviar, valide tamanho, presença de informação proibida e se a conversa ainda pertence à IA.",
              "Ao transferir, bloqueie novas respostas automáticas, crie a tarefa para a fila correta e anexe resumo factual, fontes usadas e motivo."
            ],
            "atencao": "Não esconda a transferência atrás de uma resposta genérica. O estado da conversa precisa mudar antes do aviso ao cliente; assim a IA não disputa o canal com o atendente.",
            "modelo": {
              "titulo": "Contrato de decisão do agente",
              "conteudo": "Retorne somente:\n{\n  \"intencao\": \"categoria aprovada\",\n  \"confianca\": 0.00,\n  \"risco\": true ou false,\n  \"acao\": \"responder | perguntar | transferir\",\n  \"motivo\": \"fato curto que explica a decisão\",\n  \"fontes\": [\"ids das respostas aprovadas\"],\n  \"destino_humano\": \"fila aprovada ou null\"\n}\n\nSe faltar fonte, a ação nunca pode ser responder. Se o cliente pedir uma pessoa, a ação sempre é transferir."
            }
          }
        ]
      },
      {
        "id": "validar",
        "titulo": "Validar",
        "objetivo": "Provar que o fluxo responde bem e falha de forma segura.",
        "passos": [
          {
            "id": "rodar-cenarios",
            "titulo": "Rodar vinte cenários",
            "acao": "Teste o caminho feliz e, principalmente, os limites. Compare resultado esperado e real, guarde evidências e transforme cada falha em uma correção verificável.",
            "concluidoQuando": "Todos os cenários críticos transferem corretamente, nenhum inventa informação e cada reprovação tem correção registrada.",
            "entregavel": "Relatório de testes com evidências.",
            "duracao": "90–120 min",
            "insumos": [
              "Canal de teste com o fluxo completo",
              "Base e limites aprovados",
              "Duas pessoas: uma testa e outra observa o painel"
            ],
            "execucao": [
              "Prepare vinte casos antes de testar: cinco comuns, cinco ambíguos, cinco críticos e cinco de falha técnica ou operacional.",
              "Para cada caso, escreva a entrada, a resposta ou ação esperada e o critério objetivo de aprovação.",
              "Execute pelo WhatsApp como um cliente real e salve mensagem, horário, fontes recuperadas, decisão e resultado no painel.",
              "Marque aprovado ou reprovado sem flexibilizar o critério depois de ver a resposta. Corrija base, limite ou fluxo conforme a causa.",
              "Repita todos os críticos e todos os reprovados. Registre a versão final e peça o aceite do responsável do cliente."
            ],
            "atencao": "Não teste apenas perguntas que já existem na base. O comportamento mais importante é o que acontece quando a informação falta, o cliente insiste ou uma integração falha.",
            "modelo": {
              "titulo": "Matriz de vinte cenários",
              "conteudo": "ID | Categoria | Mensagem de entrada | Contexto anterior | Resultado esperado | Fonte esperada | Deve transferir? | Resultado real | Aprovado? | Evidência | Correção | Reteste\n\nDistribuição mínima:\n01–05 dúvidas frequentes\n06–08 perguntas ambíguas\n09–10 informação ausente\n11–13 cancelamento, cobrança ou dado sensível\n14–15 cliente irritado ou pedido humano\n16 evento duplicado\n17 canal ou IA indisponível\n18 atendente offline\n19 troca de turno\n20 duas mensagens rápidas na mesma conversa"
            }
          },
          {
            "id": "validar-operacao",
            "titulo": "Validar a fila humana",
            "acao": "Faça a equipe operar transferências reais simuladas. Valide dono, alerta, prazo, resposta, retomada e encerramento sem ajuda do implementador.",
            "concluidoQuando": "A equipe conclui três transferências, incluindo troca de turno e atendente offline, sem conversa órfã ou resposta duplicada.",
            "entregavel": "Aceite operacional da equipe.",
            "duracao": "45–60 min",
            "insumos": [
              "Dois atendentes e um responsável pela operação",
              "Acesso de teste com os mesmos perfis usados no dia a dia",
              "Três conversas simuladas com destinos diferentes"
            ],
            "execucao": [
              "Transfira uma conversa comum e confirme se o atendente recebe alerta, contexto, motivo e prazo em uma única tela.",
              "Deixe o atendente designado offline e confira se a conversa vai para uma fila coberta ou mostra o estado de espera ao responsável.",
              "Troque o dono durante o atendimento e valide que só uma pessoa e nenhum agente automático podem responder por vez.",
              "Encerre a conversa, registre o desfecho e reabra com uma nova mensagem para confirmar o comportamento definido pelo cliente.",
              "Peça à equipe para repetir os três caminhos sem orientação e registre o aceite, as dúvidas e os ajustes finais."
            ],
            "atencao": "Treinamento não é demonstração. Quem vai operar precisa usar o próprio acesso e concluir as ações; assistir ao implementador clicar não comprova autonomia.",
            "modelo": {
              "titulo": "Termo de aceite operacional",
              "conteudo": "Fluxo testado | Pessoa que executou | Resultado | Dúvida ou ajuste | Reteste | Aceite\n\n[ ] Transferência comum com contexto\n[ ] Pedido explícito por atendente\n[ ] Atendente designado offline\n[ ] Troca de turno\n[ ] Resposta simultânea bloqueada\n[ ] Encerramento e nova mensagem\n[ ] Desfecho registrado\n\nResponsável pelo aceite:\nData:\nPendências com dono e prazo:"
            }
          }
        ]
      },
      {
        "id": "entregar",
        "titulo": "Entregar",
        "objetivo": "Colocar no ar com controle, responsáveis e revisão marcada.",
        "passos": [
          {
            "id": "publicar-controlado",
            "titulo": "Publicar para uma faixa controlada",
            "acao": "Ative um piloto pequeno, acompanhe cada conversa e mantenha um retorno simples ao atendimento humano. O objetivo é aprender com risco limitado, não ligar tudo de uma vez.",
            "concluidoQuando": "O primeiro lote termina sem conversa órfã, sem resposta duplicada e com todos os eventos e falhas registrados.",
            "entregavel": "Entrada em produção controlada.",
            "duracao": "1 dia acompanhado",
            "insumos": [
              "Cenários críticos e aceite operacional aprovados",
              "Responsável humano presente durante o piloto",
              "Critérios claros para pausar, ampliar ou voltar ao fluxo anterior"
            ],
            "execucao": [
              "Escolha um recorte fácil de observar: um horário, uma equipe, um assunto ou uma origem com volume controlado.",
              "Registre volume esperado, duração do piloto, responsável pelo acompanhamento e condições que obrigam a pausa imediata.",
              "Ative o fluxo e confira ao vivo as primeiras dez conversas, incluindo resposta, transferência, status de entrega e desfecho.",
              "Anote falhas e dúvidas sem editar a operação silenciosamente. Mudanças importantes precisam de motivo, horário e versão registrados.",
              "Ao final, compare o lote com os critérios e decida com o cliente entre corrigir, repetir o piloto ou ampliar o recorte."
            ],
            "atencao": "Não faça lançamento total fora do horário da equipe ou sem alguém capaz de pausar o agente. O primeiro dia precisa de observação humana explícita.",
            "modelo": {
              "titulo": "Plano do piloto controlado",
              "conteudo": "Recorte do piloto:\nData e horário:\nVolume esperado:\nResponsável técnico:\nResponsável da operação:\nCanal para incidentes:\n\nPausar imediatamente se:\n- houver resposta sem fonte aprovada\n- ocorrer duplicidade de mensagem\n- uma situação crítica não for transferida\n- uma conversa ficar sem dono além do SLA\n\nPara ampliar, precisa:\n- zero falha crítica\n- 100% das conversas com histórico\n- transferências dentro do SLA acordado\n- aceite do responsável da operação\n\nDecisão final: corrigir | repetir | ampliar"
            }
          },
          {
            "id": "entregar-manual",
            "titulo": "Entregar operação e indicadores",
            "acao": "Passe a operação para o cliente com responsabilidades, rotinas e indicadores simples. A entrega termina quando a equipe consegue manter e revisar o atendimento sem depender do implementador.",
            "concluidoQuando": "Responsáveis, acessos, rotina, indicadores, contingência e primeira data de revisão estão registrados e aceitos.",
            "entregavel": "Manual e agenda de acompanhamento.",
            "duracao": "60–90 min",
            "insumos": [
              "Resultado e aprendizados do piloto",
              "Lista final de acessos, filas e responsáveis",
              "Base aprovada e histórico de versões",
              "Agenda do responsável pela revisão"
            ],
            "execucao": [
              "Organize um manual curto com visão da operação, responsáveis, acessos, rotina diária, revisão da base e plano de contingência.",
              "Treine quem revisa conteúdo, quem acompanha a fila, quem decide mudanças e quem recebe um incidente fora do horário.",
              "Entregue um painel com volume, tempo de primeira resposta, resolução, transferência, falhas e assuntos sem resposta aprovada.",
              "Faça o cliente executar a revisão de uma resposta, a pausa do agente e a troca de um responsável usando o manual.",
              "Marque a primeira revisão com data, participantes e pauta. Registre pendências finais com dono e prazo antes do aceite."
            ],
            "atencao": "Não entregue apenas código, logins ou vídeo gravado. O ativo do cliente é a operação compreensível: regras, fontes, responsabilidades, contingência e rotina de melhoria.",
            "modelo": {
              "titulo": "Índice do manual de operação",
              "conteudo": "1. Resultado e escopo entregue\n2. Canais, ambientes e responsáveis\n3. Como a conversa entra e muda de estado\n4. O que a IA responde e o que sempre transfere\n5. Como revisar e publicar uma resposta da base\n6. Como acompanhar e assumir a fila humana\n7. Como pausar o agente e operar a contingência\n8. Indicadores semanais\n9. Incidentes conhecidos e recuperação\n10. Acessos, propriedade e renovação\n11. Pendências finais com dono e prazo\n12. Agenda da primeira revisão\n\nIndicadores mínimos:\nVolume | primeira resposta | resolução | transferência | falha | assunto sem base | satisfação disponível"
            }
          }
        ]
      }
    ]
  }$atendimento_v2$::jsonb,
  versao = 2
from public.solucoes as s
where s.id = pr.projeto_id
  and s.slug = 'atendimento-com-ia-no-whatsapp';

delete from public.solucao_itens as si
using public.solucoes as s
where s.id = si.solucao_id
  and s.slug = 'atendimento-com-ia-no-whatsapp'
  and si.tipo in ('ferramenta', 'prompt');

insert into public.solucao_itens (solucao_id, tipo, ordem, titulo, conteudo)
select s.id, item.tipo, item.ordem, item.titulo, item.conteudo
from public.solucoes as s
cross join (values
  ('ferramenta', 1, 'WhatsApp Business Platform', 'Canal oficial para receber mensagens, responder e acompanhar os estados de entrega.'),
  ('ferramenta', 2, 'Supabase', 'Banco protegido de contatos, conversas, base de conhecimento, filas e eventos.'),
  ('ferramenta', 3, 'OpenAI API', 'Classificação, busca contextual, resposta estruturada e resumo para a passagem humana.'),
  ('ferramenta', 4, 'Vercel', 'Publicação do painel e dos serviços que recebem e processam os eventos do canal.'),
  ('prompt', 1, 'Agente de atendimento', 'Você atende em nome da empresa usando somente as fontes aprovadas recebidas no contexto. Responda de forma curta, direta e coerente com a conversa. Faça no máximo uma pergunta por mensagem. Nunca invente política, preço, prazo, disponibilidade ou ação já realizada. Se faltar uma fonte suficiente, se houver um limite de risco, se o cliente pedir uma pessoa ou se a confiança for baixa, não tente concluir: sinalize a passagem humana e preserve o contexto.'),
  ('prompt', 2, 'Classificador de intenção e risco', 'Leia a mensagem e o contexto sem responder ao cliente. Retorne somente intenção aprovada, confiança de zero a um, risco verdadeiro ou falso, ação entre responder, perguntar e transferir, motivo factual, fontes necessárias e fila humana indicada. Pedido explícito por atendente sempre transfere. Informação ausente nunca permite responder. Não infira dado sensível, urgência ou sentimento como fato.'),
  ('prompt', 3, 'Resumo para transferência', 'Resuma somente fatos visíveis na conversa em: objetivo declarado pelo cliente, dados já confirmados, respostas e fontes usadas, tentativas realizadas, motivo da transferência, pendência e próxima ação esperada. Não repita dado sensível desnecessário, não inclua hipótese e não atribua emoção que o cliente não declarou.')
) as item(tipo, ordem, titulo, conteudo)
where s.slug = 'atendimento-com-ia-no-whatsapp';
