import { describe, expect, it } from 'vitest';
import {
  idAulaProjeto,
  idPassoProjeto,
  idsAulasProjeto,
  idsPassosProjeto,
  lerRoteiroProjeto,
} from './roteiro';

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

function recursosAulaTeste() {
  return [
    {
      tipo: 'mapa_mental' as const,
      titulo: 'Mapa do projeto',
      descricao: 'Organize as decisões e os limites que orientam esta parte do trabalho.',
      conteudo: 'Entrada → decisão → execução → revisão → entrega ao cliente',
    },
    {
      tipo: 'quiz' as const,
      titulo: 'Pode avançar?',
      descricao: 'Revise se as condições necessárias foram confirmadas antes do próximo passo.',
      conteudo: 'Os dados, responsáveis, limites e critérios de aceite estão documentados?',
    },
  ];
}

const videoReferenciaTeste = {
  titulo: 'Solução de referência',
  descricao: 'Uma demonstração real da experiência, da execução e do resultado esperado.',
  videoUrl: 'https://video.example.com/embed/123',
};

describe('roteiro de Projeto', () => {
  it('aceita as cinco fases na ordem do método', () => {
    const roteiro = lerRoteiroProjeto(roteiroValido());
    expect(roteiro?.fases.map((fase) => fase.id)).toEqual(ids);
    expect(roteiro?.fundamentos).toEqual([]);
  });

  it('aceita um minicurso completo com aulas, recursos e implementação', () => {
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
            recursos: recursosAulaTeste(),
          },
        ],
        videosReferencia: [videoReferenciaTeste],
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

  it('rejeita minicurso sem vídeo ou sem recursos práticos em cada aula', () => {
    const valor = roteiroValido();
    Object.assign(valor, {
      trilhaDidatica: {
        tempoTotal: '20 minutos',
        aulas: [
          {
            titulo: 'Entenda o projeto',
            objetivo: 'Aprender o resultado antes de configurar a entrega para o cliente.',
            duracao: '8 min',
            topicos: ['Resultado esperado', 'Limites da entrega'],
            exercicio: 'Explique a entrega em uma frase objetiva e verificável.',
            prontoQuando: 'A entrega ficou clara, limitada e verificável.',
          },
          {
            titulo: 'Prepare a execução',
            objetivo: 'Separar os insumos necessários para iniciar o piloto com segurança.',
            duracao: '12 min',
            topicos: ['Insumos necessários', 'Pessoas responsáveis'],
            exercicio: 'Liste os acessos e as pessoas responsáveis pela validação.',
            prontoQuando: 'Os insumos e responsáveis foram confirmados.',
          },
        ],
        videosReferencia: [],
        demonstracao: {
          titulo: 'Caso de referência',
          contexto: 'Uma empresa precisa validar o primeiro fluxo antes de colocar no ar.',
          passos: [
            {
              etapa: 'Entrada',
              oQueAcontece: 'O caso é registrado com os dados necessários.',
              evidencia: 'Registro com horário',
            },
            {
              etapa: 'Processamento',
              oQueAcontece: 'O fluxo executa a regra aprovada pelo cliente.',
              evidencia: 'Resultado rastreável',
            },
            {
              etapa: 'Revisão',
              oQueAcontece: 'Uma pessoa confirma o resultado antes do uso.',
              evidencia: 'Aceite do responsável',
            },
            {
              etapa: 'Fechamento',
              oQueAcontece: 'A evidência final fica anexada à entrega.',
              evidencia: 'Entrega registrada',
            },
          ],
          resultadoEsperado: 'O piloto termina com evidência e aceite do responsável.',
        },
        materiais: [
          {
            titulo: 'Briefing do projeto',
            quandoUsar: 'Antes da primeira conversa com o cliente.',
            conteudo: 'Objetivo:\nProblema:\nResponsável:\nResultado esperado:',
          },
          {
            titulo: 'Checklist do piloto',
            quandoUsar: 'Antes de ativar o primeiro fluxo em ambiente controlado.',
            conteudo: '[ ] Insumos confirmados\n[ ] Responsável definido\n[ ] Teste documentado',
          },
          {
            titulo: 'Termo de aceite',
            quandoUsar: 'Ao concluir o piloto com a pessoa responsável.',
            conteudo: 'Entrega:\nCritérios atendidos:\nPendências:\nAceite do responsável:',
          },
        ],
      },
    });

    expect(lerRoteiroProjeto(valor)).toBeNull();
  });

  it('gera ids estáveis de progresso a partir da identidade editorial', () => {
    const roteiro = lerRoteiroProjeto(roteiroValido());
    expect(roteiro).not.toBeNull();
    expect(idPassoProjeto('crm-comercial', 'entender', 'mapear-jornada')).toBe(
      'projeto:crm-comercial:entender:mapear-jornada',
    );
    expect(idsPassosProjeto('crm-comercial', roteiro!)).toHaveLength(5);
  });

  it('mantém o progresso das aulas separado dos passos de implementação', () => {
    const valor = roteiroValido();
    Object.assign(valor, {
      trilhaDidatica: {
        tempoTotal: '20 minutos',
        aulas: [
          {
            titulo: 'Entenda o projeto',
            objetivo: 'Aprender o resultado antes de configurar a entrega.',
            duracao: '8 min',
            topicos: ['Resultado esperado', 'Limites da entrega'],
            exercicio: 'Explique a entrega em uma frase.',
            prontoQuando: 'A entrega ficou clara e verificável.',
            recursos: recursosAulaTeste(),
          },
          {
            titulo: 'Prepare a execução',
            objetivo: 'Separar os insumos necessários para iniciar o piloto.',
            duracao: '12 min',
            topicos: ['Insumos necessários', 'Pessoas responsáveis'],
            exercicio: 'Liste os acessos e as pessoas responsáveis.',
            prontoQuando: 'Os insumos e responsáveis foram confirmados.',
            recursos: recursosAulaTeste(),
          },
        ],
        videosReferencia: [videoReferenciaTeste],
        demonstracao: {
          titulo: 'Caso de referência',
          contexto: 'Uma empresa precisa validar o primeiro fluxo.',
          passos: [
            {
              etapa: 'Entrada',
              oQueAcontece: 'O caso é registrado.',
              evidencia: 'Registro com horário',
            },
            {
              etapa: 'Processamento',
              oQueAcontece: 'O fluxo executa a regra aprovada.',
              evidencia: 'Resultado rastreável',
            },
            {
              etapa: 'Revisão',
              oQueAcontece: 'Uma pessoa confirma o resultado.',
              evidencia: 'Aceite do responsável',
            },
            {
              etapa: 'Fechamento',
              oQueAcontece: 'A evidência fica anexada.',
              evidencia: 'Entrega registrada',
            },
          ],
          resultadoEsperado: 'O piloto termina com evidência e aceite.',
        },
        materiais: [
          {
            titulo: 'Briefing do projeto',
            quandoUsar: 'Antes da primeira conversa com o cliente.',
            conteudo: 'Objetivo:\nProblema:\nResponsável:\nResultado esperado:',
          },
          {
            titulo: 'Checklist do piloto',
            quandoUsar: 'Antes de ativar o primeiro fluxo em ambiente controlado.',
            conteudo: '[ ] Insumos confirmados\n[ ] Responsável definido\n[ ] Teste documentado',
          },
          {
            titulo: 'Termo de aceite',
            quandoUsar: 'Na validação final da entrega com o cliente.',
            conteudo: 'Resultado entregue:\nEvidências:\nPendências:\nResponsável pelo aceite:',
          },
        ],
      },
    });

    const roteiro = lerRoteiroProjeto(valor);
    expect(roteiro).not.toBeNull();
    expect(idAulaProjeto('crm-comercial', 0)).toBe('projeto:crm-comercial:aprender:aula-01');
    expect(idsAulasProjeto('crm-comercial', roteiro!)).toEqual([
      'projeto:crm-comercial:aprender:aula-01',
      'projeto:crm-comercial:aprender:aula-02',
    ]);
    expect(idsAulasProjeto('crm-comercial', roteiro!)).not.toContain(
      'projeto:crm-comercial:entender:passo-entender',
    );
  });
});
