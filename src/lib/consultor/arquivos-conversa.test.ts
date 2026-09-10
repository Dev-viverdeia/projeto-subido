import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: create }));
import { obterArquivosConversa } from './arquivos-conversa-queries';
import { BuscaArquivosConversaSchema } from './arquivos-conversa-contrato';
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
it('exige conversa e conta válidas, limita termo e página', () => {
  expect(BuscaArquivosConversaSchema.parse({ dono, conversa })).toEqual({
    dono,
    conversa,
    busca: '',
    pagina: 0,
  });
  for (const invalido of [
    { dono: '' },
    { conversa: 'alheio' },
    { pagina: -1 },
    { pagina: 1.5 },
    { pagina: 10001 },
    { busca: 'a'.repeat(121) },
  ])
    expect(BuscaArquivosConversaSchema.safeParse({ dono, conversa, ...invalido }).success).toBe(
      false,
    );
});
it('sessão diferente não consulta nomes de arquivos', async () => {
  expect(await obterArquivosConversa(conversa, conversa)).toBeNull();
  expect(query.select).not.toHaveBeenCalled();
});
it('sessão ausente não consulta arquivos', async () => {
  create.mockResolvedValue({ auth: { getClaims: vi.fn().mockResolvedValue({ data: null }) } });
  expect(await obterArquivosConversa(conversa, dono)).toBeNull();
});
it('busca literal e paginação consultam todos os anexos da thread, sem carregar conteúdo', async () => {
  query.range.mockResolvedValue({
    data: [
      {
        id: 'a',
        nome: '20%_\\.pdf',
        tipo_mime: 'application/pdf',
        tamanho_bytes: 200,
        categoria: 'documento',
        mensagem_id: 'm',
        criado_em: 'hoje',
      },
    ],
    count: 42,
    error: null,
  });
  expect(await obterArquivosConversa(conversa, dono, '20%_\\', 1)).toEqual({
    arquivos: [
      {
        id: 'a',
        nome: '20%_\\.pdf',
        tipoMime: 'application/pdf',
        tamanhoBytes: 200,
        categoria: 'documento',
        mensagemId: 'm',
        criadoEm: 'hoje',
      },
    ],
    total: 42,
    mais: true,
  });
  expect(query.eq.mock.calls).toEqual([
    ['dono', dono],
    ['consultor_mensagens.thread_id', conversa],
  ]);
  expect(query.ilike).toHaveBeenCalledWith('nome', '%20\\%\\_\\\\%');
  expect(query.range).toHaveBeenCalledWith(20, 39);
  expect(query.order.mock.calls).toEqual([
    ['criado_em', { ascending: false }],
    ['id', { ascending: true }],
  ]);
  expect(query.select.mock.calls[0]?.[0]).not.toMatch(/caminho_storage|transcricao|conteudo/);
});
it('lista vazia e falha são estados distintos', async () => {
  query.range.mockResolvedValue({ data: [], count: 0, error: null });
  expect(await obterArquivosConversa(conversa, dono)).toEqual({
    arquivos: [],
    total: 0,
    mais: false,
  });
  query.range.mockResolvedValue({ data: null, error: { message: 'SEGREDO' } });
  await expect(obterArquivosConversa(conversa, dono)).rejects.toThrow(
    'Falha ao consultar arquivos',
  );
});
