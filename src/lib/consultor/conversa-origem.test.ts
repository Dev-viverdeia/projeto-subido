import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
vi.mock('./contexto', () => ({ hashDoContexto: vi.fn(), obterSinaisSobral: vi.fn() }));
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: create }));
import { obterConversa } from './queries';
const id = '33333333-3333-4333-8333-333333333333';
const metodos = ['select', 'eq', 'order', 'limit', 'maybeSingle'] as const;
let mensagens: Record<(typeof metodos)[number], ReturnType<typeof vi.fn>>;
const row = (id: string, papel = 'usuario') => ({
  id,
  papel,
  conteudo: id,
  cartoes: [],
  direcao: null,
  modelo: null,
  criado_em: '2026-09-10',
  consultor_anexos: [],
  sobral_acoes_crm: null,
  sobral_geracoes: null,
});
beforeEach(() => {
  vi.clearAllMocks();
  mensagens = Object.fromEntries(metodos.map((k) => [k, vi.fn()])) as typeof mensagens;
  Object.values(mensagens).forEach((fn) => fn.mockReturnValue(mensagens));
  const thread = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { id, titulo: 'Conversa', criado_em: 'ontem', atualizado_em: 'hoje' },
      error: null,
    }),
  };
  thread.select.mockReturnValue(thread);
  thread.eq.mockReturnValue(thread);
  create.mockResolvedValue({
    from: vi.fn((t) => (t === 'consultor_threads' ? thread : mensagens)),
  });
  mensagens.limit.mockResolvedValue({
    data: [row('atual', 'consultor'), row('anterior')],
    error: null,
  });
});
it('mantém a última rodada real e carrega as 200 mensagens mais recentes', async () => {
  const dados = await obterConversa(id);
  expect(dados?.mensagens.map((m) => m.id)).toEqual(['anterior', 'atual']);
  expect(mensagens.order.mock.calls).toEqual([
    ['criado_em', { ascending: false }],
    ['id', { ascending: false }],
  ]);
  expect(mensagens.limit).toHaveBeenCalledWith(200);
});
it('origem já carregada não é consultada duas vezes', async () => {
  const dados = await obterConversa(id, 'anterior');
  expect(dados?.mensagemAvulsa).toBeUndefined();
  expect(mensagens.maybeSingle).not.toHaveBeenCalled();
});
it('origem antiga usa a mesma thread e não vira uma rodada de IA pendente', async () => {
  mensagens.maybeSingle.mockResolvedValue({ data: row('antiga'), error: null });
  const dados = await obterConversa(id, 'antiga');
  expect(dados?.mensagens.map((m) => m.id)).toEqual(['antiga', 'anterior', 'atual']);
  expect(dados?.mensagens.at(-1)?.papel).toBe('consultor');
  expect(dados?.mensagemAvulsa).toBe('antiga');
  expect(mensagens.eq.mock.calls).toEqual([
    ['thread_id', id],
    ['thread_id', id],
    ['id', 'antiga'],
  ]);
});
it('origem de outra conversa ou removida nunca é inserida na leitura', async () => {
  mensagens.maybeSingle.mockResolvedValue({ data: null, error: null });
  const dados = await obterConversa(id, 'alheia');
  expect(dados?.mensagens).toHaveLength(2);
  expect(dados?.mensagemAvulsa).toBeUndefined();
});
