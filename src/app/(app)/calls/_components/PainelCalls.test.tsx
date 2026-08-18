import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReuniaoCall } from '@/lib/calls/queries';

vi.mock('./FormularioAgendarCall', () => ({
  FormularioAgendarCall: () => <button type="button">Agendar call</button>,
}));

vi.mock('./AcoesSala', () => ({
  AcoesSala: ({ codigo }: { codigo: string }) => <a href={`/sala/${codigo}`}>Abrir sala</a>,
}));

import { PainelCalls } from './PainelCalls';

function reuniao(parcial: Partial<ReuniaoCall> & Pick<ReuniaoCall, 'id' | 'titulo'>): ReuniaoCall {
  return {
    id: parcial.id,
    titulo: parcial.titulo,
    tipo: parcial.tipo ?? 'descoberta',
    status: parcial.status ?? 'agendada',
    agendadaPara: parcial.agendadaPara ?? '2026-08-10T13:00:00.000Z',
    duracaoMinutos: parcial.duracaoMinutos ?? 45,
    codigoPublico: parcial.codigoPublico ?? parcial.id,
    liveCoachAtivo: parcial.liveCoachAtivo ?? true,
    oportunidadeId: parcial.oportunidadeId ?? 'oportunidade-1',
    oportunidade: parcial.oportunidade ?? 'Automação do atendimento',
    empresa: parcial.empresa ?? 'Clínica Horizonte',
    contato: parcial.contato ?? 'Marina Costa',
    criadaEm: parcial.criadaEm ?? '2026-08-09T12:00:00.000Z',
  };
}

describe('PainelCalls', () => {
  it('coloca a próxima call em destaque sem duplicá-la na agenda', () => {
    render(
      <PainelCalls
        oportunidades={[]}
        reunioes={[
          reuniao({ id: 'call-1', titulo: 'Descoberta Horizonte' }),
          reuniao({
            id: 'call-2',
            titulo: 'Proposta Horizonte',
            tipo: 'proposta',
            agendadaPara: '2026-08-11T13:00:00.000Z',
          }),
          reuniao({
            id: 'call-3',
            titulo: 'Kickoff concluído',
            tipo: 'kickoff',
            status: 'concluida',
            agendadaPara: '2026-08-08T13:00:00.000Z',
          }),
        ]}
      />,
    );

    const destaque = screen.getByRole('region', { name: 'Descoberta Horizonte' });
    expect(within(destaque).getByText('Sua próxima call')).toBeInTheDocument();
    expect(screen.getAllByText('Descoberta Horizonte')).toHaveLength(1);

    const agenda = screen.getByRole('region', { name: 'Depois desta' });
    expect(within(agenda).getByText('Proposta Horizonte')).toBeInTheDocument();
    expect(within(agenda).queryByText('Descoberta Horizonte')).not.toBeInTheDocument();

    expect(screen.getByRole('region', { name: 'O que fica salvo' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Histórico' })).toHaveTextContent(
      'Kickoff concluído',
    );
  });

  it('confirma a sala recém-criada sem duplicá-la na agenda', () => {
    render(
      <PainelCalls
        oportunidades={[]}
        agendadaId="call-2"
        reunioes={[
          reuniao({ id: 'call-1', titulo: 'Descoberta Horizonte' }),
          reuniao({
            id: 'call-2',
            titulo: 'Proposta Horizonte',
            tipo: 'proposta',
            oportunidadeId: 'oportunidade-2',
            oportunidade: 'Agente de vendas',
            agendadaPara: '2026-08-11T13:00:00.000Z',
          }),
        ]}
      />,
    );

    const confirmacao = screen.getByRole('region', { name: 'Proposta Horizonte' });
    expect(within(confirmacao).getByText('Call pronta')).toBeInTheDocument();
    expect(within(confirmacao).getByText('Agente de vendas')).toBeInTheDocument();
    expect(within(confirmacao).getByRole('link', { name: /Abrir lead/ })).toHaveAttribute(
      'href',
      '/crm/oportunidade-2',
    );
    expect(screen.getAllByText('Proposta Horizonte')).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Descoberta Horizonte' })).toBeInTheDocument();
  });
});
