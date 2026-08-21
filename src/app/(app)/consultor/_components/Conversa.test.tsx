import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const dependencias = vi.hoisted(() => ({
  refresh: vi.fn(),
  criarConversa: vi.fn(),
  enviarMensagem: vi.fn(),
  responderPendente: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: dependencias.refresh }) }));
vi.mock('@/lib/consultor/criar', () => ({ criarConversa: dependencias.criarConversa }));
vi.mock('@/lib/consultor/invocar', () => ({
  enviarMensagem: dependencias.enviarMensagem,
  responderPendente: dependencias.responderPendente,
}));

import { Conversa } from './Conversa';

describe('Conversa integrada à Início', () => {
  beforeAll(() => {
    Reflect.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    dependencias.criarConversa.mockResolvedValue({ threadId: 'thread-1', falha: null });
    dependencias.responderPendente.mockResolvedValue({
      dados: { thread_id: 'thread-1', resposta: 'Comece pela formação recomendada.' },
      falha: null,
    });
    dependencias.enviarMensagem.mockResolvedValue({
      dados: { thread_id: 'thread-1', resposta: 'Prepare a próxima conversa com o cliente.' },
      falha: null,
    });
  });

  it('mantém a resposta visível enquanto o histórico é atualizado', async () => {
    render(<Conversa />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'O que faço agora?' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);

    expect(await screen.findByText('Comece pela formação recomendada.')).toBeVisible();
    expect(dependencias.criarConversa).toHaveBeenCalledWith('O que faço agora?');
    expect(dependencias.responderPendente).toHaveBeenCalledWith('thread-1');
    expect(dependencias.refresh).toHaveBeenCalledTimes(1);
  });

  it('troca a resposta local pelo histórico confirmado pelo servidor', async () => {
    const { rerender } = render(<Conversa threadId="thread-1" ultimaMensagemId="mensagem-1" />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Como preparo a reunião?' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);

    expect(await screen.findByText('Prepare a próxima conversa com o cliente.')).toBeVisible();
    rerender(<Conversa threadId="thread-1" ultimaMensagemId="mensagem-2" />);

    await waitFor(() => {
      expect(
        screen.queryByText('Prepare a próxima conversa com o cliente.'),
      ).not.toBeInTheDocument();
    });
  });

  it('mostra que o Sobral está trabalhando durante toda a espera', async () => {
    let concluir!: (resultado: {
      dados: { thread_id: string; resposta: string };
      falha: null;
    }) => void;
    dependencias.enviarMensagem.mockReturnValueOnce(
      new Promise((resolve) => {
        concluir = resolve;
      }),
    );
    render(<Conversa threadId="thread-1" ultimaMensagemId="mensagem-1" />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Qual é o próximo passo?' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);

    expect(screen.getByRole('status', { name: 'Sobral AI escrevendo' })).toBeVisible();
    act(() => {
      concluir({
        dados: { thread_id: 'thread-1', resposta: 'Este é o próximo passo.' },
        falha: null,
      });
    });
    expect(await screen.findByText('Este é o próximo passo.')).toBeVisible();
  });
});
