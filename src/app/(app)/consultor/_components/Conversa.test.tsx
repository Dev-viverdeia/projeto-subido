import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const dependencias = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  criarConversa: vi.fn(),
  adicionarMensagem: vi.fn(),
  enviarMensagem: vi.fn(),
  responderPendente: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: dependencias.refresh, replace: dependencias.replace }),
}));
vi.mock('@/lib/consultor/criar', () => ({
  criarConversa: dependencias.criarConversa,
  adicionarMensagem: dependencias.adicionarMensagem,
}));
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
    dependencias.criarConversa.mockResolvedValue({
      threadId: 'thread-1',
      mensagemId: 'mensagem-1',
      falha: null,
    });
    dependencias.adicionarMensagem.mockResolvedValue({
      threadId: 'thread-1',
      mensagemId: 'mensagem-2',
      falha: null,
    });
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
    expect(dependencias.criarConversa).toHaveBeenCalledWith('O que faço agora?', []);
    expect(dependencias.responderPendente).toHaveBeenCalledWith('thread-1');
    expect(dependencias.replace).toHaveBeenCalledWith('/consultor/thread-1');
  });

  it('abre uma conversa nova com o pedido da tarefa pronto para revisão', () => {
    render(<Conversa textoInicial="Ajude a conferir a base da Clínica Aurora." />);

    expect(screen.getByRole('textbox')).toHaveValue('Ajude a conferir a base da Clínica Aurora.');
    expect(dependencias.criarConversa).not.toHaveBeenCalled();
  });

  it('troca a resposta local pelo histórico confirmado pelo servidor', async () => {
    const { rerender } = render(<Conversa threadId="thread-1" ultimaMensagemId="mensagem-1" />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Como preparo a reunião?' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);

    expect(await screen.findByText('Comece pela formação recomendada.')).toBeVisible();
    expect(dependencias.adicionarMensagem).toHaveBeenCalledWith(
      'thread-1',
      'Como preparo a reunião?',
      [],
    );
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
    dependencias.responderPendente.mockReturnValueOnce(
      new Promise((resolve) => {
        concluir = resolve;
      }),
    );
    render(<Conversa threadId="thread-1" ultimaMensagemId="mensagem-1" />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Qual é o próximo passo?' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Analisando sua operação');
      expect(screen.getByRole('status')).toHaveTextContent(
        'Vendas, projetos e conteúdos estão entrando na resposta.',
      );
    });
    act(() => {
      concluir({
        dados: { thread_id: 'thread-1', resposta: 'Este é o próximo passo.' },
        falha: null,
      });
    });
    expect(await screen.findByText('Este é o próximo passo.')).toBeVisible();
  });

  it('aceita uma imagem e a envia junto com a primeira pergunta', async () => {
    const { container } = render(<Conversa />);
    const imagem = new File(['imagem'], 'fachada.png', { type: 'image/png' });
    const entrada = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(entrada, { target: { files: [imagem] } });
    expect(screen.getByText('fachada.png')).toBeVisible();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'O que esta imagem revela sobre o atendimento?' },
    });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);

    await waitFor(() => {
      expect(dependencias.criarConversa).toHaveBeenCalledWith(
        'O que esta imagem revela sobre o atendimento?',
        [imagem],
      );
    });
  });
});
