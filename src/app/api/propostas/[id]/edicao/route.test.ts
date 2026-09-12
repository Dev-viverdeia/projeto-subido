import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/planos/server', () => ({ obterAcessoRecurso: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
import { obterAcessoRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import { EDICAO_TESTE } from '@/lib/propostas/edicao.fixture';
import { GET } from './route';

const q = { select: vi.fn(), eq: vi.fn(), abortSignal: vi.fn(), maybeSingle: vi.fn() };
const from = vi.fn();
const getUser = vi.fn();
const requisitar = (id = EDICAO_TESTE.id) =>
  GET(new Request(`https://example.test/api/propostas/${id}/edicao`), {
    params: Promise.resolve({ id }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(obterAcessoRecurso).mockResolvedValue({ permitido: true, plano: 'pro' });
  q.select.mockReturnValue(q);
  q.eq.mockReturnValue(q);
  q.abortSignal.mockReturnValue(q);
  q.maybeSingle.mockResolvedValue({
    data: { ...EDICAO_TESTE, dadoPrivadoExtra: 'nao-expor' },
    error: null,
  });
  from.mockReturnValue(q);
  getUser.mockResolvedValue({ data: { user: { id: 'dono' } } });
  vi.mocked(createClient).mockResolvedValue({ from, auth: { getUser } } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);
});
it('retorna snapshot validado, privado e restrito ao dono, sem escrita', async () => {
  const r = await requisitar();
  expect(r.status).toBe(200);
  expect(r.headers.get('Cache-Control')).toContain('private, no-store');
  expect(await r.json()).toEqual(EDICAO_TESTE);
  expect(q.eq.mock.calls).toEqual([
    ['id', EDICAO_TESTE.id],
    ['dono', 'dono'],
  ]);
  expect(q.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  expect(from).toHaveBeenCalledTimes(1);
});
it('ID inválido não consulta o banco', async () => {
  expect((await requisitar('invalido')).status).toBe(404);
  expect(from).not.toHaveBeenCalled();
});
it.each([401, 403])('sessão/plano sem acesso (%s) não lê conteúdo', async (status) => {
  vi.mocked(obterAcessoRecurso).mockResolvedValue(
    status === 401
      ? { permitido: false, motivo: 'sessao' }
      : { permitido: false, motivo: 'plano', plano: 'starter' },
  );
  const r = await requisitar();
  expect(r.status).toBe(status);
  expect(r.headers.get('Cache-Control')).toContain('no-store');
  expect(from).not.toHaveBeenCalled();
});
it('proposta invisível não revela se existe', async () => {
  q.maybeSingle.mockResolvedValue({ data: null, error: null });
  const r = await requisitar();
  expect(r.status).toBe(404);
  expect(await r.text()).toBe('');
});
it('valida novamente a sessão e oculta erro do banco', async () => {
  getUser.mockResolvedValueOnce({ data: { user: null } });
  expect((await requisitar()).status).toBe(401);
  q.maybeSingle.mockResolvedValue({ data: null, error: { message: 'segredo' } });
  const r = await requisitar();
  expect(r.status).toBe(503);
  expect(await r.text()).not.toContain('segredo');
});
