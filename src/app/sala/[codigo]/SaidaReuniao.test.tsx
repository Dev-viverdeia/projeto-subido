import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({ desconectar: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@livekit/components-react', () => ({
  useRoomContext: () => ({ disconnect: estado.desconectar }),
}));
import { EncerrarReuniao } from './EncerrarReuniao';

describe('escolha explícita ao sair da sala', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    estado.desconectar.mockResolvedValue(undefined);
  });

  it('abrir, cancelar e Escape não encerram nem desconectam', async () => {
    const aoEncerrar = vi.fn();
    const aoSair = vi.fn();
    render(<EncerrarReuniao aoEncerrar={aoEncerrar} aoSair={aoSair} />);
    const user = userEvent.setup();
    const abrir = screen.getByRole('button', { name: 'Sair da reunião' });
    await user.click(abrir);
    expect(screen.getByRole('dialog', { name: 'Sair da reunião' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Encerrar para todos' })).toHaveAccessibleDescription(
      /Fecha a sala para todos/,
    );
    await user.click(screen.getByRole('button', { name: 'Voltar à reunião' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
    await user.click(abrir);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(aoSair).not.toHaveBeenCalled();
    expect(aoEncerrar).not.toHaveBeenCalled();
    expect(estado.desconectar).not.toHaveBeenCalled();
  });

  it.each(['sair', 'encerrar'] as const)(
    'aguarda %s e bloqueia repetição, Escape e troca de ação',
    async (acao) => {
      let concluir!: () => void;
      const executar = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            concluir = resolve;
          }),
      );
      const outra = vi.fn();
      render(
        <EncerrarReuniao
          aoEncerrar={acao === 'encerrar' ? executar : outra}
          aoSair={acao === 'sair' ? executar : outra}
        />,
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Sair da reunião' }));
      const confirmar = screen.getByRole('button', {
        name: acao === 'sair' ? 'Sair da sala' : 'Encerrar para todos',
      });
      await user.dblClick(confirmar);
      fireEvent.click(confirmar);
      expect(executar).toHaveBeenCalledOnce();
      expect(outra).not.toHaveBeenCalled();
      expect(estado.desconectar).not.toHaveBeenCalled();
      expect(confirmar).toBeDisabled();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('dialog')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Voltar à reunião' })).toBeDisabled();
      concluir();
      await waitFor(() => expect(estado.desconectar).toHaveBeenCalledOnce());
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    },
  );

  it('preserva a conexão após falha na saída e permite tentar novamente', async () => {
    const aoSair = vi
      .fn()
      .mockRejectedValueOnce(new Error('credencial interna'))
      .mockResolvedValue(undefined);
    const aoEncerrar = vi.fn();
    render(<EncerrarReuniao aoEncerrar={aoEncerrar} aoSair={aoSair} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sair da reunião' }));
    const confirmar = screen.getByRole('button', { name: 'Sair da sala' });
    await user.click(confirmar);
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente');
    expect(screen.queryByText('credencial interna')).not.toBeInTheDocument();
    expect(estado.desconectar).not.toHaveBeenCalled();
    await user.click(confirmar);
    await waitFor(() => expect(estado.desconectar).toHaveBeenCalledOnce());
    expect(aoEncerrar).not.toHaveBeenCalled();
  });

  it('não repete encerramento confirmado se a desconexão local falha', async () => {
    estado.desconectar.mockRejectedValueOnce(new Error('falha local')).mockResolvedValue(undefined);
    const aoEncerrar = vi.fn().mockResolvedValue(undefined);
    render(<EncerrarReuniao aoEncerrar={aoEncerrar} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sair da reunião' }));
    await user.click(screen.getByRole('button', { name: 'Encerrar para todos' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Encerrar para todos' }));
    expect(aoEncerrar).toHaveBeenCalledOnce();
    expect(estado.desconectar).toHaveBeenCalledTimes(2);
  });

  it('não desconecta se a persistência não está disponível', async () => {
    render(<EncerrarReuniao />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sair da reunião' }));
    await user.click(screen.getByRole('button', { name: 'Sair da sala' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(estado.desconectar).not.toHaveBeenCalled();
  });
});
