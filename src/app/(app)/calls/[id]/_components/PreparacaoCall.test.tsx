import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PosCall } from '@/lib/calls/queries';
import { PreparacaoCall } from './PreparacaoCall';

const POS_CALL = {
  operacoes: [],
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
    expect(
      screen.getByRole('heading', { name: 'Como os contatos são distribuídos hoje?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Canal principal: WhatsApp')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ficha do cliente/ })).toHaveAttribute(
      'href',
      '/vendas/oportunidade-1',
    );
    expect(screen.getByRole('link', { name: /Entrar na reunião/ })).toHaveAttribute(
      'href',
      '/sala/sala-horizonte',
    );
    expect(screen.getByText('Live Coach ativado para esta reunião')).toBeInTheDocument();
  });

  it('liga o kickoff ao acordo e ao projeto que começa depois da reunião', () => {
    const kickoff: PosCall = {
      ...POS_CALL,
      reuniao: { ...POS_CALL.reuniao, tipo: 'kickoff', titulo: 'Kickoff do atendimento' },
      oportunidade: { ...POS_CALL.oportunidade, etapa: 'ganho' },
      sincronizacao: {
        ...POS_CALL.sincronizacao,
        projetoAtivo: { id: 'projeto-1', titulo: 'SDR da Clínica Horizonte' },
      },
    };

    render(<PreparacaoCall posCall={kickoff} />);

    expect(screen.getByText('Acordo que precisa sair da reunião')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Acordos essenciais' })).toBeInTheDocument();
    expect(screen.getByLabelText('Continuidade do kickoff')).toHaveTextContent(
      'Projeto em execução',
    );
    expect(screen.getByText('SDR da Clínica Horizonte')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abrir projeto/ })).toHaveAttribute(
      'href',
      '/entregas/projeto-1',
    );
    expect(screen.getByRole('link', { name: /Entrar no kickoff/ })).toHaveAttribute(
      'href',
      '/sala/sala-horizonte',
    );
  });

  it('não diz que o coach está ativado quando foi desligado e mantém a edição', () => {
    render(
      <PreparacaoCall
        posCall={{
          ...POS_CALL,
          contato: null,
          reuniao: { ...POS_CALL.reuniao, liveCoachAtivo: false },
        }}
      />,
    );
    expect(screen.queryByText(/Live Coach/)).not.toBeInTheDocument();
    expect(screen.queryByText('Cargo não informado')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alterar reunião' })).toHaveAttribute(
      'href',
      '/reunioes?editar=call-1',
    );
    expect(screen.getByText(/Brasília/)).toHaveTextContent('14:00');
  });

  it('revela todos os fatos e mantém hipóteses e projetos separados', async () => {
    const user = userEvent.setup();
    render(
      <PreparacaoCall
        posCall={{
          ...POS_CALL,
          preparacao: {
            ...POS_CALL.preparacao,
            plano: {
              ...POS_CALL.preparacao.plano,
              fatos: [
                'WhatsApp oficial',
                'Duas equipes',
                'Terceiro fato completo',
                'Quarto fato completo',
              ],
            },
          },
        }}
      />,
    );
    expect(screen.getByText('Terceiro fato completo')).not.toBeVisible();
    await user.click(screen.getByText('Mais informações'));
    expect(screen.getByText('Terceiro fato completo')).toBeVisible();
    expect(screen.getByText('Quarto fato completo')).toBeVisible();
    expect(screen.getByText('Perda de leads fora do horário')).not.toBeVisible();
    await user.click(screen.getByText('Hipóteses a confirmar'));
    expect(screen.getByText('Perda de leads fora do horário')).toBeVisible();
    expect(screen.getByText('SDR de atendimento com IA')).not.toBeVisible();
    await user.click(screen.getByText('Projetos em análise'));
    expect(screen.getByText('SDR de atendimento com IA')).toBeVisible();
  });

  it.each([false, true])(
    'a ausência de fatos não presume pesquisa inexistente: enriquecida=%s',
    (temEnriquecimento) => {
      render(
        <PreparacaoCall
          posCall={{
            ...POS_CALL,
            preparacao: {
              temEnriquecimento,
              plano: {
                ...POS_CALL.preparacao.plano,
                origem: temEnriquecimento ? 'enriquecimento' : 'base',
                fatos: [],
              },
            },
          }}
        />,
      );
      expect(
        screen.getByText(
          temEnriquecimento
            ? 'Ainda não há informações no roteiro.'
            : 'A ficha ainda não foi enriquecida.',
        ),
      ).toBeVisible();
      expect(
        screen.getByRole('link', {
          name: temEnriquecimento ? 'Consultar ficha' : 'Enriquecer na ficha',
        }),
      ).toHaveAttribute('href', '/vendas/oportunidade-1');
      expect(screen.getByRole('link', { name: 'Entrar na reunião' })).toBeVisible();
    },
  );
});
