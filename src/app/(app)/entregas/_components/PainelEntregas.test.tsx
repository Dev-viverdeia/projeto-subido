import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ResumoProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { PainelEntregas } from './PainelEntregas';

const EM_EXECUCAO: ResumoProjetoExecucao = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'SDR de atendimento com IA',
  empresa: 'Clínica Horizonte',
  status: 'em_execucao',
  prazoEm: '2026-09-18T12:00:00.000Z',
  atualizadoEm: '2026-08-26T12:00:00.000Z',
  feitas: 4,
  total: 10,
  proximaTarefa: 'Validar o roteiro de atendimento com o cliente',
  proximaAcaoPrazoEm: null,
  tarefasBloqueadas: 0,
  validacoesAguardando: 0,
  ajustesSolicitados: 0,
};

const CONCLUIDO: ResumoProjetoExecucao = {
  ...EM_EXECUCAO,
  id: '22222222-2222-4222-8222-222222222222',
  titulo: 'Automação de propostas',
  empresa: 'Grupo Norte',
  status: 'concluido',
  feitas: 8,
  total: 8,
  proximaTarefa: null,
};

const EVOLUCAO_AGENDADA = {
  id: '55555555-5555-4555-8555-555555555555',
  status: 'agendada' as const,
  revisaoEm: '2026-08-27',
  resultadoObservado: null,
  evidenciaResultadoUrl: null,
  decisao: null,
  proximoPasso: null,
  proximoPassoEm: null,
  compartilharCliente: false,
  registradaEm: null,
  oportunidadeContinuidadeId: null,
};

afterEach(cleanup);

describe('PainelEntregas', () => {
  it('leva o profissional à próxima ação da entrega real', () => {
    render(
      <PainelEntregas
        projetos={[EM_EXECUCAO, CONCLUIDO]}
        agora={new Date('2026-08-28T12:00:00Z')}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Entregas' })).toBeInTheDocument();
    expect(screen.getByText('Validar o roteiro de atendimento com o cliente')).toBeInTheDocument();
    expect(screen.getByLabelText('40% da entrega concluída')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Abrir entrega de Clínica Horizonte' }),
    ).toHaveAttribute('href', `/entregas/${EM_EXECUCAO.id}`);
    expect(screen.getByRole('heading', { name: 'Entregas concluídas' })).toBeInTheDocument();
  });

  it('destaca a urgência real antes da atualização mais recente', () => {
    const atrasada: ResumoProjetoExecucao = {
      ...EM_EXECUCAO,
      id: '33333333-3333-4333-8333-333333333333',
      empresa: 'Clínica Prioritária',
      atualizadoEm: '2026-08-20T12:00:00.000Z',
      proximaAcaoPrazoEm: '2026-08-27T12:00:00.000Z',
    };
    const recente: ResumoProjetoExecucao = {
      ...EM_EXECUCAO,
      id: '44444444-4444-4444-8444-444444444444',
      empresa: 'Clínica Recente',
      atualizadoEm: '2026-08-28T11:00:00.000Z',
    };

    render(
      <PainelEntregas projetos={[recente, atrasada]} agora={new Date('2026-08-28T12:00:00Z')} />,
    );

    const links = screen.getAllByRole('link', { name: /Abrir entrega de/ });
    expect(links[0]).toHaveAttribute('aria-label', 'Abrir entrega de Clínica Prioritária');
    expect(screen.getByText('Próxima ação atrasada')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fila de trabalho' })).toBeInTheDocument();
    expect(screen.getByText('1 na fila')).toBeInTheDocument();
  });

  it('explica quando a operação ainda não tem uma entrega aberta', () => {
    render(<PainelEntregas projetos={[]} />);

    expect(
      screen.getByRole('heading', { name: 'A próxima começa quando uma proposta for aceita.' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/A execução continua sendo feita por você/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver propostas/ })).toHaveAttribute(
      'href',
      '/propostas',
    );
  });

  it('traz uma revisão pós-entrega vencida para a frente da operação', () => {
    render(
      <PainelEntregas
        projetos={[EM_EXECUCAO, { ...CONCLUIDO, evolucao: EVOLUCAO_AGENDADA }]}
        agora={new Date('2026-08-28T12:00:00Z')}
      />,
    );

    expect(
      screen.getByRole('heading', { name: '1 revisão pede atenção agora.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir revisão de Grupo Norte' })).toHaveAttribute(
      'href',
      `/entregas/${CONCLUIDO.id}`,
    );
    expect(screen.getByText('Registrar resultado')).toBeInTheDocument();
    expect(screen.getAllByText(/Atrasada há 1 dia/)).toHaveLength(2);
  });

  it('mantém revisões já registradas apenas no histórico', () => {
    render(
      <PainelEntregas
        projetos={[
          {
            ...CONCLUIDO,
            evolucao: {
              ...EVOLUCAO_AGENDADA,
              status: 'registrada',
              resultadoObservado: 'Tempo médio de resposta caiu para dois minutos.',
            },
          },
        ]}
        agora={new Date('2026-08-28T12:00:00Z')}
      />,
    );

    expect(screen.queryByText('Depois da entrega')).not.toBeInTheDocument();
    expect(screen.getByText('Resultado registrado')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Nenhum projeto está em execução agora.' }),
    ).toBeInTheDocument();
  });
});
