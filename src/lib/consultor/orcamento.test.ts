// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ criarAdminSobral: () => ({ rpc }) }));
import { comOrcamentoSobral } from './orcamento';
beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ data: true, error: null });
});
it('reserva antes da geração e liquida o uso real antes de entregar', async () => {
  expect(
    await comOrcamentoSobral('dono', 5000, (uso) => {
      expect(rpc).toHaveBeenCalledWith(
        'sobral_reservar_uso',
        expect.objectContaining({ p_tokens: 5000 }),
      );
      uso(800);
      return Promise.resolve('resposta');
    }),
  ).toBe('resposta');
  expect(rpc).toHaveBeenLastCalledWith(
    'sobral_liquidar_uso',
    expect.objectContaining({ p_tokens: 800 }),
  );
});
it('não chama IA se a reserva falha ou é um replay', async () => {
  const gerar = vi.fn();
  for (const resultado of [
    { data: false, error: null },
    { data: null, error: { message: 'limite_sobral_mensal' } },
  ]) {
    rpc.mockResolvedValueOnce(resultado);
    await expect(comOrcamentoSobral('dono', 5000, gerar)).rejects.toThrow();
  }
  expect(gerar).not.toHaveBeenCalled();
});
it('cancelamento depois de iniciar mantém a reserva quando o uso é desconhecido', async () => {
  await expect(
    comOrcamentoSobral('dono', 5000, () => Promise.reject(new Error('cancelado após delta'))),
  ).rejects.toThrow();
  expect(rpc).toHaveBeenCalledTimes(1);
});
it('erro após receber uso ainda liquida, e perda de ACK repete o mesmo id', async () => {
  rpc
    .mockResolvedValueOnce({ data: true, error: null })
    .mockResolvedValueOnce({ data: null, error: { code: 'timeout' } });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(
      comOrcamentoSobral('dono', 5000, (uso) => {
        uso(123);
        return Promise.reject(new Error('incomplete'));
      }),
    ).rejects.toThrow();
    expect(rpc.mock.calls[1]).toEqual(rpc.mock.calls[2]);
  } finally {
    log.mockRestore();
  }
});
it('cancelamento antes de iniciar não consome; durante reserva conhecida libera zero', async () => {
  const controle = new AbortController();
  const gerar = vi.fn();
  rpc.mockImplementationOnce(() => {
    controle.abort();
    return Promise.resolve({ data: true, error: null });
  });
  await expect(comOrcamentoSobral('dono', 5000, gerar, controle.signal)).rejects.toThrow();
  expect(gerar).not.toHaveBeenCalled();
  expect(rpc).toHaveBeenLastCalledWith(
    'sobral_liquidar_uso',
    expect.objectContaining({ p_tokens: 0 }),
  );
  rpc.mockClear();
  await expect(comOrcamentoSobral('dono', 5000, gerar, controle.signal)).rejects.toThrow();
  expect(rpc).not.toHaveBeenCalled();
});
