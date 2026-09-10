import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/consultor/salvar-resposta', () => ({ salvarResposta: vi.fn() }));
import { salvarResposta } from '@/lib/consultor/salvar-resposta';
import { SalvarResposta } from './SalvarResposta';
const props = { mensagem: 'm', dono: 'd' };
beforeEach(() => {
  vi.mocked(salvarResposta).mockReset();
});
it('desabilita durante o pedido, confirma apenas no retorno e envia estado explícito', async () => {
  let resolver!: (r: { salva: boolean }) => void;
  vi.mocked(salvarResposta).mockReturnValue(
    new Promise((r) => {
      resolver = r;
    }),
  );
  const aoAtualizar = vi.fn();
  const { rerender } = render(<SalvarResposta {...props} aoAtualizar={aoAtualizar} />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  expect(aoAtualizar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button'));
  expect(salvarResposta).toHaveBeenCalledTimes(1);
  expect(salvarResposta).toHaveBeenCalledWith({ ...props, salvar: true });
  await act(async () => {
    resolver({ salva: true });
    await Promise.resolve();
  });
  expect(aoAtualizar).toHaveBeenCalledOnce();
  rerender(<SalvarResposta {...props} salva />);
  expect(screen.getByRole('button', { name: 'Remover das respostas salvas' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
it('falha mantém o estado e permite repetir sem perder o aviso acessível', async () => {
  vi.mocked(salvarResposta)
    .mockResolvedValueOnce({ erro: 'Confira sua conexão.' })
    .mockRejectedValueOnce(new Error('interno'));
  const aoAtualizar = vi.fn();
  render(<SalvarResposta {...props} salva aoAtualizar={aoAtualizar} />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Confira sua conexão.'));
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button')).not.toBeDisabled();
  expect(salvarResposta).toHaveBeenCalledWith({ ...props, salvar: false });
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível confirmar. Tente novamente.',
    ),
  );
  expect(aoAtualizar).not.toHaveBeenCalled();
});
