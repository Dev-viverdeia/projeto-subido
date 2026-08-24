import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getClaims, redirect } = vi.hoisted(() => ({
  getClaims: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getClaims } })),
}));

import { exigirRecurso, obterAcessoRecurso } from './server';

describe('autorização de recursos no servidor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirect.mockImplementation((destino: string) => {
      throw new Error(`redirect:${destino}`);
    });
  });

  it('não transforma ausência de sessão no fallback legado Pro', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await expect(obterAcessoRecurso('modulo_comercial')).resolves.toEqual({
      permitido: false,
      motivo: 'sessao',
    });
    await expect(exigirRecurso('modulo_comercial')).rejects.toThrow('redirect:/entrar');
  });

  it('mantém o Live Coach no Starter e bloqueia a operação comercial', async () => {
    getClaims.mockResolvedValue({
      data: { claims: { app_metadata: { plano_subido: 'starter' } } },
      error: null,
    });

    await expect(obterAcessoRecurso('live_coach')).resolves.toEqual({
      permitido: true,
      plano: 'starter',
    });
    await expect(exigirRecurso('modulo_comercial')).rejects.toThrow(
      'redirect:/conta?upgrade=modulo_comercial',
    );
  });

  it('libera a operação comercial no Pro', async () => {
    getClaims.mockResolvedValue({
      data: { claims: { app_metadata: { plano_subido: 'pro' } } },
      error: null,
    });

    await expect(obterAcessoRecurso('modulo_comercial')).resolves.toEqual({
      permitido: true,
      plano: 'pro',
    });
  });
});
