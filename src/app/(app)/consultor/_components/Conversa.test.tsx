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
    Reflect.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:audio-preview'),
    });
    Reflect.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
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

  it('preserva texto e áudio quando o celular está offline', async () => {
    const { container } = render(<Conversa />);
    const audio = new File(['audio'], 'gravacao.webm', { type: 'audio/webm' });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [audio] },
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Minha dúvida' } });
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão');
    expect(screen.getByRole('textbox')).toHaveValue('Minha dúvida');
    expect(screen.getByText('Pronto para enviar')).toBeVisible();
    expect(dependencias.criarConversa).not.toHaveBeenCalled();
  });

  it('recupera o compositor quando o envio rejeita, sem repetir automaticamente', async () => {
    dependencias.criarConversa.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<Conversa />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Pedido preservado' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('O envio não foi confirmado');
    expect(screen.getByRole('textbox')).toHaveValue('Pedido preservado');
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled();
    expect(dependencias.criarConversa).toHaveBeenCalledTimes(1);
    expect(dependencias.responderPendente).not.toHaveBeenCalled();
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
      expect(screen.getByRole('status')).toHaveTextContent(
        'Preparando uma resposta com seus dados',
      );
      expect(screen.getByRole('status')).toHaveTextContent(
        'Você pode continuar aqui assim que eu terminar.',
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

  it('transforma o áudio anexado em player antes e durante o envio', async () => {
    const { container } = render(<Conversa />);
    const audio = new File(['audio'], 'gravacao.webm', { type: 'audio/webm' });
    const entrada = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(entrada, { target: { files: [audio] } });
    expect(screen.getByText('Mensagem de áudio')).toBeVisible();
    expect(screen.getByText('Pronto para enviar')).toBeVisible();
    expect(screen.queryByText('gravacao.webm')).not.toBeInTheDocument();

    fireEvent.submit(screen.getByRole('textbox').closest('form')!);

    await waitFor(() => {
      expect(dependencias.criarConversa).toHaveBeenCalledWith('', [audio]);
    });
  });
});
