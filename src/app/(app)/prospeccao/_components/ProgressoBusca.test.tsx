import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressoBusca } from './ProgressoBusca';

describe('progresso da busca de prospecção', () => {
  it('explica a espera sem inventar percentual de conclusão', () => {
    render(<ProgressoBusca quantidade={10} />);

    const dialogo = screen.getByRole('dialog', { name: 'Montando sua lista' });
    expect(within(dialogo).getByRole('status')).toHaveTextContent('Buscando empresas');
    expect(dialogo).toHaveTextContent('10 empresas solicitadas');
    expect(dialogo).toHaveTextContent('Você pode acompanhar aqui ou continuar usando esta página.');
    expect(within(dialogo).getByRole('button', { name: 'Continuar na plataforma' })).toBeVisible();
    expect(dialogo).not.toHaveTextContent('%');
  });
});
