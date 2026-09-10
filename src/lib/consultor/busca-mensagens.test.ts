import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: create }));
import { buscarMensagensConversa } from './busca-mensagens-queries';
import { BuscaMensagensSchema, trechoDaMensagem } from './busca-mensagens-contrato';
const dono = '11111111-1111-4111-8111-111111111111';
const conversa = '33333333-3333-4333-8333-333333333333';
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
it('exige conta, thread, termo de 2 a 120 caracteres e página limitada', () => {
  expect(BuscaMensagensSchema.parse({ dono, conversa, busca: '  Escopo  ' })).toEqual({
    dono,
    conversa,
    busca: 'Escopo',
    pagina: 0,
  });
  for (const invalido of [
    { dono: '' },
    { conversa: 'outra' },
    { busca: '' },
    { busca: ' ' },
    { busca: 'a' },
    { busca: 'a'.repeat(121) },
    { pagina: -1 },
    { pagina: 1.5 },
    { pagina: 10001 },
  ])
    expect(
      BuscaMensagensSchema.safeParse({ dono, conversa, busca: 'escopo', ...invalido }).success,
    ).toBe(false);
});
it('não consulta conteúdo sem sessão ou quando a conta mudou', async () => {
  expect(await buscarMensagensConversa(conversa, conversa, 'escopo')).toBeNull();
  expect(query.select).not.toHaveBeenCalled();
  create.mockResolvedValue({ auth: { getClaims: vi.fn().mockResolvedValue({ data: null }) } });
  expect(await buscarMensagensConversa(conversa, dono, 'escopo')).toBeNull();
});
it('filtra owner da sessão e thread, escapa curingas e retorna somente trechos paginados', async () => {
  const conteudo = 'Antes '.repeat(200) + 'Escopo 20%_\\ final ' + 'Depois '.repeat(200);
  query.range.mockResolvedValue({
    data: [
      { id: 'm', papel: 'consultor', conteudo, criado_em: 'agora', contexto_anexos: 'SEGREDO' },
    ],
    count: 41,
    error: null,
  });
  const resposta = await buscarMensagensConversa(conversa, dono, '20%_\\', 1);
  expect(query.eq.mock.calls).toEqual([
    ['thread_id', conversa],
    ['consultor_threads.dono', dono],
  ]);
  expect(query.ilike).toHaveBeenCalledWith('conteudo', '%20\\%\\_\\\\%');
  expect(query.range).toHaveBeenCalledWith(20, 39);
  expect(query.order.mock.calls).toEqual([
    ['criado_em', { ascending: false }],
    ['id', { ascending: true }],
  ]);
  expect(resposta).toMatchObject({
    total: 41,
    mais: true,
    mensagens: [{ id: 'm', papel: 'consultor' }],
  });
  expect(resposta?.mensagens[0]?.trecho).toContain('20%_\\');
  expect(resposta?.mensagens[0]?.trecho.length).toBeLessThan(330);
  expect(JSON.stringify(resposta)).not.toMatch(/SEGREDO|contexto_anexos|conteudo/);
  expect(query.select.mock.calls[0]?.[0]).not.toMatch(/cartoes|modelo|direcao|contexto_anexos/);
});
it('trecho inclui ocorrências no começo, no fim e com acentos sem interpretar HTML', () => {
  expect(trechoDaMensagem('Reunião de amanhã', 'REUNIÃO')).toBe('Reunião de amanhã');
  expect(trechoDaMensagem('texto '.repeat(1000) + 'DECISÃO FINAL', 'decisão')).toMatch(
    /^….*DECISÃO FINAL$/,
  );
  expect(trechoDaMensagem('<script>escopo</script>', 'escopo')).toBe('<script>escopo</script>');
});
it('diferencia nenhum resultado de erro sem expor o banco', async () => {
  query.range.mockResolvedValue({ data: [], count: 0, error: null });
  expect(await buscarMensagensConversa(conversa, dono, 'vazio')).toEqual({
    mensagens: [],
    total: 0,
    mais: false,
  });
  query.range.mockResolvedValue({ data: null, error: { message: 'SEGREDO' } });
  await expect(buscarMensagensConversa(conversa, dono, 'falha')).rejects.toThrow(
    'Falha ao buscar mensagens',
  );
});
