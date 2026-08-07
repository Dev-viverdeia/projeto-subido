import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/crm/actions', () => ({
  criarLead: vi.fn(() => Promise.resolve({})),
}));

import { FormularioNovoLead } from './FormularioNovoLead';

describe('FormularioNovoLead', () => {
  it('abre e fecha o formulário preservando a semântica de diálogo', () => {
    render(<FormularioNovoLead />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo lead' }));
    expect(screen.getByRole('dialog', { name: 'Adicionar lead' })).toBeInTheDocument();
    expect(screen.getByLabelText('Empresa')).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
