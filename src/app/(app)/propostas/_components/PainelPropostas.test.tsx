import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { ResumoProposta } from '@/lib/propostas/queries';
import { PainelPropostas } from './PainelPropostas';

const PROPOSTAS: ResumoProposta[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Atendimento da Clínica Aurora',
    status: 'rascunho',
    versao: 1,
    atualizadoEm: '2026-08-20T12:00:00.000Z',
    criadoEm: '2026-08-20T12:00:00.000Z',
    empresa: 'Clínica Aurora',
    projeto: 'Atendimento com IA',
    valorCentavos: 1200000,
    compartilhadaEm: null,
    ultimaVisualizacaoEm: null,
    visualizacoes: 0,
    decididaEm: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Qualificação comercial da Orbe',
    status: 'apresentada',
    versao: 2,
    atualizadoEm: '2026-08-19T12:00:00.000Z',
    criadoEm: '2026-08-18T12:00:00.000Z',
    empresa: 'Orbe',
    projeto: 'SDR com IA',
    valorCentavos: 2400000,
    compartilhadaEm: '2026-08-19T12:00:00.000Z',
    ultimaVisualizacaoEm: '2026-08-19T14:00:00.000Z',
    visualizacoes: 2,
    decididaEm: null,
  },
];

afterEach(cleanup);

describe('PainelPropostas', () => {
  it('filtra rascunhos e propostas enviadas sem duplicar a biblioteca', async () => {
    const usuario = userEvent.setup();
    render(<PainelPropostas propostas={PROPOSTAS} />);

    expect(screen.getByRole('heading', { name: 'Biblioteca comercial' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nova proposta' })).toHaveAttribute(
      'href',
      '/propostas/nova',
    );
    const arquivo = screen.getByRole('region', { name: 'Suas propostas' });
    expect(within(arquivo).getByText('Clínica Aurora')).toBeInTheDocument();
    expect(within(arquivo).getByText('Orbe')).toBeInTheDocument();

    await usuario.click(screen.getByRole('tab', { name: 'Rascunhos, 1' }));
    expect(within(arquivo).getByText('Clínica Aurora')).toBeInTheDocument();
    expect(within(arquivo).queryByText('Orbe')).not.toBeInTheDocument();
    expect(within(arquivo).getByText('Editar proposta')).toBeInTheDocument();

    await usuario.click(screen.getByRole('tab', { name: 'Enviadas, 1' }));
    expect(within(arquivo).getByText('Orbe')).toBeInTheDocument();
    expect(within(arquivo).getByText('Enviada')).toBeInTheDocument();
    expect(within(arquivo).getByText('Cliente visualizou')).toBeInTheDocument();
    expect(within(arquivo).getByText('Acompanhar decisão')).toBeInTheDocument();

    expect(screen.queryByText('Valor enviado')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Decididas, 0' })).toBeInTheDocument();
  });

  it('mostra um estado vazio útil sem duplicar a criação da primeira proposta', () => {
    render(<PainelPropostas propostas={[]} />);

    expect(screen.getByText('Nenhuma proposta criada ainda')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Nova proposta' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Criar proposta/ })).toHaveAttribute(
      'href',
      '/propostas/nova',
    );
  });

  it('busca por empresa, proposta ou projeto e permite limpar o filtro', async () => {
    const usuario = userEvent.setup();
    render(<PainelPropostas propostas={PROPOSTAS} />);

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar propostas' }), 'Orbe');
    expect(screen.getByText('Orbe')).toBeInTheDocument();
    expect(screen.queryByText('Clínica Aurora')).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(screen.getByText('Clínica Aurora')).toBeInTheDocument();
  });
});
