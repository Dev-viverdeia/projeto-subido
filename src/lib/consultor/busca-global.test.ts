import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: create }));
import { buscarMensagensHistorico } from './busca-global-queries';
import { BuscaGlobalSchema } from './busca-global-contrato';
const dono = '11111111-1111-4111-8111-111111111111';
const outra = '33333333-3333-4333-8333-333333333333';
const metodos = ['select', 'eq', 'order', 'ilike', 'range'] as const;
let query: Record<(typeof metodos)[number], ReturnType<typeof vi.fn>>;
beforeEach(() => {
  vi.clearAllMocks();
  query = Object.fromEntries(metodos.map((k) => [k, vi.fn()])) as typeof query;
  Object.values(query).forEach((fn) => fn.mockReturnValue(query));
  create.mockResolvedValue({
    auth: { getClaims: vi.fn().mockResolvedValue({ data: { claims: { sub: dono } } }) },
    from: vi.fn().mockReturnValue(query),
  });
});
it('aceita pesquisa sem thread, mas exige owner, termo e página válidos', () => {
  expect(BuscaGlobalSchema.parse({ dono, busca: '  Proposta  ' })).toEqual({
    dono,
    busca: 'Proposta',
    pagina: 0,
  });
  for (const invalido of [
    { dono: '' },
    { busca: 'a' },
    { busca: ' ' },
    { busca: 'a'.repeat(121) },
    { pagina: -1 },
    { pagina: 1.5 },
    { pagina: 10001 },
  ])
    expect(BuscaGlobalSchema.safeParse({ dono, busca: 'proposta', ...invalido }).success).toBe(
      false,
    );
});
it('recusa ausência de sessão e tentativa de pesquisar outra conta antes da consulta', async () => {
  expect(await buscarMensagensHistorico(outra, 'proposta')).toBeNull();
  expect(query.select).not.toHaveBeenCalled();
  create.mockResolvedValue({ auth: { getClaims: vi.fn().mockResolvedValue({ data: null }) } });
  expect(await buscarMensagensHistorico(dono, 'proposta')).toBeNull();
});
it('delimita pelo owner, escapa curingas, pagina e só envia trechos e origens', async () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({
    id: String(i),
    thread_id: i % 2 ? 'conversa-1' : 'conversa-2',
    papel: i % 2 ? 'usuario' : 'consultor',
    conteudo: 'Antes '.repeat(200) + 'Escopo 20%_\\ final ' + 'Depois '.repeat(200),
    criado_em: 'agora',
    consultor_threads: { dono, titulo: `Título ${i}` },
    contexto_anexos: 'SEGREDO',
  }));
  query.range.mockResolvedValue({ data: rows, error: null });
  const resposta = await buscarMensagensHistorico(dono, '20%_\\', 1);
  expect(query.eq.mock.calls).toEqual([['consultor_threads.dono', dono]]);
  expect(query.ilike).toHaveBeenCalledWith('conteudo', '%20\\%\\_\\\\%');
  expect(query.range).toHaveBeenCalledWith(20, 40);
  expect(query.select.mock.calls[0]).toHaveLength(1);
  expect(query.order.mock.calls).toEqual([
    ['criado_em', { ascending: false }],
    ['id', { ascending: true }],
  ]);
  expect(resposta?.mais).toBe(true);
  expect(resposta?.mensagens).toHaveLength(20);
  expect(resposta?.mensagens[0]).toMatchObject({
    id: '0',
    conversa: 'conversa-2',
    titulo: 'Título 0',
    papel: 'consultor',
  });
  expect(resposta?.mensagens[1]?.papel).toBe('usuario');
  expect(resposta?.mensagens[0]?.trecho).toContain('20%_\\');
  expect(resposta?.mensagens[0]?.trecho.length).toBeLessThan(330);
  expect(JSON.stringify(resposta)).not.toMatch(/SEGREDO|contexto_anexos|conteudo|dono/);
});
it('distingue vazio, fim da paginação e falha sem expor erro interno', async () => {
  query.range.mockResolvedValue({ data: [], error: null });
  expect(await buscarMensagensHistorico(dono, 'vazio')).toEqual({ mensagens: [], mais: false });
  query.range.mockResolvedValue({ data: null, error: { message: 'SEGREDO' } });
  await expect(buscarMensagensHistorico(dono, 'falha')).rejects.toThrow(
    'Falha ao buscar no histórico',
  );
});
