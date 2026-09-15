import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ModalOperacao } from './ModalOperacao';
import { Select } from '@/design-system/via';

const scrollIntoViewOriginal = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView',
);
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});
afterAll(() => {
  if (scrollIntoViewOriginal) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollIntoViewOriginal);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  }
});

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

  it('Escape fecha primeiro a lista e mantém o preenchimento do formulário', async () => {
    const user = userEvent.setup();
    const aoFechar = vi.fn();
    render(
      <ModalOperacao open onClose={aoFechar} title="Editar cliente">
        <input aria-label="Empresa" defaultValue="Clínica Horizonte" />
        <Select
          label="Etapa"
          options={[
            { value: 'preparar', label: 'Preparar' },
            { value: 'descobrir', label: 'Descobrir' },
          ]}
        />
      </ModalOperacao>,
    );
    const etapa = screen.getByRole('button', { name: 'Etapa' });
    await user.click(etapa);
    expect(etapa).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(etapa).toHaveAttribute('aria-expanded', 'false');
    expect(etapa).toHaveFocus();
    expect(aoFechar).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Empresa')).toHaveValue('Clínica Horizonte');

    await user.keyboard('{Escape}');
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it('isola o fundo e restaura somente as superfícies que estavam disponíveis', () => {
    const fundo = document.createElement('div');
    const jaBloqueado = document.createElement('div');
    fundo.setAttribute('data-app-shell', '');
    jaBloqueado.setAttribute('data-app-shell', '');
    jaBloqueado.setAttribute('inert', '');
    document.body.append(fundo, jaBloqueado);
    const { unmount } = render(<ModalOperacao open onClose={vi.fn()} title="Editar cliente" />);
    expect(fundo).toHaveAttribute('inert');
    expect(jaBloqueado).toHaveAttribute('inert');
    expect(screen.getByRole('dialog').closest('[inert]')).toBeNull();
    unmount();
    expect(fundo).not.toHaveAttribute('inert');
    expect(jaBloqueado).toHaveAttribute('inert');
    fundo.remove();
    jaBloqueado.remove();
  });

  it('associa a orientação visível ao diálogo e atualiza sem repetir texto', () => {
    const { rerender } = render(
      <ModalOperacao
        open
        onClose={vi.fn()}
        title="Editar cliente"
        description="Confira os dados antes de salvar."
      />,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'Confira os dados antes de salvar.',
    );
    expect(screen.getAllByText('Confira os dados antes de salvar.')).toHaveLength(1);
    rerender(<ModalOperacao open onClose={vi.fn()} title="Editar cliente" />);
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });
});
