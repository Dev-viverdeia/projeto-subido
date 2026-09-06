import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getUser, maybeSingle, eq, rpc, revalidatePath } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser },
      rpc,
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })),
    }),
  ),
}));
import { salvarPlanoCall } from './plano-actions';

const REUNIAO = '11111111-1111-4111-8111-111111111111';
const OPORTUNIDADE = '22222222-2222-4222-8222-222222222222';
function formulario() {
  const dados = new FormData();
  for (const [chave, valor] of Object.entries({
    reuniao: REUNIAO,
    oportunidade: OPORTUNIDADE,
    acao: 'Enviar o escopo revisado',
    quando: '2026-12-10',
    etapa: 'proposta',
  }))
    dados.set(chave, valor);
  dados.append('compromissos', 'Cliente enviará a amostra');
  return dados;
}
beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: 'dono-1' } }, error: null });
  eq.mockReturnValue({ eq, maybeSingle });
  maybeSingle.mockResolvedValue({ data: { oportunidade_id: OPORTUNIDADE }, error: null });
  rpc.mockResolvedValue({ data: { aplicado: true }, error: null });
});

describe('salvarPlanoCall', () => {
  it('salva com a sessão atual e devolve confirmação sem redirecionar', async () => {
    expect(await salvarPlanoCall({}, formulario())).toEqual({
      sucesso: 'Plano salvo na ficha do cliente.',
    });
    expect(eq).toHaveBeenCalledWith('dono', 'dono-1');
    expect(rpc).toHaveBeenCalledWith('calls_aplicar_plano', {
      p_reuniao: REUNIAO,
      p_acao: 'Enviar o escopo revisado',
      p_quando: '2026-12-10T12:00:00-03:00',
      p_etapa: 'proposta',
      p_compromissos: ['Cliente enviará a amostra'],
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/crm/${OPORTUNIDADE}`);
    expect(revalidatePath).toHaveBeenCalledWith('/entregas');
  });
  it('não trata uma operação não aplicada como sucesso', async () => {
    rpc.mockResolvedValue({ data: { aplicado: false }, error: null });
    expect((await salvarPlanoCall({}, formulario())).erro).toContain(
      'Suas escolhas foram mantidas',
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it('explica a data inválida sem expor o erro do banco', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'data_invalida' } });
    expect((await salvarPlanoCall({}, formulario())).erro).toContain('Escolha uma data de hoje');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it('rejeita uma data inexistente antes de acessar o banco', async () => {
    const dados = formulario();
    dados.set('quando', '2026-02-31');
    expect((await salvarPlanoCall({}, dados)).erro).toBeTruthy();
    expect(getUser).not.toHaveBeenCalled();
  });
  it('preserva a revisão quando a sessão expira', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await salvarPlanoCall({}, formulario())).erro).toContain('outra aba');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('não empresta a reunião de outra oportunidade', async () => {
    maybeSingle.mockResolvedValue({ data: { oportunidade_id: 'outro-cliente' }, error: null });
    expect((await salvarPlanoCall({}, formulario())).erro).toContain('acessar esta reunião');
    expect(rpc).not.toHaveBeenCalled();
  });
});
