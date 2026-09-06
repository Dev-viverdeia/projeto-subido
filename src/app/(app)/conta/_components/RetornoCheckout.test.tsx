import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const { refresh, router } = vi.hoisted(() => {
  const refresh = vi.fn();
  return { refresh, router: { refresh } };
});
vi.mock('next/navigation', () => ({ useRouter: () => router }));
import { RetornoCheckout } from './RetornoCheckout';
beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('a URL de sucesso sozinha não prova pagamento', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  render(<RetornoCheckout retorno="sucesso" tipo="creditos" />);
  expect(screen.queryByText(/Pagamento recebido/i)).not.toBeInTheDocument();
  expect(screen.getByText('Não foi possível identificar este pagamento.')).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it('mantém atualização visível até o banco confirmar e então atualiza saldo', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ estado: 'atualizando' }) })
    .mockResolvedValue({ ok: true, json: () => Promise.resolve({ estado: 'confirmado' }) });
  vi.stubGlobal('fetch', fetch);
  render(<RetornoCheckout retorno="sucesso" sessao="cs_test_ok123" tipo="creditos" />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(screen.getByText('Atualizando seus créditos.')).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5_000);
  });
  expect(screen.getByText('Créditos adicionados.')).toBeInTheDocument();
  expect(refresh).toHaveBeenCalledOnce();
});

it('não prende o usuário em um loading infinito', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: () => Promise.resolve({ estado: 'pendente' }) });
  vi.stubGlobal('fetch', fetch);
  render(<RetornoCheckout retorno="sucesso" sessao="cs_test_ok123" tipo="assinatura" />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(65_000);
  });
  const chamadas = fetch.mock.calls.length;
  expect(screen.getByRole('button', { name: 'Verificar novamente' })).toBeInTheDocument();
  expect(screen.getByText('A confirmação ainda não chegou.')).toBeInTheDocument();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(fetch).toHaveBeenCalledTimes(chamadas);
  expect(refresh).not.toHaveBeenCalled();
});

it('oferece recuperação quando o serviço não responde sem assumir cobrança', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  render(<RetornoCheckout retorno="sucesso" sessao="cs_test_ok123" tipo="creditos" />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(screen.getByRole('button', { name: 'Verificar novamente' })).toBeInTheDocument();
  expect(screen.queryByText('Créditos adicionados.')).not.toBeInTheDocument();
});
