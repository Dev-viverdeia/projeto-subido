import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types.generated';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/errors', () => ({ handleError: vi.fn() }));
import { obterOperacoesResumo } from './operacoes-resumo-query';
import { handleError } from '@/lib/errors';

const limite = vi.fn();
const consulta = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: limite,
};
const from = vi.fn(() => consulta);
const client = { from } as unknown as SupabaseClient<Database>;
beforeEach(() => vi.clearAllMocks());
describe('leitura privada do processamento', () => {
  it('filtra a reunião e as operações pertinentes, sem payload, segredo ou mutação', async () => {
    limite.mockResolvedValue({
      error: null,
      data: [
        {
          tipo: 'pos_call',
          status: 'processando',
          tentativas: 1,
          disponivel_em: 'agora',
          bloqueado_ate: 'depois',
          atualizado_em: 'agora',
          payload: { segredo: 'não sai' },
          bloqueio_id: 'não sai',
          erro_mensagem: 'não sai',
        },
      ],
    });
    expect(await obterOperacoesResumo(client, 'minha-reuniao')).toEqual([
      {
        tipo: 'pos_call',
        status: 'processando',
        tentativas: 1,
        disponivelEm: 'agora',
        bloqueadoAte: 'depois',
        atualizadaEm: 'agora',
      },
    ]);
    expect(from).toHaveBeenCalledExactlyOnceWith('operacoes_jobs');
    expect(consulta.eq).toHaveBeenCalledWith('referencia_tipo', 'call_reuniao');
    expect(consulta.eq).toHaveBeenCalledWith('referencia_id', 'minha-reuniao');
    expect(consulta.in).toHaveBeenCalledWith('tipo', ['pos_call', 'encerramento_sala']);
    expect(consulta.select).toHaveBeenCalledExactlyOnceWith(
      'tipo, status, tentativas, disponivel_em, bloqueado_ate, atualizado_em',
    );
    expect(limite).toHaveBeenCalledExactlyOnceWith(20);
  });
  it('não confunde falha de leitura com ausência de processamento', async () => {
    limite.mockResolvedValue({ error: { code: '42501' }, data: null });
    expect(await obterOperacoesResumo(client, 'id')).toBeNull();
    expect(handleError).toHaveBeenCalled();
    limite.mockResolvedValue({ error: null, data: [] });
    expect(await obterOperacoesResumo(client, 'id')).toEqual([]);
  });
});
