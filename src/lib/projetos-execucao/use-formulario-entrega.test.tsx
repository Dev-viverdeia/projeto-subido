import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { useFormularioEntrega } from './use-formulario-entrega';

function Formulario({ action }: { action: Parameters<typeof useFormularioEntrega>[0] }) {
  const { estado, enviar, editar, pendente, bloqueado, operacao } = useFormularioEntrega(action);
  return (
    <form onSubmit={enviar} onChange={editar} aria-label="Entrega">
      <input name="projeto" type="hidden" value="projeto-1" />
      <label>
        Resultado
        <textarea name="resultado" defaultValue="" />
      </label>
      <button name="operacao" value="salvar" disabled={bloqueado}>
        {pendente && operacao === 'salvar' ? 'Salvando' : 'Salvar'}
      </button>
      <button name="operacao" value="enviar" disabled={bloqueado}>
        Enviar
      </button>
      {estado.erro && <p role="alert">{estado.erro}</p>}
      {estado.sucesso && <p role="status">{estado.sucesso}</p>}
    </form>
  );
}

describe('useFormularioEntrega', () => {
  it('mantém envio bloqueado no HTML antes da hidratação', () => {
    const html = renderToString(<Formulario action={vi.fn()} />);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });

  it('preserva texto após erro de validação e reenvia a operação escolhida', async () => {
    const action = vi
      .fn<Parameters<typeof useFormularioEntrega>[0]>()
      .mockResolvedValueOnce({ erro: 'Revise o resultado.' })
      .mockResolvedValueOnce({ sucesso: 'Salvo' });
    render(<Formulario action={action} />);
    const campo = screen.getByLabelText('Resultado');
    fireEvent.change(campo, { target: { value: 'Resultado revisado com o cliente' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Revise o resultado.');
    expect(campo).toHaveValue('Resultado revisado com o cliente');
    expect(action.mock.calls[0]![1].get('operacao')).toBe('salvar');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Salvo');
    expect(action.mock.calls[1]![1].get('operacao')).toBe('enviar');
    expect(action.mock.calls[1]![1].get('resultado')).toBe('Resultado revisado com o cliente');
    fireEvent.change(campo, { target: { value: 'Outra revisão não salva' } });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('recupera falha de rede sem resetar o formulário nem afirmar sucesso', async () => {
    const action = vi
      .fn<Parameters<typeof useFormularioEntrega>[0]>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ sucesso: 'Salvo' });
    render(<Formulario action={action} />);
    const campo = screen.getByLabelText('Resultado');
    fireEvent.change(campo, { target: { value: 'Minha comprovação' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Seu texto continua aqui');
    expect(campo).toHaveValue('Minha comprovação');
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Salvo');
  });

  it('impede submissão dupla e identifica o botão em andamento', async () => {
    let concluir!: (value: { sucesso: string }) => void;
    const action = vi.fn(
      () =>
        new Promise<{ sucesso: string }>((resolve) => {
          concluir = resolve;
        }),
    );
    render(<Formulario action={action} />);
    const form = screen.getByRole('form', { name: 'Entrega' });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    fireEvent.submit(form);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Salvando' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    await act(async () => {
      concluir({ sucesso: 'Salvo' });
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });
});
