import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createAdminClient } = vi.hoisted(() => ({ createAdminClient: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient }));

import { registrarEntradaNaSala } from './admin';

const entrada = {
  dono: '11111111-1111-4111-8111-111111111111',
  reuniaoId: '22222222-2222-4222-8222-222222222222',
  papel: 'anfitriao' as const,
  nome: 'QA Subido',
  identidade: 'host-11111111-1111-4111-8111-111111111111',
};

describe('registro de presença na sala', () => {
  beforeEach(() => createAdminClient.mockReset());

  it('registra a primeira entrada com horário e consentimento', async () => {
    const insert = vi.fn((_participante: Record<string, unknown>) =>
      Promise.resolve({ error: null }),
    );
    createAdminClient.mockReturnValue({ from: vi.fn(() => ({ insert })) });

    await registrarEntradaNaSala(entrada);

    const participante = insert.mock.calls[0]?.[0];
    expect(participante).toBeDefined();
    if (!participante) throw new Error('A entrada não foi registrada.');
    expect(participante).toMatchObject({
      dono: entrada.dono,
      reuniao_id: entrada.reuniaoId,
      identidade_provedor: entrada.identidade,
      saiu_em: null,
    });
    expect(typeof participante.entrou_em).toBe('string');
    expect(typeof participante.consentiu_gravacao_em).toBe('string');
  });

  it('renova a presença quando o anfitrião entra novamente', async () => {
    const insert = vi.fn((_participante: Record<string, unknown>) =>
      Promise.resolve({ error: { code: '23505' } }),
    );
    const atualizacao = {
      error: null,
      eq: vi.fn().mockReturnThis(),
    };
    const update = vi.fn((_participante: Record<string, unknown>) => atualizacao);
    createAdminClient.mockReturnValue({ from: vi.fn(() => ({ insert, update })) });

    await registrarEntradaNaSala(entrada);

    const participante = update.mock.calls[0]?.[0];
    expect(participante).toBeDefined();
    if (!participante) throw new Error('A reentrada não foi registrada.');
    expect(participante).toMatchObject({ nome: entrada.nome, saiu_em: null });
    expect(typeof participante.entrou_em).toBe('string');
    expect(typeof participante.consentiu_gravacao_em).toBe('string');
    expect(atualizacao.eq).toHaveBeenCalledWith('dono', entrada.dono);
    expect(atualizacao.eq).toHaveBeenCalledWith('reuniao_id', entrada.reuniaoId);
    expect(atualizacao.eq).toHaveBeenCalledWith('identidade_provedor', entrada.identidade);
  });
});
