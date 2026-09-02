import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CabecalhoOperacional } from './CabecalhoOperacional';

describe('CabecalhoOperacional', () => {
  it('apresenta a tarefa e mantém um único comando global', () => {
    render(
      <CabecalhoOperacional
        titulo="Vendas"
        descricao="Acompanhe cada oportunidade e o próximo passo."
        acao={<button type="button">Nova oportunidade</button>}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Vendas' })).toBeInTheDocument();
    expect(screen.getByText('Acompanhe cada oportunidade e o próximo passo.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Nova oportunidade' })).toHaveLength(1);
  });
});
