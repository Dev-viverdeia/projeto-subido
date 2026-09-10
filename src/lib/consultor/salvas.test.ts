import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const { create, from, claims } = vi.hoisted(() => ({
  create: vi.fn(),
  from: vi.fn(),
  claims: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: create }));
import { revalidatePath } from 'next/cache';
import { salvarResposta } from './salvar-resposta';
import { buscarRespostasSalvas } from './salvas-queries';
import { BuscarSalvasSchema, SalvarRespostaSchema } from './salvas-contrato';
const dono = '11111111-1111-4111-8111-111111111111';
const mensagem = '33333333-3333-4333-8333-333333333333';
const entrada = { dono, mensagem, salvar: true };
const metodos = [
  'select',
  'eq',
  'order',
  'ilike',
  'range',
  'maybeSingle',
  'upsert',
  'delete',
] as const;
let query: Record<(typeof metodos)[number], ReturnType<typeof vi.fn>>;
beforeEach(() => {
  vi.clearAllMocks();
  query = Object.fromEntries(metodos.map((k) => [k, vi.fn()])) as typeof query;
  Object.values(query).forEach((fn) => fn.mockReturnValue(query));
  query.maybeSingle.mockResolvedValue({ data: { id: mensagem, thread_id: 'thread' }, error: null });
  query.upsert.mockResolvedValue({ error: null });
  claims.mockResolvedValue({ data: { claims: { sub: dono } } });
  from.mockReturnValue(query);
  create.mockResolvedValue({ auth: { getClaims: claims }, from });
});
it('valida referências, estado explícito e página limitada antes de consultar', async () => {
  expect(BuscarSalvasSchema.parse({ dono })).toEqual({ dono, busca: '', pagina: 0 });
  for (const invalido of [{ dono: '' }, { mensagem: 'outra' }, { salvar: 'true' }]) {
    expect(SalvarRespostaSchema.safeParse({ ...entrada, ...invalido }).success).toBe(false);
    expect(await salvarResposta({ ...entrada, ...invalido })).toHaveProperty('erro');
  }
  expect(create).not.toHaveBeenCalled();
  for (const invalido of [
    { busca: 'x'.repeat(121) },
    { pagina: -1 },
    { pagina: 1.5 },
    { pagina: 10001 },
  ])
    expect(BuscarSalvasSchema.safeParse({ dono, ...invalido }).success).toBe(false);
});
it('não lê nem grava sem sessão ou quando a conta mudou', async () => {
  expect(await salvarResposta({ ...entrada, dono: mensagem })).toHaveProperty('erro');
  expect(await buscarRespostasSalvas(mensagem)).toBeNull();
  claims.mockResolvedValue({ data: null });
  expect(await salvarResposta(entrada)).toHaveProperty('erro');
  expect(await buscarRespostasSalvas(dono)).toBeNull();
  expect(from).not.toHaveBeenCalled();
});
it('confere papel e dono da mensagem antes de salvar; repetir não cria duplicata ou altera data', async () => {
  expect(await salvarResposta(entrada)).toEqual({ salva: true });
  expect(await salvarResposta(entrada)).toEqual({ salva: true });
  expect(query.eq.mock.calls.slice(0, 3)).toEqual([
    ['id', mensagem],
    ['papel', 'consultor'],
    ['consultor_threads.dono', dono],
  ]);
  expect(query.upsert).toHaveBeenCalledTimes(2);
  expect(query.upsert).toHaveBeenCalledWith(
    { dono, mensagem_id: mensagem },
    { onConflict: 'dono,mensagem_id', ignoreDuplicates: true },
  );
  expect(revalidatePath).toHaveBeenCalledWith('/consultor', 'layout');
});
it('não permite marcar mensagem inexistente, alheia ou do usuário', async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect(await salvarResposta(entrada)).toHaveProperty('erro');
  expect(query.upsert).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});
it('remove somente o marcador do dono, mesmo quando já foi removido', async () => {
  expect(await salvarResposta({ ...entrada, salvar: false })).toEqual({ salva: false });
  expect(from.mock.calls).toEqual([['consultor_mensagens'], ['consultor_respostas_salvas']]);
  expect(query.delete).toHaveBeenCalledOnce();
  expect(query.eq.mock.calls.slice(-2)).toEqual([
    ['dono', dono],
    ['mensagem_id', mensagem],
  ]);
});
it('erro ou resultado incerto não confirma nem expõe detalhes do banco', async () => {
  query.upsert.mockResolvedValue({ error: { message: 'SEGREDO' } });
  expect(await salvarResposta(entrada)).toEqual({
    erro: 'Não foi possível atualizar. Tente novamente.',
  });
  create.mockRejectedValueOnce(new Error('SEGREDO'));
  expect(JSON.stringify(await salvarResposta(entrada))).not.toContain('SEGREDO');
  expect(revalidatePath).not.toHaveBeenCalled();
});
it('busca apenas as salvas do dono, com paginação estável e texto literal', async () => {
  query.range.mockResolvedValue({
    data: [
      {
        mensagem_id: mensagem,
        criado_em: 'agora',
        consultor_mensagens: {
          thread_id: 'thread',
          conteudo: 'Antes '.repeat(100) + '20%_\\ escopo',
          consultor_threads: { titulo: 'Entrega', dono },
          modelo: 'SEGREDO',
        },
      },
    ],
    count: 41,
    error: null,
  });
  const res = await buscarRespostasSalvas(dono, '20%_\\', 1);
  expect(res).toMatchObject({
    total: 41,
    mais: true,
    respostas: [{ id: mensagem, conversa: 'thread', titulo: 'Entrega', salvaEm: 'agora' }],
  });
  expect(res?.respostas[0]?.trecho).toContain('20%_\\');
  expect(res?.respostas[0]?.trecho.length).toBeLessThan(250);
  expect(query.ilike).toHaveBeenCalledWith('consultor_mensagens.conteudo', '%20\\%\\_\\\\%');
  expect(query.range).toHaveBeenCalledWith(20, 39);
  expect(query.eq.mock.calls).toEqual([
    ['dono', dono],
    ['consultor_mensagens.papel', 'consultor'],
    ['consultor_mensagens.consultor_threads.dono', dono],
  ]);
  expect(query.order.mock.calls).toEqual([
    ['criado_em', { ascending: false }],
    ['mensagem_id', { ascending: true }],
  ]);
  expect(JSON.stringify(res)).not.toMatch(/SEGREDO|conteudo|modelo/);
});
it('distingue lista vazia de falha', async () => {
  query.range.mockResolvedValue({ data: [], count: 0, error: null });
  expect(await buscarRespostasSalvas(dono)).toEqual({ respostas: [], total: 0, mais: false });
  query.range.mockResolvedValue({ data: null, error: { message: 'SEGREDO' } });
  await expect(buscarRespostasSalvas(dono)).rejects.toThrow('Falha ao consultar respostas salvas');
});
