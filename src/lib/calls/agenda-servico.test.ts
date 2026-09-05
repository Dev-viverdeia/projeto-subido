import { afterEach, describe, expect, it, vi } from 'vitest';
import type { createClient } from '@/lib/supabase/server';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/google-calendar/tokens', () => ({ decifrarTokenGoogle: () => 'refresh-teste' }));
vi.mock('@/lib/google-calendar/oauth', () => ({
  renovarTokenGoogle: async () => {
    await Promise.resolve();
    return { access_token: 'token-teste' };
  },
  GoogleCalendarPrecisaReconectar: class extends Error {},
}));

import { executarAlteracaoAgenda } from './agenda-servico';

const ID = '22222222-2222-4222-8222-222222222222';
const DONO = '44444444-4444-4444-8444-444444444444';
const VERSAO = '2026-09-01T12:00:00.000Z';
const inicial = {
  id: ID,
  dono: DONO,
  status: 'agendada',
  titulo: 'Descoberta',
  codigo_publico: '33333333-3333-4333-8333-333333333333',
  agendada_para: '2026-12-10T18:00:00.000Z',
  duracao_minutos: 45,
  oportunidade_id: '55555555-5555-4555-8555-555555555555',
  atualizada_em: VERSAO,
  iniciada_em: null,
  convidado_email: 'convidado@example.com',
  google_event_id: `subido${ID.replaceAll('-', '')}`,
  google_calendar_id: 'dono@example.com',
  google_sync_status: 'sincronizado',
  google_event_url: 'https://calendar.google.com/event',
  google_sync_erro: null,
  empresa: { nome: 'Empresa teste' },
  contato: { nome: 'Ana' },
};

/** Double apenas do PostgREST: filtros/CAS e persistência reais em memória. */
function banco(
  opcoes: {
    linha?: Record<string, unknown>;
    conectado?: boolean;
    falharFinalizacao?: boolean;
  } = {},
) {
  let linha = { ...inicial, ...opcoes.linha };
  let sequencia = 0;
  const cliente = {
    rpc: vi.fn(async (nome: string) => {
      await Promise.resolve();
      return nome === 'google_calendar_obter_token'
        ? {
            data:
              opcoes.conectado === false
                ? []
                : [
                    {
                      refresh_token_cifrado: 'x'.repeat(50),
                      calendar_id: 'primary',
                      google_email: 'dono@example.com',
                      status: 'ativa',
                    },
                  ],
            error: null,
          }
        : { data: null, error: null };
    }),
    from: () => {
      const filtros: Array<[string, unknown]> = [];
      let alteracao: Record<string, unknown> | null = null;
      const query = {
        select: () => query,
        eq: (campo: string, valor: unknown) => {
          filtros.push([campo, valor]);
          return query;
        },
        update: (valores: Record<string, unknown>) => {
          alteracao = valores;
          return query;
        },
        maybeSingle: async () => {
          await Promise.resolve();
          if (!filtros.every(([campo, valor]) => linha[campo as keyof typeof linha] === valor))
            return { data: null, error: null };
          if (alteracao && opcoes.falharFinalizacao && sequencia > 0)
            return { data: null, error: { code: 'db_offline' } };
          if (alteracao)
            linha = {
              ...linha,
              ...alteracao,
              atualizada_em: `2026-09-06T00:00:0${++sequencia}.000Z`,
            };
          return { data: { ...linha }, error: null };
        },
      };
      return query;
    },
  };
  return {
    cliente: cliente as unknown as Awaited<ReturnType<typeof createClient>>,
    ler: () => linha,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('alterações persistidas antes de chamar o Google', () => {
  it('mantém cancelamento e referência ao evento quando o Google falha, permitindo nova tentativa', async () => {
    await Promise.resolve();
    const db = banco();
    vi.stubGlobal('fetch', async () => {
      await Promise.resolve();
      return new Response(null, { status: 503 });
    });
    const resultado = await executarAlteracaoAgenda(db.cliente, {
      reuniaoId: ID,
      dono: DONO,
      acao: 'cancelar',
      versao: VERSAO,
    });
    expect(resultado.status).toBe('pendente');
    expect(db.ler().status).toBe('cancelada');
    expect(db.ler().google_sync_status).toBe('falhou');
    expect(db.ler().google_event_id).toBe(inicial.google_event_id);
    vi.stubGlobal('fetch', async () => {
      await Promise.resolve();
      return new Response(null, { status: 410 });
    });
    expect(
      (
        await executarAlteracaoAgenda(db.cliente, {
          reuniaoId: ID,
          dono: DONO,
          acao: 'sincronizar',
        })
      ).status,
    ).toBe('concluido');
    expect(db.ler().google_sync_status).toBe('sincronizado');
    expect(db.ler().status).toBe('cancelada');
  });
  it('salva o novo horário mesmo sem conexão e permite reconectar sem duplicar a reunião', async () => {
    await Promise.resolve();
    const db = banco({ conectado: false });
    const fetchGoogle = vi.fn();
    vi.stubGlobal('fetch', fetchGoogle);
    const resultado = await executarAlteracaoAgenda(db.cliente, {
      reuniaoId: ID,
      dono: DONO,
      acao: 'reagendar',
      versao: VERSAO,
      agendadaPara: '2026-12-11T18:00:00.000Z',
      duracaoMinutos: 30,
    });
    expect(resultado.status).toBe('pendente');
    expect(resultado.reconectar).toBe(true);
    expect(db.ler().id).toBe(ID);
    expect(db.ler().agendada_para).toBe('2026-12-11T18:00:00.000Z');
    expect(fetchGoogle).not.toHaveBeenCalled();
  });
  it('não altera nem acessa Google quando o registro pertence a outra conta', async () => {
    await Promise.resolve();
    const db = banco();
    const fetchGoogle = vi.fn();
    vi.stubGlobal('fetch', fetchGoogle);
    expect(
      (
        await executarAlteracaoAgenda(db.cliente, {
          reuniaoId: ID,
          dono: 'outro',
          acao: 'cancelar',
          versao: VERSAO,
        })
      ).status,
    ).toBe('erro');
    expect(db.ler().status).toBe('agendada');
    expect(fetchGoogle).not.toHaveBeenCalled();
  });
  it('rejeita um formulário antigo antes de sobrescrever o horário atual', async () => {
    await Promise.resolve();
    const db = banco();
    expect(
      (
        await executarAlteracaoAgenda(db.cliente, {
          reuniaoId: ID,
          dono: DONO,
          acao: 'cancelar',
          versao: 'antiga',
        })
      ).status,
    ).toBe('erro');
    expect(db.ler().status).toBe('agendada');
  });
  it('impede duas alterações concorrentes na mesma reunião', async () => {
    await Promise.resolve();
    const db = banco();
    vi.stubGlobal('fetch', async () => {
      await Promise.resolve();
      return new Response(null, { status: 410 });
    });
    const resultados = await Promise.all(
      [1, 2].map(() =>
        executarAlteracaoAgenda(db.cliente, {
          reuniaoId: ID,
          dono: DONO,
          acao: 'cancelar',
          versao: VERSAO,
        }),
      ),
    );
    expect(resultados.filter((r) => r.status === 'concluido')).toHaveLength(1);
    expect(db.ler().status).toBe('cancelada');
  });
  it('não confirma sucesso quando a gravação final no banco falha', async () => {
    await Promise.resolve();
    const db = banco({ falharFinalizacao: true });
    vi.stubGlobal('fetch', async () => {
      await Promise.resolve();
      return new Response(null, { status: 410 });
    });
    expect(
      (
        await executarAlteracaoAgenda(db.cliente, {
          reuniaoId: ID,
          dono: DONO,
          acao: 'cancelar',
          versao: VERSAO,
        })
      ).status,
    ).toBe('pendente');
  });
  it('não reagenda uma reunião que já começou', async () => {
    await Promise.resolve();
    const db = banco({ linha: { status: 'ao_vivo', iniciada_em: VERSAO } });
    expect(
      (
        await executarAlteracaoAgenda(db.cliente, {
          reuniaoId: ID,
          dono: DONO,
          acao: 'reagendar',
          versao: VERSAO,
          agendadaPara: '2026-12-11T18:00:00.000Z',
          duracaoMinutos: 30,
        })
      ).status,
    ).toBe('erro');
    expect(db.ler().agendada_para).toBe(inicial.agendada_para);
  });
});
