import { describe, expect, it } from 'vitest';
import { idPassoProjeto, idsPassosProjeto, lerRoteiroProjeto } from './roteiro';

const ids = ['entender', 'preparar', 'construir', 'validar', 'entregar'] as const;

function roteiroValido() {
  return {
    fases: ids.map((id) => ({
      id,
      titulo: id[0]!.toUpperCase() + id.slice(1),
      objetivo: `Objetivo suficientemente detalhado para a fase ${id}.`,
      passos: [
        {
          id: `passo-${id}`,
          titulo: `Executar ${id}`,
          acao: `Realize uma ação verificável e detalhada durante a fase ${id}.`,
          concluidoQuando: 'Existe uma evidência objetiva e revisada pelo cliente.',
          entregavel: `Entrega da fase ${id}`,
        },
      ],
    })),
  };
}

describe('roteiro de Projeto', () => {
  it('aceita as cinco fases na ordem do método', () => {
    const roteiro = lerRoteiroProjeto(roteiroValido());
    expect(roteiro?.fases.map((fase) => fase.id)).toEqual(ids);
    expect(roteiro?.fundamentos).toEqual([]);
  });

  it('aceita guia aprofundado sem tornar o novo conteúdo obrigatório nos projetos antigos', () => {
    const valor = roteiroValido();
    Object.assign(valor, {
      fundamentos: [
        {
          titulo: 'Automatize com limite',
          descricao:
            'A IA responde somente a partir da base aprovada e transfere situações de risco.',
        },
      ],
      perfil: {
        nivel: 'entrada',
        prazo: '5 a 10 dias úteis',
        formatoPiloto: 'Um gatilho, um canal e uma equipe responsável pela recuperação.',
        primeiraProva: 'Trinta respostas processadas com alertas rastreáveis e relatório revisado.',
        recomendadoParaComecar: true,
      },
      escopo: {
        inclui: [
          'Coleta após um evento definido',
          'Classificação com evidência',
          'Alerta com dono',
        ],
        preRequisitos: ['Base de clientes autorizada', 'Pessoa responsável pela recuperação'],
        naoInclui: ['Disparo sem consentimento', 'Resposta autônoma ao cliente'],
        evolucoes: ['Adicionar novos momentos da jornada'],
      },
      artefatosEntrega: [
        { titulo: 'Mapa', descricao: 'Gatilhos, perguntas, canais e responsáveis aprovados.' },
        { titulo: 'Matriz', descricao: 'Temas, urgência, evidência e regras de alerta.' },
        { titulo: 'Manual', descricao: 'Rotina, contingência e revisão da operação.' },
      ],
      trilhaDidatica: {
        tempoTotal: '25 a 35 minutos',
        aulas: [
          {
            titulo: 'Escolha o momento certo',
            objetivo: 'Definir um único momento da jornada e a decisão que a resposta deve apoiar.',
            duracao: '8 min',
            topicos: ['Evento que inicia a pesquisa', 'Público elegível e exclusões'],
            exercicio: 'Escolha um evento real e escreva qual decisão a resposta deve melhorar.',
            prontoQuando:
              'O momento, o público, a pergunta e o responsável foram aprovados pelo cliente.',
            recursos: [
              {
                tipo: 'mapa_mental',
                titulo: 'Do evento à decisão',
                descricao: 'Visualize como a resposta chega à pessoa responsável pela ação.',
                conteudo: 'Evento → pergunta → resposta → alerta → ação → fechamento',
              },
              {
                tipo: 'quiz',
                titulo: 'Pesquisa pronta?',
                descricao: 'Confirme o objetivo, o público e a ação antes do primeiro envio.',
                conteudo: 'A empresa sabe o que fará com cada faixa de resposta recebida?',
              },
            ],
          },
          {
            titulo: 'Feche o retorno',
            objetivo: 'Organizar o alerta humano e registrar o desfecho da recuperação do cliente.',
            duracao: '10 min',
            topicos: ['Alerta com dono e prazo', 'Ação e desfecho na mesma linha do tempo'],
            exercicio: 'Simule uma resposta crítica e acompanhe o caso até o fechamento humano.',
            prontoQuando: 'O alerta tem fonte, responsável, prazo, contato e desfecho registrados.',
          },
        ],
        videosReferencia: [
          {
            titulo: 'Solução de referência',
            descricao: 'Uma demonstração real da experiência de coleta, leitura e fechamento.',
            videoUrl: 'https://video.example.com/embed/123',
          },
        ],
        demonstracao: {
          titulo: 'Da resposta ao fechamento',
          contexto: 'Uma cliente responde à pesquisa com nota baixa e um comentário sobre espera.',
          passos: [
            {
              etapa: 'Resposta',
              oQueAcontece: 'A nota e o comentário original são preservados antes da análise.',
              evidencia: 'Comentário e horário',
            },
            {
              etapa: 'Leitura',
              oQueAcontece: 'O tema é classificado com um trecho de evidência do comentário.',
              evidencia: 'Tema e trecho citado',
            },
            {
              etapa: 'Alerta',
              oQueAcontece: 'A pessoa responsável recebe o contexto e o prazo de retorno.',
              evidencia: 'Dono e prazo',
            },
            {
              etapa: 'Fechamento',
              oQueAcontece: 'O contato e a ação ficam registrados no relatório da campanha.',
              evidencia: 'Desfecho atualizado',
            },
          ],
          resultadoEsperado:
            'A fala original, a ação humana e o fechamento permanecem rastreáveis.',
        },
        materiais: [
          {
            titulo: 'Briefing do radar',
            quandoUsar: 'Na primeira conversa para definir o recorte do piloto.',
            conteudo: 'Objetivo:\nMomento da jornada:\nPergunta:\nResponsável:\nPrazo:',
          },
          {
            titulo: 'Taxonomia',
            quandoUsar: 'Antes de configurar a classificação dos comentários.',
            conteudo: 'Tema | Definição | Exemplos | Urgência | Evidência exigida',
          },
          {
            titulo: 'Checklist de aceite',
            quandoUsar: 'No piloto para aprovar coleta, leitura, alerta e fechamento.',
            conteudo: '[ ] Resposta preservada\n[ ] Alerta com dono\n[ ] Fechamento registrado',
          },
        ],
      },
    });
    Object.assign(valor.fases[0]!.passos[0]!, {
      duracao: '45–60 min',
      insumos: ['Conversas reais do atendimento'],
      execucao: ['Exporte uma amostra representativa das conversas do canal.'],
      atencao: 'Não use uma semana atípica como retrato definitivo da operação.',
      modelo: {
        titulo: 'Planilha de demanda',
        conteudo: 'Data | horário | assunto | tempo de primeira resposta | desfecho',
      },
    });

    const roteiro = lerRoteiroProjeto(valor);
    expect(roteiro?.fundamentos).toHaveLength(1);
    expect(roteiro?.perfil?.recomendadoParaComecar).toBe(true);
    expect(roteiro?.escopo?.naoInclui).toHaveLength(2);
    expect(roteiro?.artefatosEntrega).toHaveLength(3);
    expect(roteiro?.trilhaDidatica?.aulas).toHaveLength(2);
    expect(roteiro?.trilhaDidatica?.aulas[0]?.recursos).toHaveLength(2);
    expect(roteiro?.trilhaDidatica?.videosReferencia).toHaveLength(1);
    expect(roteiro?.trilhaDidatica?.materiais).toHaveLength(3);
    expect(roteiro?.fases[0]?.passos[0]?.execucao).toHaveLength(1);
    expect(roteiro?.fases[1]?.passos[0]?.execucao).toEqual([]);
  });

  it('rejeita roteiro com fase fora de ordem sem derrubar a página', () => {
    const invalido = roteiroValido();
    [invalido.fases[0], invalido.fases[1]] = [invalido.fases[1]!, invalido.fases[0]!];
    expect(lerRoteiroProjeto(invalido)).toBeNull();
  });

  it('gera ids estáveis de progresso a partir da identidade editorial', () => {
    const roteiro = lerRoteiroProjeto(roteiroValido());
    expect(roteiro).not.toBeNull();
    expect(idPassoProjeto('crm-comercial', 'entender', 'mapear-jornada')).toBe(
      'projeto:crm-comercial:entender:mapear-jornada',
    );
    expect(idsPassosProjeto('crm-comercial', roteiro!)).toHaveLength(5);
  });
});
