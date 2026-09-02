import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReuniaoCall } from '@/lib/calls/queries';

vi.mock('@/lib/calls/actions', () => ({
  reenviarConviteGoogle: vi.fn(),
  resolverReuniaoPendente: vi.fn(),
}));

vi.mock('./FormularioAgendarCall', () => ({
  FormularioAgendarCall: () => <button type="button">Agendar reunião</button>,
}));

vi.mock('./AcoesSala', () => ({
  AcoesSala: ({ codigo }: { codigo: string }) => <a href={`/sala/${codigo}`}>Abrir sala</a>,
}));

import { PainelCalls } from './PainelCalls';

const CALENDAR = {
  configurado: true,
  conectado: true,
  email: 'profissional@gmail.com',
  status: 'ativa' as const,
  ultimoErro: null,
};

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
    convidadoEmail: parcial.convidadoEmail ?? null,
    googleSyncStatus: parcial.googleSyncStatus ?? 'nao_solicitado',
    googleEventUrl: parcial.googleEventUrl ?? null,
    googleSyncErro: parcial.googleSyncErro ?? null,
    criadaEm: parcial.criadaEm ?? '2026-08-09T12:00:00.000Z',
  };
}

describe('PainelCalls', () => {
  it('leva à oportunidade antes do agendamento sem repetir o comando', () => {
    render(
      <PainelCalls
        calendar={CALENDAR}
        oportunidades={[]}
        reunioes={[]}
        agora={new Date('2026-08-09T12:00:00.000Z')}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Agendar reunião' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Adicionar oportunidade/ })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Adicionar oportunidade/ })).toHaveAttribute(
      'href',
      '/vendas',
    );
  });

  it('coloca a próxima call em destaque sem duplicá-la na agenda', () => {
    render(
      <PainelCalls
        calendar={CALENDAR}
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
        agora={new Date('2026-08-09T12:00:00.000Z')}
      />,
    );

    const destaque = screen.getByRole('region', { name: 'Descoberta Horizonte' });
    expect(within(destaque).getByText('Comece por aqui')).toBeInTheDocument();
    expect(screen.getAllByText('Descoberta Horizonte')).toHaveLength(1);

    const agenda = screen.getByRole('region', { name: 'Próximas reuniões' });
    expect(within(agenda).getByText('Proposta Horizonte')).toBeInTheDocument();
    expect(within(agenda).queryByText('Descoberta Horizonte')).not.toBeInTheDocument();

    expect(screen.getByLabelText('Memória das reuniões')).toHaveTextContent(
      'A conversa vira resumo, decisões e próximo passo na ficha do cliente.',
    );
    expect(screen.getByRole('region', { name: 'Histórico' })).toHaveTextContent(
      'Kickoff concluído',
    );
  });

  it('confirma a sala recém-criada sem duplicá-la na agenda', () => {
    render(
      <PainelCalls
        calendar={CALENDAR}
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
        agora={new Date('2026-08-09T12:00:00.000Z')}
      />,
    );

    const confirmacao = screen.getByRole('region', { name: 'Proposta Horizonte' });
    expect(within(confirmacao).getByText('Reunião pronta')).toBeInTheDocument();
    expect(within(confirmacao).getByText('Agente de vendas')).toBeInTheDocument();
    expect(within(confirmacao).getByRole('link', { name: /Abrir ficha/ })).toHaveAttribute(
      'href',
      '/vendas/oportunidade-2',
    );
    expect(screen.getAllByText('Proposta Horizonte')).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Descoberta Horizonte' })).toBeInTheDocument();
  });

  it('apresenta o kickoff como início do projeto', () => {
    render(
      <PainelCalls
        calendar={CALENDAR}
        oportunidades={[]}
        reunioes={[
          reuniao({
            id: 'kickoff-1',
            titulo: 'Kickoff do atendimento',
            tipo: 'kickoff',
          }),
        ]}
        agora={new Date('2026-08-09T12:00:00.000Z')}
      />,
    );

    const destaque = screen.getByRole('region', { name: 'Kickoff do atendimento' });
    expect(within(destaque).getByText('Início do projeto')).toBeInTheDocument();
    expect(within(destaque).getByText('Roteiro do kickoff pronto')).toBeInTheDocument();
  });

  it('separa horários vencidos da próxima agenda e pede uma decisão', () => {
    render(
      <PainelCalls
        calendar={CALENDAR}
        oportunidades={[]}
        agora={new Date('2026-08-24T15:00:00.000Z')}
        reunioes={[
          reuniao({
            id: 'call-vencida',
            titulo: 'Descoberta que não aconteceu',
            agendadaPara: '2026-08-20T13:00:00.000Z',
          }),
          reuniao({
            id: 'call-futura',
            titulo: 'Proposta da próxima semana',
            agendadaPara: '2026-08-28T13:00:00.000Z',
          }),
        ]}
      />,
    );

    expect(
      screen.getByRole('region', { name: 'Uma reunião precisa de uma decisão' }),
    ).toHaveTextContent('Descoberta que não aconteceu');
    expect(
      screen.getByRole('region', { name: 'Proposta da próxima semana' }),
    ).not.toHaveTextContent('Descoberta que não aconteceu');
    expect(screen.getByRole('button', { name: 'Resolver pendência' })).toBeInTheDocument();
  });
});
