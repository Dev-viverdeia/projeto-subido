import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PainelAcessoPlano } from './PainelAcessoPlano';

afterEach(cleanup);

describe('PainelAcessoPlano', () => {
  it('explica o Starter sem esconder o que continua disponível', () => {
    render(<PainelAcessoPlano plano="starter" destaque />);

    const painel = screen.getByRole('region', { name: 'O que está liberado no Starter' });
    expect(painel).toHaveAttribute('data-destaque', 'true');
    expect(within(painel).getByText('Reuniões com Live Coach')).toBeInTheDocument();
    expect(within(painel).getByText('Disponível no Pro')).toBeInTheDocument();
    expect(within(painel).getByText('Enriquecimento das fichas de clientes')).toBeInTheDocument();
  });

  it('mostra a operação comercial como liberada no Pro', () => {
    render(<PainelAcessoPlano plano="pro" />);

    const painel = screen.getByRole('region', { name: 'O que está liberado no Pro' });
    expect(within(painel).getByText('Operação comercial')).toBeInTheDocument();
    expect(within(painel).queryByText('Disponível no Pro')).not.toBeInTheDocument();
  });
});
