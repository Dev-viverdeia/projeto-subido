import type { DadosRoteiroProjeto, ItemSolucao, SolucaoResumo } from '@/lib/conteudo/queries';
import type { ContextoRotaComercialProjeto } from '@/lib/projetos/rota-comercial-modelo';

const fases = ['entender', 'preparar', 'construir', 'validar', 'entregar'] as const;

export const projetoPreview: DadosRoteiroProjeto = {
  resultado: 'Um atendimento que responde, qualifica e entrega o contexto certo para a equipe.',
  clienteIdeal: 'Empresas que recebem oportunidades pelo WhatsApp e ainda atendem manualmente.',
  entregavelFinal: 'Agente publicado, passagem humana testada e manual de operação.',
  versao: 1,
  roteiro: {
    perfil: {
      nivel: 'entrada',
      prazo: '10 a 15 dias úteis',
      formatoPiloto: 'Um canal, um serviço e uma equipe responsável.',
      primeiraProva: 'Dez conversas testadas com resposta, qualificação e passagem rastreáveis.',
      recomendadoParaComecar: true,
    },
    escopo: {
      inclui: ['Fluxo principal de atendimento', 'Passagem para uma pessoa', 'Registro no CRM'],
      preRequisitos: ['WhatsApp comercial ativo', 'Responsável para validar as respostas'],
      naoInclui: ['Decisão autônoma de alto risco', 'Integração com todos os canais'],
      evolucoes: ['Adicionar novos serviços depois do piloto'],
    },
    artefatosEntrega: [
      { titulo: 'Mapa da conversa', descricao: 'Estados, respostas e responsáveis aprovados.' },
      { titulo: 'Suíte de testes', descricao: 'Cenários, evidências e correções do piloto.' },
      { titulo: 'Manual da operação', descricao: 'Rotina, contingência e acompanhamento.' },
    ],
    trilhaDidatica: {
      tempoTotal: '35 minutos',
      aulas: [
        {
          titulo: 'Desenhe a conversa',
          objetivo: 'Entender a jornada real e decidir quando a automação deve chamar uma pessoa.',
          duracao: '12 min',
          topicos: ['Estados da conversa', 'Limites e passagem humana'],
          exercicio: 'Mapeie cinco conversas reais e marque a mudança de estado em cada uma.',
          prontoQuando: 'Cada estado tem entrada, saída, responsável e exceção documentados.',
          recursos: [
            {
              tipo: 'mapa_mental',
              titulo: 'Mapa da conversa',
              descricao: 'Veja a sequência entre entrada, qualificação e passagem humana.',
              conteudo: 'Entrada → atendimento → qualificação → passagem humana → CRM',
            },
            {
              tipo: 'quiz',
              titulo: 'Conversa pronta?',
              descricao: 'Revise os limites antes de configurar as ferramentas.',
              conteudo: 'Cada estado tem entrada, saída, responsável e limite documentados?',
            },
          ],
        },
        {
          titulo: 'Valide antes de ativar',
          objetivo: 'Testar respostas e falhas sem expor uma conversa real à automação.',
          duracao: '14 min',
          topicos: ['Cenários comuns e críticos', 'Evidência e reteste'],
          exercicio: 'Rode um cenário comum, um ambíguo e um que exija passagem humana.',
          prontoQuando: 'Os cenários deixam evidência e respeitam os limites aprovados.',
          recursos: [
            {
              tipo: 'modelo',
              titulo: 'Roteiro de validação',
              descricao: 'Registre cenário, resultado esperado, evidência e correção.',
              conteudo: 'Cenário:\nResultado esperado:\nEvidência:\nCorreção:\nReteste:',
            },
            {
              tipo: 'quiz',
              titulo: 'Pode ativar?',
              descricao: 'Confirme os testes e a passagem humana antes da ativação.',
              conteudo: 'Os cenários comuns, ambíguos e críticos foram aprovados?',
            },
          ],
        },
      ],
      videosReferencia: [
        {
          titulo: 'Implementação de referência',
          descricao: 'Acompanhe uma implementação equivalente antes de construir a sua entrega.',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      ],
      demonstracao: {
        titulo: 'Do contato ao CRM',
        contexto: 'Um novo lead chega, é qualificado e precisa chegar ao vendedor com contexto.',
        passos: [
          {
            etapa: 'Entrada',
            oQueAcontece: 'A mensagem entra na linha do tempo.',
            evidencia: 'Evento com horário',
          },
          {
            etapa: 'Atendimento',
            oQueAcontece: 'O agente responde a primeira dúvida.',
            evidencia: 'Resposta registrada',
          },
          {
            etapa: 'Passagem',
            oQueAcontece: 'A equipe recebe o histórico e a dúvida.',
            evidencia: 'Dono e resumo',
          },
          {
            etapa: 'CRM',
            oQueAcontece: 'A oportunidade nasce com próximo passo.',
            evidencia: 'Evento no CRM',
          },
        ],
        resultadoEsperado: 'A conversa chega ao vendedor completa e sem informação inventada.',
      },
      materiais: [
        {
          titulo: 'Briefing de atendimento',
          quandoUsar: 'Na primeira reunião com o cliente.',
          conteudo: 'Objetivo:\nFontes aprovadas:\nLimites:\nResponsável:',
        },
        {
          titulo: 'Matriz de qualificação',
          quandoUsar: 'Antes de escrever o comportamento.',
          conteudo: 'Critério | Pergunta | Evidência | Próximo passo',
        },
        {
          titulo: 'Checklist de ativação',
          quandoUsar: 'No aceite do piloto.',
          conteudo: '[ ] Base aprovada\n[ ] Passagem testada\n[ ] CRM validado',
        },
      ],
    },
    fundamentos: [
      {
        titulo: 'Venda a operação',
        descricao: 'O cliente compra um atendimento consistente, seguro e acompanhado por pessoas.',
      },
    ],
    fases: fases.map((id, indice) => ({
      id,
      titulo: id[0]!.toUpperCase() + id.slice(1),
      objetivo: `Tome a decisão necessária para concluir a fase de ${id} com evidência.`,
      passos: [
        {
          id: `passo-${id}`,
          titulo:
            indice === 0
              ? 'Mapear o atendimento atual'
              : ['Fechar o escopo', 'Configurar o fluxo', 'Testar os cenários', 'Ativar e treinar'][
                  indice - 1
                ]!,
          acao:
            indice === 0
              ? 'Reúna conversas reais e identifique padrões, dúvidas e momentos de passagem humana.'
              : `Execute a decisão principal da fase de ${id} e registre a evidência com o cliente.`,
          concluidoQuando: 'A evidência foi registrada e revisada pelo responsável.',
          entregavel: `Entrega da fase ${id}`,
          duracao: indice === 0 ? '45–60 min' : '30–45 min',
          insumos: indice === 0 ? ['Conversas reais do atendimento'] : [],
          execucao:
            indice === 0
              ? ['Exporte conversas representativas.', 'Organize dúvidas, respostas e desfechos.']
              : [`Conclua a tarefa da fase de ${id} com o responsável do cliente.`],
          atencao:
            indice === 0
              ? 'Não use uma semana atípica como retrato definitivo da operação.'
              : undefined,
          modelo:
            indice === 0
              ? {
                  titulo: 'Planilha de demanda',
                  conteudo: 'Data | horário | assunto | primeira resposta | desfecho',
                }
              : undefined,
        },
      ],
    })),
  },
};

function projetoResumo(
  id: string,
  slug: string,
  titulo: string,
  resultado: string,
  prazo: string,
): SolucaoResumo {
  const projeto = structuredClone(projetoPreview);
  projeto.resultado = resultado;
  projeto.roteiro.perfil = {
    ...projeto.roteiro.perfil!,
    prazo,
    recomendadoParaComecar: id === '01',
  };
  return {
    id,
    slug,
    titulo,
    resumo: resultado,
    categoria: 'Automação com IA',
    publicado_em: '2026-08-31T12:00:00.000Z',
    criado_em: '2026-08-31T12:00:00.000Z',
    etapaIds: fases.map((fase) => `projeto:${slug}:${fase}:passo-${fase}`),
    ferramentas: ['Supabase', 'OpenAI'],
    projeto,
  };
}

export const projetosPreview: SolucaoResumo[] = [
  projetoResumo(
    '01',
    'sdr-atendimento',
    'SDR de Atendimento com IA',
    projetoPreview.resultado,
    '10 a 15 dias úteis',
  ),
  projetoResumo(
    '02',
    'assistente-conhecimento',
    'Assistente de Conhecimento',
    'Respostas confiáveis a partir dos documentos da empresa.',
    '7 a 12 dias úteis',
  ),
  projetoResumo(
    '03',
    'agente-qualificacao',
    'Agente de Qualificação',
    'Leads organizados e encaminhados com contexto para o vendedor.',
    '10 a 15 dias úteis',
  ),
  projetoResumo(
    '04',
    'pos-venda-automatizado',
    'Pós-venda Automatizado',
    'Clientes acompanhados com alertas e próximos passos claros.',
    '7 a 10 dias úteis',
  ),
  projetoResumo(
    '05',
    'radar-satisfacao',
    'Radar de Satisfação',
    'Feedbacks classificados e riscos de cancelamento visíveis.',
    '5 a 10 dias úteis',
  ),
];

export const ferramentasPreview: ItemSolucao[] = [
  {
    id: 'f1',
    solucao_id: '01',
    tipo: 'ferramenta',
    ordem: 1,
    titulo: 'Supabase',
    conteudo: 'Banco e histórico do atendimento.',
  },
  {
    id: 'f2',
    solucao_id: '01',
    tipo: 'ferramenta',
    ordem: 2,
    titulo: 'OpenAI',
    conteudo: 'Interpretação e geração das respostas.',
  },
];

export const promptsPreview: ItemSolucao[] = [
  {
    id: 'p1',
    solucao_id: '01',
    tipo: 'prompt',
    ordem: 1,
    titulo: 'Atendimento inicial',
    conteudo: 'Prompt-base para responder, qualificar e encaminhar.',
  },
];

export const rotaPreview: ContextoRotaComercialProjeto = {
  oportunidadeInicialId: null,
  oportunidades: [],
};
