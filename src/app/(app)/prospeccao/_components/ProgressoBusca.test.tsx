import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressoBusca } from './ProgressoBusca';

describe('progresso da busca de prospecção', () => {
  it('explica a espera sem inventar percentual de conclusão', () => {
    render(<ProgressoBusca quantidade={10} />);

    const dialogo = screen.getByRole('dialog', { name: 'Montando sua lista' });
    expect(within(dialogo).getByRole('status')).toHaveTextContent('Buscando empresas');
    expect(dialogo).toHaveTextContent('10 empresas solicitadas');
    expect(dialogo).toHaveTextContent('Mantenha esta página aberta');
    expect(dialogo).not.toHaveTextContent('%');
  });
});
