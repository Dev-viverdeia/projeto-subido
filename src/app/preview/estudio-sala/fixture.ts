import type { SolucaoBuilder } from '@/lib/builder/queries';

/** Somente dados sintéticos, sem integrações ou clientes reais. */
export const projetoEstudioPreview: SolucaoBuilder = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Atendimento e qualificação com IA',
  ideiaOriginal: 'Organizar o primeiro atendimento de uma clínica de demonstração.',
  respostas: [],
  documento: {
    titulo: 'Atendimento e qualificação com IA',
    resumo: 'Receba contatos no WhatsApp, confirme o interesse e encaminhe para a equipe.',
    viabilidade: {
      nivel: 'moderada',
      justificativa: 'Depende do canal oficial e de uma base de respostas aprovada pela equipe.',
    },
    arquitetura:
      'O contato inicia uma conversa no WhatsApp. A IA consulta a base aprovada e coleta as informações de qualificação.\n\nO fluxo encaminha os contatos para uma pessoa, com histórico e próximo passo registrados. Falhas na agenda seguem para atendimento humano.',
    ferramentas: [
      { nome: 'WhatsApp Business', papel: 'Canal oficial de atendimento.', custo: 'paga' },
      {
        nome: 'Supabase',
        papel: 'Guardar dados, respostas e histórico do atendimento.',
        custo: 'freemium',
      },
    ],
    etapas: [
      {
        titulo: 'Mapear o atendimento',
        descricao:
          'Converse com a equipe e registre as perguntas frequentes, os responsáveis e os horários de atendimento.',
        ferramentas: [],
        fase: 1,
      },
      {
        titulo: 'Aprovar as respostas',
        descricao:
          'Reúna serviços, preços e dúvidas frequentes em uma base revisada pela equipe. Separe o que pode ser respondido automaticamente do que precisa de uma pessoa.',
        ferramentas: ['Supabase'],
        fase: 1,
      },
      {
        titulo: 'Construir o fluxo',
        descricao:
          'Conecte o canal oficial à base aprovada.\n\nImplemente a coleta de informações, a confirmação de interesse e a passagem para o responsável.\n\nTeste mensagens incompletas e a indisponibilidade da agenda. Quando não houver resposta segura, encaminhe para uma pessoa com o histórico completo.',
        ferramentas: ['WhatsApp Business', 'Supabase'],
        fase: 2,
      },
      {
        titulo: 'Testar com a equipe',
        descricao:
          'Execute conversas de teste e confira respostas, permissões e passagem humana. Registre as falhas encontradas antes de ativar o atendimento.',
        ferramentas: [],
        fase: 2,
      },
      {
        titulo: 'Entregar o manual',
        descricao:
          'Documente acessos, limites, manutenção e responsáveis. Confira o manual junto à equipe.',
        ferramentas: [],
        fase: 3,
      },
      {
        titulo: 'Acompanhar a primeira semana',
        descricao:
          'Revise as primeiras conversas e combine os ajustes com o cliente. Registre o resultado antes de concluir esta tarefa.',
        ferramentas: [],
        fase: 3,
      },
    ],
    prompts: [
      {
        titulo: 'Revisar a passagem humana',
        conteudo:
          'Revise o fluxo e identifique situações que precisam de uma pessoa. Não invente respostas nem dados.\n\nVerifique falha na agenda, ausência de informações e pedido explícito de atendimento humano.',
      },
    ],
    riscos: [
      {
        risco: 'Resposta fora da base aprovada',
        mitigacao: 'Restringir respostas ao conteúdo revisado e encaminhar dúvidas sem resposta.',
      },
    ],
    economia: {
      horas_por_mes: 12,
      premissas: [
        'Estimativa ilustrativa: 120 contatos por mês.',
        'Seis minutos de trabalho manual por contato.',
      ],
    },
    fora_do_escopo: ['Fechamento comercial autônomo.'],
  },
  documentoIlegivel: false,
  status: 'pronta',
  erro: null,
  modelo: 'preview',
  criadoEm: '2026-09-01T12:00:00.000Z',
  oportunidadeId: null,
  projetoBaseId: null,
  stack: null,
  tarefas: { 0: 'feito', 1: 'feito', 2: 'fazendo' },
};
