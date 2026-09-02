import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MapaJornada } from './MapaJornada';

describe('MapaJornada', () => {
  it('guia o usuário Pro pelas áreas da plataforma em um clique', () => {
    render(<MapaJornada nome="Rafael" plano="pro" />);

    expect(screen.getByText(/Rafael\.$/)).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'O que você quer fazer agora?',
    );
    expect(screen.getByRole('heading', { name: 'Escolha uma área.' })).toBeVisible();

    const atalhos = screen.getByRole('navigation', { name: 'Atalhos da plataforma' });
    expect(within(atalhos).getAllByRole('link')).toHaveLength(9);
    expect(within(atalhos).queryByText('01')).not.toBeInTheDocument();
    expect(within(atalhos).getByRole('link', { name: 'Ver formações: Formações' })).toHaveAttribute(
      'href',
      '/formacoes',
    );
    expect(
      within(atalhos).getByRole('link', { name: 'Buscar empresas: Prospecção' }),
    ).toHaveAttribute('href', '/prospeccao');
    expect(within(atalhos).getByRole('link', { name: 'Ver entregas: Entregas' })).toHaveAttribute(
      'href',
      '/entregas',
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('O que já está na sua mesa.')).not.toBeInTheDocument();
  });

  it('explica o upgrade antes de enviar um usuário Starter a uma área Pro', () => {
    render(<MapaJornada nome={null} plano="starter" />);

    expect(screen.getByRole('link', { name: 'Estúdio: conhecer plano Pro' })).toHaveAttribute(
      'href',
      '/conta/assinatura?upgrade=estudio&origem=%2Finicio',
    );
    expect(screen.getByRole('link', { name: 'Vendas: conhecer plano Pro' })).toHaveAttribute(
      'href',
      '/conta/assinatura?upgrade=vendas&origem=%2Finicio',
    );
    expect(screen.getByRole('link', { name: 'Ver reuniões: Reuniões' })).toHaveAttribute(
      'href',
      '/reunioes',
    );
  });
});
