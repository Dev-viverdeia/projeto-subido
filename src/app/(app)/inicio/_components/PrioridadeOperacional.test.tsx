import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrioridadeOperacional } from './PrioridadeOperacional';

describe('PrioridadeOperacional', () => {
  it('abre a ação exata e mantém a leitura completa como apoio', () => {
    render(
      <PrioridadeOperacional
        modo="leitura factual"
        etapa="Vender"
        foco="Conduzir a decisão da Clínica Aurora"
        titulo="Apresente a proposta"
        detalhe="Use os fatos confirmados na descoberta para conduzir a decisão com clareza."
        evidencia="Proposta apresentada e próxima decisão registrada."
        destino="/propostas/proposta-1"
        acao="Abrir proposta"
      />,
    );

    expect(screen.getByRole('link', { name: /Abrir proposta/ })).toHaveAttribute(
      'href',
      '/propostas/proposta-1',
    );
    expect(screen.getByRole('link', { name: 'Ver leitura completa' })).toHaveAttribute(
      'href',
      '/consultor',
    );
    expect(screen.getByText('Proposta apresentada e próxima decisão registrada.')).toBeVisible();
  });
});
