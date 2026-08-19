import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { JornadaEntradaLead } from './JornadaEntradaLead';

vi.mock('./FormularioEnriquecimento', () => ({
  FormularioEnriquecimento: ({ rotulo }: { rotulo?: string }) => (
    <button type="button">{rotulo}</button>
  ),
}));

const BASE = {
  oportunidadeId: '11111111-1111-4111-8111-111111111111',
  empresaNome: 'Clínica Aurora',
  dominio: null,
  linkedin: null,
};

describe('JornadaEntradaLead', () => {
  it('leva primeiro à pesquisa logo após o cadastro', () => {
    render(<JornadaEntradaLead {...BASE} estadoContexto="pendente" totalCalls={0} />);

    expect(screen.getByRole('heading', { name: 'Prepare a primeira conversa.' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pesquisar empresa' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Agendar primeira call' })).not.toBeInTheDocument();
    expect(screen.getByText('Oportunidade no pipeline')).toBeVisible();
  });

  it('libera a primeira call quando a pesquisa termina', () => {
    render(<JornadaEntradaLead {...BASE} estadoContexto="pronto" totalCalls={0} />);

    expect(screen.queryByRole('button', { name: 'Pesquisar empresa' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Agendar primeira call' })).toHaveAttribute(
      'href',
      `/calls?nova=1&oportunidade=${BASE.oportunidadeId}`,
    );
  });

  it('encerra a preparação quando contexto e call já existem', () => {
    render(<JornadaEntradaLead {...BASE} estadoContexto="pronto" totalCalls={1} />);

    expect(screen.queryByRole('button', { name: 'Pesquisar empresa' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Agendar primeira call' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir oportunidade' })).toHaveAttribute(
      'href',
      `/crm/${BASE.oportunidadeId}`,
    );
  });

  it('leva o Projeto escolhido para a proposta quando a preparação termina', () => {
    render(
      <JornadaEntradaLead
        {...BASE}
        estadoContexto="pronto"
        totalCalls={1}
        projetoSlug="sdr-atendimento-qualificacao"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Pesquise a empresa e prepare a proposta.' }),
    ).toBeVisible();
    expect(screen.getByText('Montar a proposta')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Montar proposta' })).toHaveAttribute(
      'href',
      `/propostas/nova?oportunidade=${BASE.oportunidadeId}&projeto=sdr-atendimento-qualificacao`,
    );
  });
});
