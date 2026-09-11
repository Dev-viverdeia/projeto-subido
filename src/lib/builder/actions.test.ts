import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/errors', () => ({ handleError: () => new Error('Falha ao salvar') }));
import { escolherStack, moverTarefa } from './actions';

const id = '11111111-1111-4111-8111-111111111111';
const chain = {
  upsert: mocks.upsert,
  update: mocks.update,
  eq: mocks.eq,
  select: mocks.select,
  maybeSingle: mocks.maybeSingle,
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.getUser }, from: mocks.from });
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'dono' } } });
  for (const metodo of [mocks.from, mocks.upsert, mocks.update, mocks.eq, mocks.select])
    metodo.mockReturnValue(chain);
  mocks.maybeSingle.mockResolvedValue({ data: { id, solucao_id: id }, error: null });
});
const form = () => {
  const dados = new FormData();
  dados.set('id', id);
  dados.set('indice', '2');
  dados.set('estado', 'feito');
  dados.set('stack', 'lovable_cloud');
  return dados;
};
describe.each([
  { nome: 'Tarefa', acao: moverTarefa },
  { nome: 'Ferramenta', acao: escolherStack },
])('$nome: resultado da gravação', ({ acao }) => {
  it('confirma somente quando a linha foi gravada e revalida o projeto', async () => {
    expect(await acao(form())).toEqual({ ok: true });
    expect(mocks.revalidate).toHaveBeenCalledWith('/builder/' + id);
  });
  it('não confirma update vazio nem revela outro projeto', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await acao(form())).toEqual({ ok: false });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('sessão expirada não chega ao banco', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect(await acao(form())).toEqual({ ok: false });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('entrada inválida não abre o cliente', async () => {
    const dados = form();
    dados.set('id', 'inválido');
    expect(await acao(dados)).toEqual({ ok: false });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('erro do banco não revalida nem retorna sucesso', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: '42501' } });
    await expect(acao(form())).rejects.toThrow('Falha ao salvar');
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
