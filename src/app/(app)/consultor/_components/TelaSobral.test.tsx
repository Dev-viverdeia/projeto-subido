import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/(app)/_components/CabecalhoPagina', () => ({
  CabecalhoPagina: () => <div data-testid="cabecalho-global" />,
}));

vi.mock('@/app/(app)/_components/HistoricoDropdown', () => ({
  HistoricoDropdown: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('./Conversa', () => ({
  Conversa: () => <div data-testid="compositor" />,
}));

vi.mock('./ListaConversas', () => ({
  ListaConversas: () => <div data-testid="lista-conversas" />,
}));

vi.mock('./Mensagens', () => ({
  Mensagens: () => <div data-testid="mensagens" />,
}));

import { TelaSobral } from './TelaSobral';

describe('TelaSobral', () => {
  it('personaliza a entrada e explica os dados que pode usar', () => {
    render(<TelaSobral threads={[]} conversa={null} nome="Rafael" />);

    expect(screen.getByRole('heading', { name: /Rafael.*O que precisa avançar/i })).toBeVisible();
    expect(screen.getByText('Contexto da conta')).toBeInTheDocument();
    expect(screen.getByText('O que o Sobral consegue usar')).toBeInTheDocument();
    expect(screen.getByText('clientes, etapas e próximos passos')).toBeInTheDocument();
    expect(screen.getByText('Dados de contato não são enviados por padrão.')).toBeInTheDocument();
  });

  it('corrige a leitura visual de títulos antigos iniciados em minúscula', () => {
    render(
      <TelaSobral
        threads={[]}
        conversa={{
          thread: {
            id: 'thread-1',
            titulo: 'o que devo aprender primeiro?',
            criadoEm: '2026-08-20T12:00:00.000Z',
            atualizadoEm: '2026-08-20T12:00:00.000Z',
          },
          mensagens: [],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'O que devo aprender primeiro?' })).toBeVisible();
  });
});
