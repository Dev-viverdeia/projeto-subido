import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { create, revalidar } = vi.hoisted(() => ({ create: vi.fn(), revalidar: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: create }));
vi.mock('next/cache', () => ({ revalidatePath: revalidar }));
import { BuscaConversasSchema, NomeConversaSchema, termoHistorico } from './historico-contrato';
import { renomearConversa } from './renomear';
import { obterHistorico } from './historico-queries';
const dono = '11111111-1111-4111-8111-111111111111';
const id = '33333333-3333-4333-8333-333333333333';
const metodos = ['select', 'eq', 'order', 'ilike', 'range', 'update', 'maybeSingle'] as const;
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
it('valida título, conta, página e busca literal', () => {
  const base = { id, dono, anterior: 'Antigo', titulo: ' Novo ' };
  expect(NomeConversaSchema.parse(base).titulo).toBe('Novo');
  for (const titulo of ['', ' ', 'a'.repeat(121), 'a\nb'])
    expect(NomeConversaSchema.safeParse({ ...base, titulo }).success).toBe(false);
  expect(BuscaConversasSchema.safeParse({ dono, pagina: -1 }).success).toBe(false);
  expect(BuscaConversasSchema.safeParse({ dono, pagina: 1.5 }).success).toBe(false);
  expect(BuscaConversasSchema.safeParse({ dono, busca: 'a'.repeat(121) }).success).toBe(false);
  expect(termoHistorico('20%_\\')).toBe('%20\\%\\_\\\\%');
});
it('renomeia só a conversa do dono e compara o nome anterior', async () => {
  query.maybeSingle.mockResolvedValue({ data: { titulo: 'Novo' }, error: null });
  expect(await renomearConversa({ id, dono, anterior: 'Antigo', titulo: ' Novo ' })).toEqual({
    titulo: 'Novo',
  });
  expect(query.update).toHaveBeenCalledWith({ titulo: 'Novo' });
  expect(query.eq.mock.calls).toEqual([
    ['id', id],
    ['dono', dono],
    ['titulo', 'Antigo'],
  ]);
  expect(revalidar).toHaveBeenCalledWith(`/consultor/${id}`);
});
it('sessão diferente não renomeia nem pesquisa em nome de outra conta', async () => {
  expect(await renomearConversa({ id, dono: id, anterior: 'A', titulo: 'B' })).toHaveProperty(
    'erro',
  );
  expect(await obterHistorico('', 0, id)).toBeNull();
  expect(query.update).not.toHaveBeenCalled();
  expect(query.select).not.toHaveBeenCalled();
});
it('nome já alterado ou id alheio não causa falso sucesso', async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect(await renomearConversa({ id, dono, anterior: 'A', titulo: 'B' })).toHaveProperty('erro');
  expect(revalidar).not.toHaveBeenCalled();
});
it('falha do banco não expõe a mensagem interna', async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: { message: 'SECRET internals' } });
  const resposta = await renomearConversa({ id, dono, anterior: 'A', titulo: 'B' });
  expect(resposta).toHaveProperty('erro');
  expect(JSON.stringify(resposta)).not.toContain('SECRET');
});
it('busca no servidor e pagina com ordenação estável sem retornar dados da mensagem', async () => {
  query.range.mockResolvedValue({
    data: [{ id, titulo: 'Clínica', criado_em: 'ontem', atualizado_em: 'hoje' }],
    count: 100,
    error: null,
  });
  const pagina = await obterHistorico('Clínica', 1, dono);
  expect(pagina).toEqual({
    threads: [{ id, titulo: 'Clínica', criadoEm: 'ontem', atualizadoEm: 'hoje' }],
    total: 100,
    mais: true,
  });
  expect(query.eq).toHaveBeenCalledWith('dono', dono);
  expect(query.range).toHaveBeenCalledWith(40, 79);
  expect(query.order.mock.calls).toEqual([
    ['atualizado_em', { ascending: false }],
    ['id', { ascending: true }],
  ]);
  expect(query.ilike).toHaveBeenCalledWith('titulo', '%Clínica%');
});
