import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PosCall } from '@/lib/calls/queries';
import { PreparacaoCall } from './PreparacaoCall';

const POS_CALL = {
  reuniao: {
    id: 'call-1',
    titulo: 'Descoberta da Clínica Horizonte',
    tipo: 'descoberta',
    status: 'agendada',
    agendadaPara: '2026-09-10T17:00:00.000Z',
    iniciadaEm: null,
    encerradaEm: null,
    duracaoMinutos: 45,
    liveCoachAtivo: true,
    codigoPublico: 'sala-horizonte',
  },
  empresa: { nome: 'Clínica Horizonte', setor: 'Saúde', porte: 'Médio' },
  contato: { nome: 'Marina Alves', cargo: 'Diretora de Operações' },
  oportunidade: {
    id: 'oportunidade-1',
    titulo: 'SDR de atendimento',
    etapa: 'descoberta',
    proximaAcao: null,
    proximaAcaoEm: null,
  },
  analise: null,
  transcricao: null,
  gravacao: null,
  coach: [],
  preparacao: {
    temEnriquecimento: true,
    plano: {
      origem: 'enriquecimento',
      objetivo: 'Confirmar se o SDR resolve a perda de contatos.',
      abertura: 'Quero entender como o atendimento funciona hoje.',
      perguntas: [
        {
          etapa: 'processo',
          pergunta: 'Como os contatos são distribuídos hoje?',
          intencao: 'Entender o gargalo.',
          projetoRelacionado: 'SDR de atendimento',
        },
      ],
      fechamento: {
        sinalParaAvancar: 'Dor e impacto confirmados.',
        frase: 'Faz sentido desenhar um piloto?',
        proximoPasso: 'Marcar reunião técnica.',
      },
      fatos: ['Canal principal: WhatsApp'],
      hipoteses: ['Perda de leads fora do horário'],
      projetos: ['SDR de atendimento com IA'],
    },
  },
  sincronizacao: {
    historicoCrm: false,
    acoesPlano: [],
    projetoAtivo: null,
    propostaDaCall: null,
  },
} satisfies PosCall;

describe('PreparacaoCall', () => {
  it('organiza objetivo, perguntas e ações antes de abrir a reunião', () => {
    render(<PreparacaoCall posCall={POS_CALL} />);

    expect(
      screen.getByRole('heading', { name: POS_CALL.preparacao.plano.objetivo }),
    ).toBeInTheDocument();
    expect(screen.getByText('Como os contatos são distribuídos hoje?')).toBeInTheDocument();
    expect(screen.getByText('Canal principal: WhatsApp')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ficha do cliente/ })).toHaveAttribute(
      'href',
      '/vendas/oportunidade-1',
    );
    expect(screen.getByRole('link', { name: /Entrar na reunião/ })).toHaveAttribute(
      'href',
      '/sala/sala-horizonte',
    );
    expect(screen.getByText('Live Coach preparado')).toBeInTheDocument();
  });
});
