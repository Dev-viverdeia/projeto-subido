import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient, getClaims, updateUser, refreshSession, refresh } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getClaims: vi.fn(),
  updateUser: vi.fn(),
  refreshSession: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient }));
vi.mock('next/cache', () => ({ refresh }));

import { atualizarIdentidade } from './actions';

function formulario(nome: string) {
  const dados = new FormData();
  dados.set('nome', nome);
  return dados;
}

describe('atualizarIdentidade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({ auth: { getClaims, updateUser, refreshSession } });
    getClaims.mockResolvedValue({
      data: { claims: { sub: 'usuario-1', user_metadata: { nome: 'Nome anterior' } } },
      error: null,
    });
    updateUser.mockResolvedValue({ error: null });
    refreshSession.mockResolvedValue({ error: null });
  });

  it('barra nomes inválidos antes de tocar a sessão', async () => {
    const resultado = await atualizarIdentidade({}, formulario('A'));

    expect(resultado.porCampo?.nome).toMatch(/Digite seu nome/i);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('exige uma sessão autenticada mesmo vindo da área logada', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    const resultado = await atualizarIdentidade({}, formulario('Novo Nome'));

    expect(resultado.erro).toMatch(/sessão expirou/i);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('atualiza metadata, renova os claims e refresca o shell', async () => {
    const resultado = await atualizarIdentidade({}, formulario('  Novo Nome  '));

    expect(updateUser).toHaveBeenCalledWith({ data: { nome: 'Novo Nome' } });
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledOnce();
    expect(resultado).toMatchObject({
      sucesso: 'Nome atualizado em toda a plataforma.',
      nome: 'Novo Nome',
    });
  });

  it('não faz uma escrita quando o nome já está correto', async () => {
    const resultado = await atualizarIdentidade({}, formulario('Nome anterior'));

    expect(updateUser).not.toHaveBeenCalled();
    expect(refreshSession).not.toHaveBeenCalled();
    expect(resultado.sucesso).toMatch(/já está atualizado/i);
  });
});
