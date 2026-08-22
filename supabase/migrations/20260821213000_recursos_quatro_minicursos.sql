-- =============================================================================
-- QUATRO MINICURSOS COMPLETOS
--
-- A Nina definiu o padrão editorial: cada aula combina explicação, exercício,
-- critério de avanço e recursos que o profissional usa no trabalho. Este
-- follow-up aplica o mesmo padrão aos outros quatro projetos sem alterar os IDs
-- das aulas, fases ou passos já usados pelo progresso das contas.
-- =============================================================================

begin;

with recursos(slug, aula_1, aula_2, aula_3) as (
  values
    (
      'maquina-prospeccao-b2b',
      $aula$
      [
        {
          "tipo": "mapa_mental",
          "titulo": "Do ICP à lista pesquisável",
          "descricao": "Veja como uma definição comercial vira filtro, fonte, evidência e decisão de entrada na lista.",
          "conteudo": "OFERTA\n→ projeto que será vendido\n\nICP\n→ tipo de empresa\n→ região\n→ tamanho ou estrutura observável\n\nCRITÉRIOS\n→ campo que pode ser pesquisado\n→ fonte capaz de confirmar\n→ regra quando o dado não aparece\n\nEXCLUSÕES\n→ condição objetiva que remove a empresa\n\nSINAIS DE MOMENTO\n→ evento recente com data e validade\n\nLISTA\n→ empresa única\n→ critérios com evidência\n→ lacunas visíveis\n→ motivo para trabalhar ou descartar"
        },
        {
          "tipo": "quiz",
          "titulo": "Seu ICP pode ser pesquisado?",
          "descricao": "Revise se os filtros podem ser confirmados por fontes públicas antes de consumir créditos.",
          "conteudo": "1. O tipo de empresa está escrito sem adjetivos vagos?\n2. Cada critério aponta para um campo observável?\n3. Existe ao menos uma fonte possível para cada campo?\n4. As exclusões podem ser verificadas sem opinião?\n5. Dado ausente permanece como desconhecido?\n6. Perfil e sinal recente estão separados?\n\nSe alguma resposta for não, ajuste o ICP antes de iniciar a busca."
        }
      ]
      $aula$::jsonb,
      $aula$
      [
        {
          "tipo": "ebook",
          "titulo": "Guia de dados com procedência",
          "descricao": "Organize identidade, fonte, validade e divergência sem completar lacunas com suposição.",
          "conteudo": "DADOS COM PROCEDÊNCIA\n\nIDENTIDADE PRIMEIRO\nUse domínio, CNPJ ou outro identificador estável antes de enriquecer. Nome comercial sozinho não impede duplicidade.\n\nCADA CAMPO PRECISA DE\n1. Valor encontrado.\n2. URL ou fonte de origem.\n3. Data da coleta.\n4. Prazo de validade esperado.\n5. Regra para divergência.\n\nQUANDO AS FONTES DISCORDAM\nPreserve os dois valores, identifique a fonte mais adequada ao campo e registre o motivo da escolha.\n\nQUANDO NÃO HÁ DADO\nMantenha o campo vazio e diga o que ainda precisa ser confirmado. Não use a IA para inventar porte, cargo, contato ou intenção."
        },
        {
          "tipo": "modelo",
          "titulo": "Ficha de identidade da empresa",
          "descricao": "Compare fontes, escolha a chave de deduplicação e registre cada dado usado na lista.",
          "conteudo": "EMPRESA\nNome comercial:\nNome legal:\nDomínio principal:\nCNPJ ou identificador:\nCidade e região:\n\nDEDUPLICAÇÃO\nChave principal:\nPossíveis duplicatas:\nDecisão e motivo:\n\nDADOS\nCampo | Valor | Fonte | Coletado em | Válido até | Divergência | Decisão\n\nLACUNAS\nDados ainda não encontrados:\nComo podem ser confirmados:\nResponsável pela revisão:"
        }
      ]
      $aula$::jsonb,
      $aula$
      [
        {
          "tipo": "modelo",
          "titulo": "Score de conta reproduzível",
          "descricao": "Calcule aderência e momento em blocos separados, sempre com a evidência ao lado.",
          "conteudo": "CONTA:\nVERSÃO DO ICP:\n\nADERÊNCIA AO PERFIL\nCritério | Peso | Confirmado, não confirmado ou desconhecido | Evidência | Pontos\n\nSINAIS DE MOMENTO\nSinal | Peso | Data | Validade | Evidência | Pontos\n\nRESULTADO\nTotal de aderência:\nTotal de momento:\nCritérios desconhecidos:\nMotivo para trabalhar:\nMotivo para descartar:\nRequer revisão humana?\n\nREGRA\nDado desconhecido não soma ponto. Todo ponto precisa abrir a fonte correspondente."
        },
        {
          "tipo": "quiz",
          "titulo": "A lista está pronta para o CRM?",
          "descricao": "Confirme identidade, contato e justificativa antes de transformar uma empresa em oportunidade.",
          "conteudo": "1. A empresa aparece uma única vez?\n2. O domínio e a localização pertencem à empresa correta?\n3. Todo critério pontuado tem fonte acessível?\n4. O contato profissional pertence à pessoa e à empresa indicadas?\n5. O score pode ser recalculado manualmente?\n6. As lacunas continuam visíveis?\n7. A lista explica por que trabalhar cada conta?\n8. Nada foi enviado ou abordado automaticamente?\n\nA empresa só entra no CRM quando todas as verificações aplicáveis estiverem concluídas."
        }
      ]
      $aula$::jsonb
    ),
    (
      'inteligencia-comercial-com-ia',
      $aula$
      [
        {
          "tipo": "mapa_mental",
          "titulo": "Linha do tempo confiável da call",
          "descricao": "Acompanhe o caminho entre oportunidade, consentimento, áudio, transcrição e evidência comercial.",
          "conteudo": "OPORTUNIDADE\n→ empresa, contato, etapa e objetivo\n\nSALA\n→ participantes identificados\n→ consentimento registrado\n\nCAPTURA\n→ faixa de áudio por participante\n→ entrada, saída e falha como eventos\n\nTRANSCRIÇÃO\n→ fala, pessoa e horário preservados\n\nLEITURA\n→ fato ligado ao trecho de origem\n→ inferência separada\n\nREVISÃO\n→ vendedor confirma ou rejeita\n\nCRM\n→ somente fatos e ações confirmadas"
        },
        {
          "tipo": "quiz",
          "titulo": "A captura pode sustentar uma decisão?",
          "descricao": "Revise privacidade, identidade e rastreabilidade antes da primeira call piloto.",
          "conteudo": "1. A call está ligada à oportunidade correta?\n2. Todos os participantes foram identificados?\n3. O consentimento acontece antes da gravação?\n4. Cada fala preserva participante e horário?\n5. A política de acesso e retenção foi aprovada?\n6. Uma falha de áudio ou transcrição fica registrada?\n7. É possível voltar da informação extraída ao trecho original?\n\nSem essas respostas, a transcrição ainda não é uma fonte confiável para o CRM."
        }
      ]
      $aula$::jsonb,
      $aula$
      [
        {
          "tipo": "ebook",
          "titulo": "Live Coach que sabe ficar em silêncio",
          "descricao": "Converta o playbook em sugestões curtas que aparecem somente quando ajudam a conversa.",
          "conteudo": "LIVE COACH ÚTIL\n\nUMA DICA PRECISA DE\n1. Evidência no diálogo.\n2. Uma lacuna que ainda não foi resolvida.\n3. Uma ação curta e executável.\n4. Prioridade.\n5. Tempo de validade.\n6. Condição para ficar em silêncio.\n\nO COACH NÃO DEVE\nAvaliar personalidade, sotaque ou estilo. Inventar objeção ou urgência. Repetir uma dica já resolvida. Exibir várias ações ao mesmo tempo. Manter na tela uma sugestão que perdeu o momento.\n\nA REGRA MAIS IMPORTANTE\nSe a conversa está avançando e o vendedor já cobriu o ponto, o melhor coaching é não interromper."
        },
        {
          "tipo": "modelo",
          "titulo": "Regra de sugestão do coach",
          "descricao": "Documente o gatilho, a lacuna e o momento em que cada orientação deixa de ser útil.",
          "conteudo": "MOMENTO DA CALL:\nEvidência necessária no diálogo:\nLacuna ainda aberta:\nSugestão em uma frase:\nPrioridade:\nExpira em quantos segundos:\nOcultar quando:\nNão sugerir se:\nPlaybook de origem:\nResponsável pela aprovação:\nResultado do teste: útil, tardia ou desnecessária\nCorreção e reteste:"
        }
      ]
      $aula$::jsonb,
      $aula$
      [
        {
          "tipo": "modelo",
          "titulo": "Ficha factual pós-call",
          "descricao": "Revise cada saída da IA antes de atualizar etapa, tarefa, proposta ou follow-up.",
          "conteudo": "CALL\nEmpresa e oportunidade:\nData:\nParticipantes:\nObjetivo:\n\nFATOS CONFIRMADOS\nFato | Quem declarou | Trecho | Horário | Revisão\n\nINFERÊNCIAS\nHipótese | Evidência relacionada | Como confirmar\n\nCOMPROMISSOS\nAção | Responsável | Data declarada | Trecho | Confirmada?\n\nEFEITOS NO CRM\n[ ] Atualizar ficha do cliente\n[ ] Criar tarefa\n[ ] Mover etapa\n[ ] Preparar proposta\n[ ] Manter follow-up em rascunho\n\nRevisado por:\nAlterações humanas:\nPróxima ação aprovada:"
        },
        {
          "tipo": "quiz",
          "titulo": "O CRM pode ser atualizado?",
          "descricao": "Confirme que cada alteração comercial nasceu da call e passou por revisão humana.",
          "conteudo": "1. Cada fato cita participante, trecho e horário?\n2. Inferências estão separadas das falas?\n3. Datas e responsáveis foram realmente combinados?\n4. O pedido de proposta foi declarado pelo lead?\n5. A mudança de etapa foi revisada por uma pessoa?\n6. O follow-up continua como rascunho até o envio?\n7. Desconto, condição e prazo não foram inventados?\n\nAtualize o CRM apenas quando a resposta for sim para todos os itens aplicáveis."
        }
      ]
      $aula$::jsonb
    ),
    (
      'operacao-conteudo-multicanal',
      $aula$
      [
        {
          "tipo": "mapa_mental",
          "titulo": "Da fonte ao fragmento utilizável",
          "descricao": "Organize autoria, permissão, contexto e prova antes de gerar uma pauta.",
          "conteudo": "FONTE\n→ autoria\n→ permissão\n→ data e validade\n→ trechos sensíveis\n\nFRAGMENTO\n→ fala, fato, número, opinião ou hipótese\n→ localização exata na fonte\n→ contexto necessário\n\nVALIDAÇÃO\n→ pode publicar?\n→ precisa anonimizar?\n→ número foi conferido?\n\nBIBLIOTECA\n→ fragmentos aprovados\n→ lacunas visíveis\n→ responsável e versão\n\nPAUTA\n→ usa somente matéria-prima aprovada"
        },
        {
          "tipo": "quiz",
          "titulo": "A fonte está pronta para virar conteúdo?",
          "descricao": "Confirme origem, permissão e contexto antes de pedir qualquer texto à IA.",
          "conteudo": "1. Autor e origem estão registrados?\n2. A permissão de uso está clara?\n3. Pessoas e dados sensíveis foram tratados?\n4. Todo número tem período e fonte?\n5. A fala preserva o sentido original?\n6. Hipóteses estão marcadas como hipóteses?\n7. Existe uma pessoa responsável pela validação?\n\nSe alguma resposta for não, a fonte ainda não entra na biblioteca aprovada."
        }
      ]
      $aula$::jsonb,
      $aula$
      [
        {
          "tipo": "ebook",
          "titulo": "Tese, prova e consequência",
          "descricao": "Construa uma pauta específica ligando a posição da empresa à evidência e à decisão do público.",
          "conteudo": "UMA PAUTA FORTE TEM TRÊS PARTES\n\nTESE\nO que a empresa realmente defende. Precisa ser específica o bastante para poder ser discutida.\n\nPROVA\nO fato, fala, número ou caso aprovado que sustenta a tese. A fonte precisa abrir e impor o limite do que pode ser afirmado.\n\nCONSEQUÊNCIA\nO que muda para o público se a tese for verdadeira: uma decisão, ação ou pergunta concreta.\n\nTESTE DE QUALIDADE\nRetire a prova. Se a pauta continuar igual, ela ainda está genérica. Retire a tese. Se restar apenas informação, ainda não existe uma posição editorial."
        },
        {
          "tipo": "modelo",
          "titulo": "Cartão de pauta",
          "descricao": "Feche público, tensão, tese, prova e consequência antes de iniciar o rascunho.",
          "conteudo": "Público específico:\nSituação atual:\nTensão ou pergunta:\n\nTESE\nPosição da empresa:\nO que ela corrige ou rejeita:\n\nPROVA\nFonte principal:\nTrecho, fato ou número:\nLimite da evidência:\n\nCONSEQUÊNCIA\nO que o público deve entender:\nDecisão ou ação esperada:\n\nPEÇA\nCanal:\nFormato:\nÂngulo:\nChamada permitida:\nLacunas para o porta-voz:\nCritério para rejeitar a pauta:"
        }
      ]
      $aula$::jsonb,
      $aula$
      [
        {
          "tipo": "modelo",
          "titulo": "Checklist de adaptação por canal",
          "descricao": "Mude a forma de cada peça sem trocar tese, prova ou sentido.",
          "conteudo": "PEÇA DE ORIGEM\nTese:\nProva:\nConsequência:\nFonte:\n\nCANAL\nNome:\nPapel na jornada:\nFormato e tamanho:\nTipo de abertura:\nRitmo:\nProfundidade:\nChamada:\nElementos obrigatórios:\nElementos proibidos:\n\nREVISÃO\n[ ] A tese continua a mesma\n[ ] A prova permanece atribuída\n[ ] A peça parece nativa do canal\n[ ] A voz foi preservada\n[ ] A versão está identificada\n[ ] A publicação depende de aprovação humana"
        },
        {
          "tipo": "quiz",
          "titulo": "A peça está pronta para aprovação?",
          "descricao": "Revise fato, voz, composição e responsabilidade antes de colocar o conteúdo no calendário.",
          "conteudo": "1. A tese pertence à empresa?\n2. Toda afirmação importante abre sua fonte?\n3. Nenhum case, número ou experiência foi inventado?\n4. O texto respeita o formato do canal?\n5. A chamada combina com o objetivo da peça?\n6. A versão e o responsável estão registrados?\n7. Alguém revisou a composição final?\n8. A publicação ainda depende de aprovação explícita?\n\nA peça só vai para o calendário depois dessa revisão."
        }
      ]
      $aula$::jsonb
    ),
    (
      'radar-satisfacao-com-ia',
      $aula$
      [
        {
          "tipo": "mapa_mental",
          "titulo": "Do evento à decisão",
          "descricao": "Ligue o momento da pesquisa à pergunta, à resposta e à ação que a empresa realmente consegue executar.",
          "conteudo": "EVENTO\n→ o que aconteceu com o cliente\n\nELEGIBILIDADE\n→ quem pode receber\n→ quem deve ser excluído\n\nPERGUNTA\n→ uma métrica ou uma pergunta aberta\n→ linguagem compreensível\n\nRESPOSTA\n→ nota e comentário preservados\n\nREGRA DE AÇÃO\n→ faixa positiva, neutra ou crítica\n→ responsável e prazo\n\nFECHAMENTO\n→ contato, ação e desfecho registrados\n\nAPRENDIZADO\n→ relatório com base, período e limites"
        },
        {
          "tipo": "quiz",
          "titulo": "A pesquisa tem um objetivo real?",
          "descricao": "Confirme que a empresa sabe o que fará com cada tipo de resposta antes de enviar a primeira pergunta.",
          "conteudo": "1. Existe um evento claro que inicia a pesquisa?\n2. O público elegível e as exclusões estão definidos?\n3. A pergunta mede uma única coisa?\n4. O cliente entende por que está recebendo o contato?\n5. Frequência e opt-out foram combinados?\n6. Cada faixa de resposta tem uma ação possível?\n7. Existe responsável e prazo para casos críticos?\n\nSem uma ação possível, a pergunta ainda não deveria ser enviada."
        }
      ]
      $aula$::jsonb,
      $aula$
      [
        {
          "tipo": "ebook",
          "titulo": "Feedback sem suposição",
          "descricao": "Classifique o que foi dito sem apagar a fala do cliente nem inventar causa, intenção ou urgência.",
          "conteudo": "A RESPOSTA ORIGINAL É A FONTE\nPreserve nota, comentário e horário antes de qualquer análise.\n\nA CLASSIFICAÇÃO PRECISA MOSTRAR\n1. Tema.\n2. Trecho que sustenta o tema.\n3. Urgência conforme regra aprovada.\n4. Sentimento separado da urgência.\n5. Campos que continuam desconhecidos.\n\nNÃO CONCLUA\nA causa do problema, a intenção do cliente, um diagnóstico ou a solução necessária quando isso não aparece na fala.\n\nEM CASO DE DÚVIDA\nMarque para revisão humana e mantenha o comentário original visível."
        },
        {
          "tipo": "modelo",
          "titulo": "Regra de alerta",
          "descricao": "Defina evidência, prioridade, destino e prazo para cada situação que exige uma pessoa.",
          "conteudo": "TEMA:\nTrecho ou condição que ativa o alerta:\nNota relacionada, se houver:\nUrgência padrão:\nO que aumenta a urgência:\nO que permanece desconhecido:\nDestino responsável:\nPrazo para assumir:\nCanal de aviso:\nContexto obrigatório no alerta:\nComportamento se ninguém assumir:\nComo registrar o fechamento:\nResponsável pela regra:\nData da revisão:"
        }
      ]
      $aula$::jsonb,
      $aula$
      [
        {
          "tipo": "modelo",
          "titulo": "Ficha de recuperação do cliente",
          "descricao": "Acompanhe o alerta até o contato, a ação aprovada e o fechamento do retorno.",
          "conteudo": "RESPOSTA\nCliente:\nEvento relacionado:\nNota:\nComentário original:\nTema e trecho de evidência:\n\nALERTA\nCriado em:\nResponsável:\nPrazo:\nUrgência:\n\nCONTATO HUMANO\nCanal e horário:\nO que o cliente confirmou:\nContexto adicional:\nAção aprovada:\nResponsável pela ação:\nPrazo combinado:\n\nFECHAMENTO\nStatus:\nDesfecho:\nCliente foi informado?\nRelatório atualizado?\nFechado por:\nData:"
        },
        {
          "tipo": "quiz",
          "titulo": "O ciclo foi realmente fechado?",
          "descricao": "Confirme que o alerta virou uma ação humana registrada e voltou para o relatório.",
          "conteudo": "1. O comentário original permanece acessível?\n2. O alerta cita a evidência que o originou?\n3. Uma pessoa assumiu dentro do prazo?\n4. O contato e o contexto adicional foram registrados?\n5. A ação foi aprovada por quem tinha responsabilidade?\n6. O cliente recebeu retorno?\n7. O desfecho entrou no relatório?\n8. Hipótese e fato continuam separados?\n\nO caso só está fechado quando o histórico mostra contato, ação, responsável e desfecho."
        }
      ]
      $aula$::jsonb
    )
)
update public.projeto_roteiros as pr
set
  roteiro = jsonb_set(
    jsonb_set(
      jsonb_set(pr.roteiro, '{trilhaDidatica,aulas,0,recursos}', recursos.aula_1, true),
      '{trilhaDidatica,aulas,1,recursos}',
      recursos.aula_2,
      true
    ),
    '{trilhaDidatica,aulas,2,recursos}',
    recursos.aula_3,
    true
  ),
  versao = pr.versao + 1
from public.solucoes as s
join recursos on recursos.slug = s.slug
where pr.projeto_id = s.id;

commit;
