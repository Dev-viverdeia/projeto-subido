import { cleanup, render, screen, within } from '@testing-library/react';
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
  },
];

afterEach(cleanup);

describe('PainelPropostas', () => {
  it('separa claramente rascunhos de propostas enviadas', () => {
    render(<PainelPropostas propostas={PROPOSTAS} />);

    expect(screen.getByRole('heading', { name: 'Biblioteca comercial' })).toBeInTheDocument();

    const rascunhos = screen.getByRole('region', { name: 'Rascunhos' });
    expect(within(rascunhos).getByText('Clínica Aurora')).toBeInTheDocument();
    expect(within(rascunhos).getByText('Continuar edição')).toBeInTheDocument();

    const enviadas = screen.getByRole('region', { name: 'Propostas enviadas' });
    expect(within(enviadas).getByText('Orbe')).toBeInTheDocument();
    expect(within(enviadas).getByText('Enviada')).toBeInTheDocument();
    expect(within(enviadas).getByText('Ver proposta')).toBeInTheDocument();

    expect(screen.queryByText('Valor enviado')).not.toBeInTheDocument();
    expect(screen.queryByText('Aprovadas')).not.toBeInTheDocument();
  });

  it('mostra estados vazios úteis sem esconder a criação da primeira proposta', () => {
    render(<PainelPropostas propostas={[]} />);

    expect(screen.getByText('Nenhuma proposta em rascunho.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma proposta enviada ainda.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Criar proposta/ })).toHaveAttribute(
      'href',
      '/propostas/nova',
    );
  });
});
