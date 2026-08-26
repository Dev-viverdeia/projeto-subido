import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient, signInWithPassword, signUp, resend, signInWithOAuth, redirect } = vi.hoisted(
  () => ({
    createClient: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resend: vi.fn(),
    signInWithOAuth: vi.fn(),
    redirect: vi.fn(),
  }),
);

vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('next/cache', () => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect }));

import { criarConta, entrar, entrarComGoogle, reenviarConfirmacao } from './actions';

function dados(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(campos)) formData.set(chave, valor);
  return formData;
}

describe('jornada de acesso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({
      auth: { signInWithPassword, signUp, resend, signInWithOAuth },
    });
    signInWithPassword.mockResolvedValue({ error: null });
    signUp.mockResolvedValue({ error: null });
    resend.mockResolvedValue({ error: null });
    signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=teste' },
      error: null,
    });
  });

  it('orienta a conferir o e-mail sem afirmar que uma conta foi criada', async () => {
    const resultado = await criarConta(
      {},
      dados({ nome: 'Rafael Milagre', email: 'rafael@example.com', senha: 'Senha!123' }),
    );

    expect(signUp).toHaveBeenCalledOnce();
    expect(signUp.mock.calls[0]?.[0]).toMatchObject({
      email: 'rafael@example.com',
      options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
    });
    expect(resultado).toMatchObject({
      emailPendente: 'rafael@example.com',
      confirmacaoPendente: true,
    });
    expect(resultado.sucesso).toMatch(/se este e-mail ainda não tinha uma conta/i);
  });

  it('oferece reenvio quando o login depende da confirmação', async () => {
    signInWithPassword.mockResolvedValue({
      error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
    });

    const resultado = await entrar(
      {},
      dados({ email: 'pendente@example.com', senha: 'Senha!123' }),
    );

    expect(resultado).toMatchObject({
      erro: 'Confirme seu e-mail antes de entrar.',
      emailPendente: 'pendente@example.com',
      confirmacaoPendente: true,
    });
  });

  it('reenvia confirmação para o callback oficial e mantém resposta neutra', async () => {
    const resultado = await reenviarConfirmacao({}, dados({ email: 'pendente@example.com' }));

    expect(resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'pendente@example.com',
      options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
    });
    expect(resultado.sucesso).toMatch(/se a confirmação ainda estava pendente/i);
  });

  it('pede apenas identidade básica ao Google e preserva o destino seguro', async () => {
    redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(
      entrarComGoogle(dados({ proximo: '/vendas/cliente-1?aba=resumo' })),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo:
          'http://localhost:3000/auth/callback?proximo=%2Fvendas%2Fcliente-1%3Faba%3Dresumo',
        scopes: 'openid email profile',
      },
    });
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('accounts.google.com'));
  });
});
