import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntegracaoGoogleCalendar } from '@/app/(app)/conta/_components/IntegracaoGoogleCalendar';
import { SetupGoogleCalendar } from '@/app/(app)/calls/_components/SetupGoogleCalendar';
import type { EstadoGoogleCalendar } from './queries';

vi.mock('@/lib/google-calendar/actions', () => ({
  desconectarGoogleCalendar: vi.fn(),
}));

// O endpoint cria cookies de state/PKCE: não pode passar pelo prefetch ou pelo
// roteador de páginas. Falha se um CTA OAuth voltar a renderizar Next Link.
vi.mock('next/link', () => ({
  default: () => {
    throw new Error('OAuth exige navegação de documento, sem Next Link.');
  },
}));

afterEach(cleanup);

const desconectado: EstadoGoogleCalendar = {
  configurado: true,
  conectado: false,
  email: null,
  status: 'desconectada',
  ultimoErro: null,
};

describe('navegação do Google Calendar', () => {
  it('conecta pela conta com uma âncora nativa e preserva o retorno', () => {
    render(<IntegracaoGoogleCalendar calendar={desconectado} />);

    const conectar = screen.getByRole('link', { name: 'Conectar Google Calendar' });
    expect(conectar.tagName).toBe('A');
    expect(conectar).toHaveAttribute(
      'href',
      '/api/integracoes/google-calendar/conectar?retorno=%2Fconta',
    );
    expect(conectar).toHaveClass('via-btn', 'via-btn--primary', 'via-btn--md');
    expect(conectar).not.toHaveAttribute('target');
  });

  it.each(['reconectar', 'erro'] as const)(
    'mantém navegação nativa para o estado %s na conta',
    (status) => {
      render(<IntegracaoGoogleCalendar calendar={{ ...desconectado, status }} />);

      expect(screen.getByRole('link', { name: 'Reconectar calendário' })).toHaveAttribute(
        'href',
        '/api/integracoes/google-calendar/conectar?retorno=%2Fconta',
      );
    },
  );

  it('não oferece nova conexão quando a conta já está conectada', () => {
    render(
      <IntegracaoGoogleCalendar
        calendar={{ ...desconectado, conectado: true, status: 'ativa', email: 'qa@example.com' }}
      />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desconectar' })).toHaveAttribute('type', 'submit');
  });

  it('não oferece conexão quando a integração não está configurada', () => {
    render(<IntegracaoGoogleCalendar calendar={{ ...desconectado, configurado: false }} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Integração em configuração')).toBeInTheDocument();
  });

  it.each([
    ['desconectada', 'Conectar Google Calendar'],
    ['reconectar', 'Reconectar Google Calendar'],
  ] as const)('usa navegação de documento no agendamento em estado %s', (status, nome) => {
    const retorno = '/vendas/oportunidade-de-teste?agendar=1';
    const href = `/api/integracoes/google-calendar/conectar?retorno=${encodeURIComponent(retorno)}`;
    render(
      <SetupGoogleCalendar
        calendar={{ ...desconectado, status }}
        conectarHref={href}
        aoFechar={vi.fn()}
      />,
    );

    const conectar = screen.getByRole('link', { name: nome });
    expect(conectar.tagName).toBe('A');
    expect(conectar).toHaveAttribute('href', href);
    expect(conectar).toHaveAttribute('data-autofocus');
    expect(conectar).toHaveClass('via-btn', 'via-btn--primary', 'via-btn--md');
    expect(conectar).not.toHaveAttribute('target');
    expect(screen.getByRole('button', { name: 'Agora não' })).toBeEnabled();
  });

  it('mantém o agendamento indisponível sem configuração', () => {
    render(
      <SetupGoogleCalendar
        calendar={{ ...desconectado, configurado: false }}
        conectarHref="/api/integracoes/google-calendar/conectar?retorno=%2Freunioes"
        aoFechar={vi.fn()}
      />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conexão indisponível' })).toBeDisabled();
  });
});
