import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OpcoesResposta } from '@/lib/consultor/invocar';
import type { GeracaoSobral } from '@/lib/consultor/geracao-contrato';
import type * as Registro from '@/lib/consultor/registrar-envio';
const mocks = vi.hoisted(() => ({
  responder: vi.fn(),
  parar: vi.fn(),
  refresh: vi.fn(),
  registrar: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: vi.fn() }),
}));
vi.mock('@/lib/consultor/invocar', () => ({
  responderPendente: mocks.responder,
  pararResposta: mocks.parar,
}));
vi.mock('@/lib/consultor/registrar-envio', async (original) => ({
  ...(await original<typeof Registro>()),
  registrarEnvio: mocks.registrar,
}));
vi.mock('./useEnvioAnexos', () => ({ useEnvioAnexos: () => ({ pausado: false }) }));
import { Conversa } from './Conversa';
const geracao: GeracaoSobral = {
  mensagem_id: 'pergunta',
  thread_id: 'thread',
  tentativa: 'tentativa',
  estado: 'gerando',
  texto: '',
  erro: null,
  resposta_id: null,
  parar_em: null,
  expira_em: '2026-09-07T00:00:00Z',
};
type Resultado =
  | { dados: { thread_id: string; resposta: string }; falha: null }
  | { dados: null; falha: { mensagem: string; tipo: string } };
let concluir: (r: Resultado) => void;
let opts: OpcoesResposta;
beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  mocks.registrar.mockResolvedValue({ threadId: 'thread', mensagemId: 'pergunta', falha: null });
  mocks.responder.mockImplementation((_id: string, o: OpcoesResposta) => {
    opts = o;
    return new Promise<Resultado>((resolve) => {
      concluir = resolve;
    });
  });
  mocks.parar.mockResolvedValue({ ...geracao, parar_em: new Date().toISOString() });
});
async function iniciar() {
  render(<Conversa threadId="thread" historico={<p>Histórico anterior</p>} />);
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Quero reduzir faltas na clínica.' },
  });
  fireEvent.submit(screen.getByRole('textbox').closest('form')!);
  await waitFor(() => expect(mocks.responder).toHaveBeenCalledTimes(1));
  act(() => opts.aoEvento({ tipo: 'estado', geracao }));
}
describe('controles da resposta em tempo real', () => {
  it('primeiro envio incerto mantém a pergunta e confere o mesmo recibo sem registrar outra', async () => {
    mocks.registrar.mockResolvedValueOnce({
      threadId: null,
      mensagemId: null,
      falha: 'Envio não confirmado.',
      pendente: true,
    });
    render(<Conversa boasVindas={<h1>Conversa nova</h1>} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Quero vender meu primeiro projeto.' },
    });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    const botao = await screen.findByRole('button', { name: 'Conferir envio' });
    expect(screen.getByText('Quero vender meu primeiro projeto.')).toBeVisible();
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(mocks.responder).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Voltar à edição' })).toBeNull();
    fireEvent.click(botao);
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledOnce());
    expect(mocks.registrar.mock.calls[0]?.[0]).toBe(mocks.registrar.mock.calls[1]?.[0]);
    expect(mocks.registrar.mock.calls[1]?.[1]).toBe(true);
  });
  it('recibo ausente só retoma por escolha do usuário e mantém os mesmos IDs', async () => {
    mocks.registrar.mockResolvedValueOnce({ falha: 'Envio não confirmado.', pendente: true });
    mocks.registrar.mockResolvedValueOnce({
      falha: 'Envio não localizado.',
      pendente: true,
      ausente: true,
    });
    render(<Conversa />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Minha primeira pergunta.' },
    });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    fireEvent.click(await screen.findByRole('button', { name: 'Conferir envio' }));
    const retomar = await screen.findByRole('button', { name: 'Retomar envio' });
    expect(mocks.responder).not.toHaveBeenCalled();
    expect(mocks.registrar).toHaveBeenCalledTimes(2);
    act(() => {
      fireEvent.click(retomar);
      fireEvent.click(retomar);
    });
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledOnce());
    expect(mocks.registrar).toHaveBeenCalledTimes(3);
    expect(mocks.registrar.mock.calls[2]?.[0]).toBe(mocks.registrar.mock.calls[0]?.[0]);
    expect(mocks.registrar.mock.calls[2]?.[1]).toBe(false);
  });
  it('falha anterior ao POST mantém edição e não obriga conferir um envio inexistente', async () => {
    mocks.registrar.mockResolvedValueOnce({
      falha: 'Entre na conta.',
      pendente: false,
      tipo: 'sessao',
    });
    render(<Conversa />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Minha pergunta.' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Entre na conta.');
    expect(screen.getByRole('textbox')).toHaveValue('Minha pergunta.');
    expect(screen.getByRole('textbox')).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Conferir envio' })).toBeNull();
    expect(mocks.responder).not.toHaveBeenCalled();
  });
  it('limite simultâneo permite tentar a mesma pergunta sem cadastrá-la de novo', async () => {
    const mensagem =
      'Você já tem respostas em andamento. Aguarde uma terminar; sua pergunta está salva.';
    mocks.responder.mockResolvedValueOnce({ dados: null, falha: { mensagem } });
    mocks.responder.mockResolvedValueOnce({
      dados: { thread_id: 'thread', resposta: 'Comece pelo atendimento.' },
      falha: null,
    });
    render(<Conversa threadId="thread" historico={<p>Histórico anterior</p>} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Quero reduzir faltas.' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
    expect(screen.getByText('Quero reduzir faltas.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledTimes(2));
    expect(mocks.registrar).toHaveBeenCalledOnce();
    expect(mocks.responder.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ mensagemId: 'pergunta' }),
    );
  });
  it('mostra o trecho real, mantém histórico e troca enviar por Parar', async () => {
    await iniciar();
    act(() => opts.aoEvento({ tipo: 'texto', texto: 'Pergunte sobre as faltas.' }));
    expect(screen.getByText('Histórico anterior')).toBeVisible();
    expect(screen.getByText('Pergunte sobre as faltas.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Parar resposta' })).toBeEnabled();
    expect(screen.queryByText('Gerar novamente')).toBeNull();
  });
  it('Parar espera o recibo e mantém o parcial, sem reiniciar', async () => {
    await iniciar();
    act(() => opts.aoEvento({ tipo: 'texto', texto: 'Primeiro trecho.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Parar resposta' }));
    await waitFor(() => expect(mocks.parar).toHaveBeenCalledWith(geracao));
    expect(screen.getByRole('button', { name: 'Interrompendo resposta' })).toBeDisabled();
    act(() => {
      opts.aoEvento({
        tipo: 'estado',
        geracao: {
          ...geracao,
          estado: 'interrompida',
          texto: 'Primeiro trecho.',
          erro: 'Resposta interrompida.',
        },
      });
      concluir({
        dados: null,
        falha: { mensagem: 'Resposta interrompida.', tipo: 'interrompida' },
      });
    });
    expect(await screen.findByRole('button', { name: 'Gerar novamente' })).toBeEnabled();
    expect(screen.getByText('Primeiro trecho.')).toBeVisible();
    expect(screen.getByRole('textbox')).toBeEnabled();
    expect(mocks.responder).toHaveBeenCalledTimes(1);
  });
  it('recuperar conexão só verifica, não autoriza uma geração nova', async () => {
    await iniciar();
    act(() => concluir({ dados: null, falha: { mensagem: 'A conexão caiu.', tipo: 'pendente' } }));
    fireEvent.click(await screen.findByRole('button', { name: 'Verificar resposta' }));
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledTimes(2));
    expect(opts.somenteConferir).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('Conferindo a resposta salva');
    expect(mocks.registrar).toHaveBeenCalledOnce();
  });
  it('sessão expirada oferece login em outra aba e volta à mesma pergunta por leitura', async () => {
    await iniciar();
    act(() => concluir({ dados: null, falha: { mensagem: 'Entre novamente.', tipo: 'sessao' } }));
    expect(await screen.findByRole('link', { name: /Entrar na conta/ })).toHaveAttribute(
      'target',
      '_blank',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Verificar resposta' }));
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledTimes(2));
    expect(opts.somenteConferir).toBe(true);
    expect(mocks.registrar).toHaveBeenCalledOnce();
  });
  it('conferência mantém o trecho parcial visível e não envia duas solicitações por clique duplo', async () => {
    await iniciar();
    act(() => {
      opts.aoEvento({ tipo: 'texto', texto: 'Trecho preservado.' });
      opts.aoConferir?.();
    });
    expect(screen.getByText('Trecho preservado.')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Conferindo a resposta salva');
    act(() => concluir({ dados: null, falha: { mensagem: 'A conexão caiu.', tipo: 'pendente' } }));
    const botao = await screen.findByRole('button', { name: 'Verificar resposta' });
    act(() => {
      fireEvent.click(botao);
      fireEvent.click(botao);
    });
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Trecho preservado.')).toBeVisible();
  });
  it('falha ao parar é visível e permite repetir apenas a interrupção', async () => {
    mocks.parar.mockRejectedValueOnce(new Error('rede'));
    await iniciar();
    fireEvent.click(screen.getByRole('button', { name: 'Parar resposta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não consegui confirmar a interrupção',
    );
    expect(screen.getByRole('button', { name: 'Parar resposta' })).toBeEnabled();
    expect(mocks.responder).toHaveBeenCalledTimes(1);
  });
});
