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
  it('orienta contexto e primeira call logo após o cadastro', () => {
    render(<JornadaEntradaLead {...BASE} estadoContexto="pendente" totalCalls={0} />);

    expect(screen.getByRole('heading', { name: 'Prepare a primeira conversa.' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Completar contexto' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Agendar primeira call' })).toHaveAttribute(
      'href',
      `/calls?nova=1&oportunidade=${BASE.oportunidadeId}`,
    );
    expect(screen.getByText('Lead no pipeline')).toBeVisible();
  });

  it('encerra a preparação quando contexto e call já existem', () => {
    render(<JornadaEntradaLead {...BASE} estadoContexto="pronto" totalCalls={1} />);

    expect(screen.queryByRole('button', { name: 'Completar contexto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Agendar primeira call' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir dossiê' })).toHaveAttribute(
      'href',
      `/crm/${BASE.oportunidadeId}`,
    );
  });
});
