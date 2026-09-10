import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type * as Registro from '@/lib/consultor/registrar-envio';
import { gravarRascunho, listarRascunhos, limparRascunhosSobral } from '@/lib/consultor/rascunhos';
const mocks = vi.hoisted(() => ({ registrar: vi.fn(), responder: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/lib/consultor/registrar-envio', async (original) => ({
  ...(await original<typeof Registro>()),
  registrarEnvio: mocks.registrar,
}));
vi.mock('@/lib/consultor/invocar', () => ({ responderPendente: mocks.responder }));
import { Conversa } from './Conversa';
const dono = '11111111-1111-4111-8111-111111111111';
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
  mocks.responder.mockResolvedValue({
    dados: null,
    falha: { tipo: 'sessao', mensagem: 'Entre na conta.' },
  });
  mocks.registrar.mockImplementation(
    (
      t: Registro.TentativaTexto,
      conferir: boolean,
      guardar: (t: Registro.TentativaTexto) => void,
    ) => {
      if (!conferir) {
        t.solicitado = true;
        guardar(t);
      }
      return Promise.resolve({
        threadId: null,
        mensagemId: null,
        falha: 'Falta confirmar o envio.',
        pendente: true,
      });
    },
  );
});
function escrever(texto = 'Minha pergunta ainda não enviada') {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: texto } });
}
it('fecha e reabre sem envio: retomar é explícito e mantém o texto', async () => {
  const primeira = render(<Conversa dono={dono} />);
  escrever();
  primeira.unmount();
  render(<Conversa dono={dono} />);
  expect(screen.getByRole('textbox')).toHaveValue('');
  fireEvent.click(await screen.findByRole('button', { name: 'Retomar rascunho' }));
  expect(screen.getByRole('textbox')).toHaveValue('Minha pergunta ainda não enviada');
  expect(mocks.registrar).not.toHaveBeenCalled();
  expect(mocks.responder).not.toHaveBeenCalled();
  expect(listarRascunhos(dono)).toHaveLength(1);
});
it('não mostra o rascunho em outra conta ou conversa', () => {
  const primeira = render(<Conversa dono={dono} threadId="venda-a" />);
  escrever();
  primeira.unmount();
  const outra = render(<Conversa dono={dono} threadId="venda-b" />);
  expect(screen.queryByRole('button', { name: 'Retomar rascunho' })).toBeNull();
  outra.unmount();
  render(<Conversa dono="22222222-2222-4222-8222-222222222222" threadId="venda-a" />);
  expect(screen.queryByRole('button', { name: 'Retomar rascunho' })).toBeNull();
});
it('descarte não envia, não volta após remontar e não limpa outros assuntos', async () => {
  const primeira = render(<Conversa dono={dono} />);
  escrever();
  primeira.unmount();
  gravarRascunho(
    {
      id: crypto.randomUUID(),
      dono,
      conversa: 'outra',
      texto: 'Preservar',
      anexos: false,
      salvoEm: Date.now(),
    },
    '',
  );
  const segunda = render(<Conversa dono={dono} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Descartar rascunho' }));
  segunda.unmount();
  render(<Conversa dono={dono} />);
  expect(screen.queryByRole('button', { name: 'Retomar rascunho' })).toBeNull();
  expect(listarRascunhos(dono).map((r) => r.texto)).toEqual(['Preservar']);
  expect(mocks.registrar).not.toHaveBeenCalled();
});
it('mantém IDs e trava edição da pergunta com POST incerto depois de reabrir', async () => {
  const primeira = render(<Conversa dono={dono} />);
  escrever();
  fireEvent.submit(screen.getByRole('textbox').closest('form')!);
  await screen.findByRole('button', { name: 'Conferir envio' });
  const t = { ...(mocks.registrar.mock.calls[0]![0] as Registro.TentativaTexto) };
  primeira.unmount();
  render(<Conversa dono={dono} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retomar pergunta' }));
  expect(screen.getByRole('textbox')).toBeDisabled();
  expect(mocks.registrar).toHaveBeenCalledTimes(1);
  fireEvent.click(await screen.findByRole('button', { name: 'Conferir envio' }));
  await waitFor(() => expect(mocks.registrar).toHaveBeenCalledTimes(2));
  expect(mocks.registrar.mock.calls[1]![0]).toEqual(t);
  expect(mocks.registrar.mock.calls[1]![1]).toBe(true);
  expect(mocks.responder).not.toHaveBeenCalled();
});
it('confirmação elimina o rascunho antes de gerar e não reaparece', async () => {
  mocks.registrar.mockImplementationOnce((t: Registro.TentativaTexto) =>
    Promise.resolve({
      threadId: t.threadId,
      mensagemId: t.mensagemId,
      falha: null,
    }),
  );
  const primeira = render(<Conversa dono={dono} />);
  escrever();
  fireEvent.submit(screen.getByRole('textbox').closest('form')!);
  await waitFor(() => expect(mocks.responder).toHaveBeenCalledOnce());
  primeira.unmount();
  render(<Conversa dono={dono} />);
  expect(listarRascunhos(dono)).toEqual([]);
  expect(screen.queryByRole('button', { name: 'Retomar rascunho' })).toBeNull();
});
it('logout esconde o texto da aba já aberta e impede gravações atrasadas', () => {
  render(<Conversa dono={dono} />);
  escrever();
  act(() => limparRascunhosSobral());
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.getByRole('status')).toHaveTextContent('Sua sessão mudou');
  expect(listarRascunhos(dono)).toEqual([]);
});
it('não sobrescreve o contexto de uma tarefa; retomada continua explícita', async () => {
  const primeira = render(<Conversa dono={dono} chaveRascunho="tarefa:a" />);
  escrever();
  primeira.unmount();
  render(<Conversa dono={dono} chaveRascunho="tarefa:a" textoInicial="Contexto da tarefa" />);
  expect(screen.getByRole('textbox')).toHaveValue('Contexto da tarefa');
  fireEvent.click(await screen.findByRole('button', { name: 'Retomar rascunho' }));
  expect(screen.getByRole('textbox')).toHaveValue('Minha pergunta ainda não enviada');
});
