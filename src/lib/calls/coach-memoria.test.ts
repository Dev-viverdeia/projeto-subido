import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types.generated';
vi.mock('server-only', () => ({}));
import { obterMemoriaCoach } from './coach-memoria';

describe('memória privada do coach', () => {
  it('busca somente a reunião do dono e não resgata orientação anterior após silêncio', async () => {
    const consulta = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { status: 'dispensada', criada_em: new Date().toISOString() },
        error: null,
      }),
      data: [{ id: 'anterior', sugestao: 'Quantos contatos chegam?', status: 'nova' }],
      error: null,
    };
    const supabase = { from: vi.fn(() => consulta) } as unknown as SupabaseClient<Database>;
    const memoria = await obterMemoriaCoach(supabase, 'dono', 'reuniao');
    expect(consulta.eq).toHaveBeenCalledWith('dono', 'dono');
    expect(consulta.eq).toHaveBeenCalledWith('reuniao_id', 'reuniao');
    expect(consulta.neq).toHaveBeenCalledWith('status', 'dispensada');
    expect(consulta.limit).toHaveBeenCalledWith(8);
    expect(memoria.vigente).toBeNull();
    expect(memoria.historico).toHaveLength(1);
  });
});
