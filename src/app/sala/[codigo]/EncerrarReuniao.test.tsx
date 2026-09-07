import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({ desconectar: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@livekit/components-react', () => ({
  useRoomContext: () => ({ disconnect: estado.desconectar }),
}));
import { EncerrarReuniao } from './EncerrarReuniao';

describe('encerramento explícito da sala', () => {
  beforeEach(() => vi.clearAllMocks());
  it('aguarda a confirmação do servidor antes de desconectar', async () => {
    let concluir!: () => void;
    const aoEncerrar = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          concluir = resolve;
        }),
    );
    render(<EncerrarReuniao aoEncerrar={aoEncerrar} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Encerrar reunião' }));
    expect(screen.getByRole('button', { name: 'Encerrar reunião' })).toBeDisabled();
    expect(estado.desconectar).not.toHaveBeenCalled();
    concluir();
    await waitFor(() => expect(estado.desconectar).toHaveBeenCalledOnce());
  });
  it('mantém a conexão e permite tentar de novo quando o servidor falha', async () => {
    const aoEncerrar = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined);
    render(<EncerrarReuniao aoEncerrar={aoEncerrar} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Encerrar reunião' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente');
    expect(estado.desconectar).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Encerrar reunião' }));
    await waitFor(() => expect(estado.desconectar).toHaveBeenCalledOnce());
  });
});
