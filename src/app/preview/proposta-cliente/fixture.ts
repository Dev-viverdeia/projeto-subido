import type { PropostaPublica } from '@/lib/propostas/portal';

export const PROPOSTA_PREVIEW: PropostaPublica = {
  id: '00000000-0000-4000-8000-000000000000',
  titulo: 'Atendimento com IA',
  status: 'apresentada',
  versao: 2,
  compartilhadaEm: '2026-09-11T15:00:00Z',
  decididaEm: null,
  decisaoNome: null,
  decisaoComentario: null,
  documento: {
    fornecedor: {
      nomeResponsavel: 'Marina Costa',
      nomeNegocio: 'Estúdio Horizonte',
      email: 'marina@example.com',
      telefone: '(11) 99999-0000',
      site: null,
      logoUrl: null,
    },
    cliente: {
      empresa: 'Clínica Aurora',
      contato: 'Camila Rios',
      cargo: 'Diretora',
      email: 'camila@example.com',
    },
    projeto: {
      titulo: 'Atendimento com IA para sua clínica',
      resumo:
        'Um assistente no WhatsApp para responder dúvidas, organizar a triagem e encaminhar cada conversa à recepção.',
      origem: 'catalogo',
    },
    desafio: 'A recepção repete a mesma triagem e acumula contatos fora do horário de atendimento.',
    objetivo:
      'Reduzir o tempo de primeira resposta e manter a equipe no controle das conversas que precisam de atendimento humano.',
    escopo: [
      {
        titulo: 'Mapeamento do atendimento',
        descricao:
          'Revisão das conversas e definição das regras de triagem, horários e transferência para a recepção.',
      },
      {
        titulo: 'Assistente no WhatsApp',
        descricao:
          'Configuração da base de conhecimento e das respostas, com limites definidos e transferência para uma pessoa.',
      },
      {
        titulo: 'Testes e treinamento da equipe',
        descricao:
          'Validação com conversas de teste, orientação da recepção e acompanhamento do início da operação.',
      },
    ],
    entregaveis: [
      'Fluxo de atendimento documentado',
      'Assistente configurado e testado',
      'Manual e treinamento da recepção',
    ],
    cronograma: [
      {
        fase: 'Desenho do atendimento',
        duracao: 'Semana 1',
        descricao: 'Mapear perguntas, definir as regras e aprovar o fluxo com a equipe.',
      },
      {
        fase: 'Construção e testes',
        duracao: 'Semanas 2 e 3',
        descricao: 'Configurar o assistente, conectar os sistemas e testar os encaminhamentos.',
      },
      {
        fase: 'Entrega e treinamento',
        duracao: 'Semana 4',
        descricao: 'Treinar a recepção e acompanhar o início do atendimento.',
      },
    ],
    investimento: {
      valorCentavos: 1850000,
      condicoes: '50% no início e 50% após a validação do projeto.',
      linkPagamento: 'https://example.com/pagamento',
    },
    validadeDias: 15,
    proximosPassos: [
      'Definir a data de início com a equipe',
      'Liberar os acessos combinados',
      'Realizar a reunião de abertura',
    ],
    observacoes:
      'Mensalidades de ferramentas e consumo de APIs não estão inclusos. Os custos serão apresentados antes da contratação.',
  },
};
