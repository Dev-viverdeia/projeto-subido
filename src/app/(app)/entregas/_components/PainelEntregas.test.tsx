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

afterEach(cleanup);

describe('PainelEntregas', () => {
  it('leva o profissional à próxima ação da entrega real', () => {
    render(<PainelEntregas projetos={[EM_EXECUCAO, CONCLUIDO]} />);

    expect(screen.getByRole('heading', { name: 'Entregas dos clientes' })).toBeInTheDocument();
    expect(screen.getByText('Validar o roteiro de atendimento com o cliente')).toBeInTheDocument();
    expect(screen.getByLabelText('40% da entrega concluída')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Abrir entrega de Clínica Horizonte' }),
    ).toHaveAttribute('href', `/entregas/${EM_EXECUCAO.id}`);
    expect(screen.getByRole('heading', { name: 'Entregas concluídas' })).toBeInTheDocument();
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
});
