import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cronEnv, processarLembretesValidacao } = vi.hoisted(() => ({
  cronEnv: vi.fn(),
  processarLembretesValidacao: vi.fn(),
}));

vi.mock('@/lib/env', () => ({ cronEnv }));
vi.mock('@/lib/notificacoes/lembretes', () => ({ processarLembretesValidacao }));

import { GET } from './route';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';

describe('cron de lembretes do portal', () => {
  beforeEach(() => {
    cronEnv.mockReset();
    processarLembretesValidacao.mockReset();
    cronEnv.mockReturnValue({ CRON_SECRET: SEGREDO });
  });

  it('recusa chamadas sem o segredo do agendador', async () => {
    const resposta = await GET(new Request('http://localhost/api/notificacoes/portal/lembretes'));

    expect(resposta.status).toBe(401);
    expect(processarLembretesValidacao).not.toHaveBeenCalled();
  });

  it('processa somente a chamada autenticada', async () => {
    processarLembretesValidacao.mockResolvedValue({
      reservados: 2,
      enviados: 2,
      falharam: 0,
    });

    const resposta = await GET(
      new Request('http://localhost/api/notificacoes/portal/lembretes', {
        headers: { authorization: `Bearer ${SEGREDO}` },
      }),
    );

    expect(resposta.status).toBe(200);
    await expect(resposta.json()).resolves.toEqual({
      reservados: 2,
      enviados: 2,
      falharam: 0,
    });
  });
});
