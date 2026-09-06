import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OpcoesResposta } from '@/lib/consultor/invocar';
import type { GeracaoSobral } from '@/lib/consultor/geracao-contrato';
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
vi.mock('@/lib/consultor/registrar-envio', () => ({ registrarEnvio: mocks.registrar }));
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
