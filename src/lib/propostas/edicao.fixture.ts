import type { EdicaoProposta } from './edicao';

/** Dados sintéticos usados somente nos testes de edição. */
export const EDICAO_TESTE: EdicaoProposta = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Atendimento da empresa de teste',
  versao: 2,
  status: 'rascunho',
  documento: {
    cliente: { empresa: 'Empresa de teste', contato: null, cargo: null, email: null },
    projeto: {
      titulo: 'Atendimento com IA',
      resumo: 'Organizar o atendimento da equipe.',
      origem: 'sem_base',
    },
    desafio: 'A equipe precisa organizar o primeiro atendimento.',
    objetivo: 'Reduzir o tempo de resposta da equipe.',
    escopo: [{ titulo: 'Atendimento', descricao: 'Implementar o primeiro atendimento.' }],
    entregaveis: ['Agente testado'],
    cronograma: [
      {
        fase: 'Configuração',
        duracao: 'Uma semana',
        descricao: 'Configuração e testes do agente.',
      },
    ],
    investimento: { valorCentavos: 100000, condicoes: 'Na entrega do projeto.' },
    validadeDias: 10,
    proximosPassos: ['Validar escopo'],
    observacoes: null,
  },
};
