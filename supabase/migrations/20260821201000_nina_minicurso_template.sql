-- =============================================================================
-- NINA · PRIMEIRO MINICURSO COMPLETO
--
-- O projeto de SDR vira o template editorial dos demais: aula de abertura,
-- preparacao curta, recursos de aula e implementacao nas cinco fases.
-- =============================================================================

begin;

update public.solucoes
set
  titulo = 'Nina — SDR de Atendimento e Qualificação',
  resumo = 'Aprenda, construa e entregue uma operação de atendimento que responde com fonte, qualifica por fatos e passa a conversa para uma pessoa com todo o contexto.'
where slug = 'sdr-atendimento-qualificacao';

update public.projeto_roteiros as pr
set
  roteiro = jsonb_set(
    jsonb_set(
      jsonb_set(
        pr.roteiro,
        '{trilhaDidatica,aulas,0,recursos}',
        $recursos$
        [
          {
            "tipo": "mapa_mental",
            "titulo": "Mapa da conversa da Nina",
            "descricao": "Visualize os estados da conversa e o que precisa acontecer para o atendimento avançar com segurança.",
            "conteudo": "ENTRADA\n→ identificar canal, contato e intenção\n\nATENDIMENTO\n→ responder somente com fonte aprovada\n→ fazer uma pergunta por vez\n\nQUALIFICAÇÃO\n→ registrar fatos, evidências e lacunas\n\nAGENDA\n→ consultar disponibilidade real\n\nPASSAGEM HUMANA\n→ enviar resumo, histórico, responsável e prazo\n\nENCERRAMENTO\n→ registrar resultado e próximo passo"
          },
          {
            "tipo": "quiz",
            "titulo": "Você desenhou uma conversa segura?",
            "descricao": "Use cinco perguntas rápidas para revisar a jornada antes de configurar qualquer ferramenta.",
            "conteudo": "1. Cada estado tem uma condição clara de entrada e saída?\n2. A Nina sabe quando não responder?\n3. Toda informação comercial aponta para uma fonte aprovada?\n4. A passagem humana carrega contexto, responsável e prazo?\n5. Uma falha de integração interrompe a conversa sem inventar um resultado?\n\nSe alguma resposta for não, corrija o desenho antes de construir."
          }
        ]
        $recursos$::jsonb,
        true
      ),
      '{trilhaDidatica,aulas,1,recursos}',
      $recursos$
      [
        {
          "tipo": "ebook",
          "titulo": "Guia prático de qualificação por fatos",
          "descricao": "Transforme o perfil de cliente ideal em perguntas, respostas aceitas, evidências e decisões auditáveis.",
          "conteudo": "QUALIFICAÇÃO POR FATOS\n\nPara cada critério, documente:\n1. O fato que precisa ser conhecido.\n2. A pergunta usada para descobri-lo.\n3. A fonte ou evidência que confirma a resposta.\n4. O efeito daquele fato na rota comercial.\n5. O comportamento seguro quando o dado não aparecer.\n\nNunca complete uma lacuna com intuição. Marque o que ainda não foi confirmado e leve a pergunta para a próxima conversa."
        },
        {
          "tipo": "modelo",
          "titulo": "Matriz de qualificação copiável",
          "descricao": "Preencha o critério, a pergunta, a evidência exigida e o próximo movimento permitido na jornada.",
          "conteudo": "Critério:\nPor que importa:\nPergunta que será feita:\nResposta aceita:\nEvidência necessária:\nEfeito na rota:\nSe o dado não aparecer:\nResponsável por revisar:\n\nRepita este bloco para cada critério do perfil de cliente ideal."
        }
      ]
      $recursos$::jsonb,
      true
    ),
    '{trilhaDidatica,aulas,2,recursos}',
    $recursos$
    [
      {
        "tipo": "modelo",
        "titulo": "Matriz de testes do piloto",
        "descricao": "Registre entrada, resposta esperada, limite de segurança, evidência, correção e reteste antes da ativação.",
        "conteudo": "Cenário:\nTipo: comum, ambíguo, crítico ou falha de integração\nEntrada do contato:\nContexto disponível:\nResposta esperada:\nO que não pode acontecer:\nDeve passar para uma pessoa?\nEvidência registrada:\nResultado:\nCorreção aplicada:\nReteste aprovado por:"
      },
      {
        "tipo": "quiz",
        "titulo": "Piloto pronto para um cliente real?",
        "descricao": "Confirme os limites mínimos de segurança e operação antes de abrir o canal para contatos reais.",
        "conteudo": "1. A base de conhecimento tem responsável e versão?\n2. Preço, agenda e políticas vêm de fontes reais?\n3. Os cenários críticos passam imediatamente para uma pessoa?\n4. O CRM evita contatos e eventos duplicados?\n5. Toda falha produz uma evidência reproduzível?\n6. O cliente aprovou os critérios de pausa?\n\nA ativação só acontece quando todas as respostas forem sim."
      }
    ]
    $recursos$::jsonb,
    true
  ),
  versao = pr.versao + 1
from public.solucoes as s
where pr.projeto_id = s.id
  and s.slug = 'sdr-atendimento-qualificacao';

commit;
