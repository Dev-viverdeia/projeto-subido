import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrioridadeOperacional } from './PrioridadeOperacional';

describe('PrioridadeOperacional', () => {
  it('mostra uma única ação principal com o status atual', () => {
    render(
      <PrioridadeOperacional
        etapa="Vender"
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
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText('Proposta apresentada e próxima decisão registrada.')).toBeVisible();
  });
});
