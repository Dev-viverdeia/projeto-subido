import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/planos/server', () => ({ exigirRecurso: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/consultor/revalidacao', () => ({ revalidarDirecaoOperacional: vi.fn() }));
import { createClient } from '@/lib/supabase/server';
import { exigirRecurso } from '@/lib/planos/server';
import { revalidatePath } from 'next/cache';
import { salvarProposta, mudarStatusProposta } from './actions';
import { EDICAO_TESTE as base } from './edicao.fixture';

const consulta = () => {
  const q = { update: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
  q.update.mockReturnValue(q);
  q.select.mockReturnValue(q);
  q.eq.mockReturnValue(q);
  return q;
};
const escrever = consulta();
const ler = consulta();
const from = vi.fn();
const getUser = vi.fn();
const rpc = vi.fn();
function dados(versao: string | number | null = '2') {
  const f = new FormData();
  f.set('id', base.id);
  f.set('titulo', 'Minha edição local');
  f.set('documento', JSON.stringify(base.documento));
  if (versao !== null) f.set('versao', String(versao));
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: 'dono-teste' } } });
  escrever.maybeSingle.mockResolvedValue({
    data: { ...base, titulo: 'Minha edição local', versao: 3 },
    error: null,
  });
  ler.maybeSingle.mockResolvedValue({
    data: { ...base, titulo: 'Outra edição', versao: 3 },
    error: null,
  });
  from.mockReturnValueOnce(escrever).mockReturnValue(ler);
  vi.mocked(createClient).mockResolvedValue({ from, auth: { getUser }, rpc } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);
});

it('salva com comparação atômica de dono, ID e versão; retorna a revisão realmente persistida', async () => {
  const resultado = await salvarProposta({}, dados());
  expect(exigirRecurso).toHaveBeenCalledWith('propostas');
  expect(escrever.eq.mock.calls).toEqual([
    ['id', base.id],
    ['dono', 'dono-teste'],
    ['versao', 2],
  ]);
  expect(resultado.edicao?.versao).toBe(3);
  expect(resultado.edicao?.titulo).toBe('Minha edição local');
  expect(from).toHaveBeenCalledTimes(1);
});
it('não repete a escrita em conflito: devolve a versão atual para uma escolha explícita', async () => {
  escrever.maybeSingle.mockResolvedValue({ data: null, error: null });
  const resultado = await salvarProposta({}, dados());
  expect(resultado.conflito).toMatchObject({ titulo: 'Outra edição', versao: 3 });
  expect(ler.eq.mock.calls).toEqual([
    ['id', base.id],
    ['dono', 'dono-teste'],
  ]);
  expect(escrever.update).toHaveBeenCalledTimes(1);
  expect(ler.update).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});
it.each([null, '', '0', '-1', '2.5', 'abc'])(
  'recusa versão inválida/cliente antigo (%s) antes de escrever',
  async (versao) => {
    expect((await salvarProposta({}, dados(versao))).erro).toBeTruthy();
    expect(createClient).not.toHaveBeenCalled();
  },
);
it('não expõe dados quando a sessão perde acesso durante a disputa', async () => {
  escrever.maybeSingle.mockResolvedValue({ data: null, error: null });
  ler.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect(await salvarProposta({}, dados())).not.toHaveProperty('conflito');
  expect(revalidatePath).not.toHaveBeenCalled();
});
it('mantém erro de banco genérico e não inventa conflito', async () => {
  escrever.maybeSingle.mockResolvedValue({
    data: null,
    error: { message: 'segredo', code: 'XX000' },
  });
  const resultado = await salvarProposta({}, dados());
  expect(resultado.erro).not.toContain('segredo');
  expect(resultado.conflito).toBeUndefined();
  expect(from).toHaveBeenCalledTimes(1);
});
it('sem sessão não tenta gravar', async () => {
  getUser.mockResolvedValue({ data: { user: null } });
  expect((await salvarProposta({}, dados())).erro).toContain('sessão');
  expect(from).not.toHaveBeenCalled();
});
it('não aprova uma proposta cujo conteúdo mudou entre a leitura e o UPDATE', async () => {
  const atual = consulta();
  atual.maybeSingle.mockResolvedValue({ data: { status: 'apresentada', versao: 2 }, error: null });
  from.mockReset().mockReturnValueOnce(atual).mockReturnValueOnce(escrever).mockReturnValue(ler);
  escrever.maybeSingle.mockResolvedValue({ data: null, error: null });
  const f = dados();
  f.set('status', 'aceita');
  expect((await mudarStatusProposta({}, f)).conflito?.versao).toBe(3);
  expect(escrever.eq).toHaveBeenCalledWith('versao', 2);
  expect(rpc).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});
