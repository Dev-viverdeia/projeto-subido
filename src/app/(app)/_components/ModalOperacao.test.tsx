import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModalOperacao } from './ModalOperacao';

describe('ModalOperacao', () => {
  it('abre no body, fecha com Escape e devolve o foco', async () => {
    const user = userEvent.setup();

    function Exemplo() {
      const [aberto, setAberto] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setAberto(true)}>
            Abrir
          </button>
          <ModalOperacao
            open={aberto}
            onClose={() => setAberto(false)}
            label="Ficha do cliente"
            title="Editar cliente"
          >
            <input data-autofocus aria-label="Empresa" />
          </ModalOperacao>
        </>
      );
    }

    render(<Exemplo />);
    const gatilho = screen.getByRole('button', { name: 'Abrir' });
    await user.click(gatilho);

    expect(screen.getByRole('dialog', { name: 'Editar cliente' })).toBeInTheDocument();
    expect(screen.getByRole('dialog').parentElement?.parentElement).toHaveAttribute(
      'data-label',
      'Ficha do cliente',
    );
    expect(screen.getByRole('dialog').parentElement?.parentElement?.parentElement).toBe(
      document.body,
    );
    await waitFor(() => expect(screen.getByLabelText('Empresa')).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gatilho).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('mantém uma operação bloqueada aberta até o servidor responder', () => {
    const aoFechar = vi.fn();
    render(
      <ModalOperacao open blocked onClose={aoFechar} title="Salvando alterações">
        <p>Aguarde.</p>
      </ModalOperacao>,
    );

    expect(screen.queryByRole('button', { name: 'Fechar diálogo' })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(aoFechar).not.toHaveBeenCalled();
  });
});
