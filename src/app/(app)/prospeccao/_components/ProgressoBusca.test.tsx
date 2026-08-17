import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressoBusca } from './ProgressoBusca';

describe('progresso da busca de prospecção', () => {
  it('explica a espera sem inventar percentual de conclusão', () => {
    render(<ProgressoBusca quantidade={10} />);

    const estado = screen.getByRole('status');
    expect(estado).toHaveTextContent('Localizando empresas');
    expect(estado).toHaveTextContent('10 empresas solicitadas');
    expect(estado).toHaveTextContent('Pode levar até 2 minutos');
    expect(estado).not.toHaveTextContent('%');
  });
});
