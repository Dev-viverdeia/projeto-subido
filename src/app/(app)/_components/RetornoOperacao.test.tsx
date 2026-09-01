import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RetornoOperacao } from './RetornoOperacao';

describe('RetornoOperacao', () => {
  it('anuncia uma confirmação sem interromper a navegação', () => {
    render(<RetornoOperacao tom="sucesso" titulo="Proposta salva" descricao="Versão 03 criada." />);

    expect(screen.getByRole('status')).toHaveTextContent('Proposta salva');
    expect(screen.getByRole('status')).not.toHaveAttribute('aria-busy');
  });

  it('anuncia a falha como alerta', () => {
    render(<RetornoOperacao tom="erro" titulo="Não foi possível salvar" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar');
  });

  it('expõe a espera curta sem inventar percentual', () => {
    render(<RetornoOperacao tom="processando" titulo="Atualizando a venda" />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
