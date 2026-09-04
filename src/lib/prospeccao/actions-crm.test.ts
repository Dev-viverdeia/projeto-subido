import { beforeEach, describe, expect, it, vi } from 'vitest';
const { enviarLeadProspeccaoAoCrm, redirect } = vi.hoisted(() => ({
  enviarLeadProspeccaoAoCrm: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/operacoes/admin', () => ({ enfileirarOperacao: vi.fn() }));
vi.mock('@/lib/operacoes/processar', () => ({ processarOperacaoPorId: vi.fn() }));
vi.mock('@/lib/planos/server', () => ({ exigirRecurso: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usuario' } } }) },
  }),
}));
vi.mock('./admin', () => ({
  enviarLeadProspeccaoAoCrm,
  registrarContatoProspeccao: vi.fn(),
  reservarListaProspeccao: vi.fn(),
}));
import { enviarLeadAoCrm } from './actions';

const id = '11111111-1111-4111-8111-111111111111';
const lista = '22222222-2222-4222-8222-222222222222';
describe('da prospecção à ficha', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirect.mockImplementation((destino) => {
      throw new Error(`redirect:${destino}`);
    });
  });
  it('abre a ficha criada com a origem preservada', async () => {
    enviarLeadProspeccaoAoCrm.mockResolvedValue({ data: id, error: null });
    const dados = new FormData();
    dados.set('lead', id);
    await expect(enviarLeadAoCrm(dados)).rejects.toThrow(
      `redirect:/vendas/${id}?novo=1&origem=prospeccao`,
    );
  });
  it('retorna à mesma lista após uma falha', async () => {
    enviarLeadProspeccaoAoCrm.mockResolvedValue({ data: null, error: { code: 'XX000' } });
    const dados = new FormData();
    dados.set('lead', id);
    dados.set('lista', lista);
    await expect(enviarLeadAoCrm(dados)).rejects.toThrow(
      `redirect:/prospeccao?crm=erro&lista=${lista}`,
    );
  });
  it('não propaga lista inválida no retorno', async () => {
    enviarLeadProspeccaoAoCrm.mockResolvedValue({ data: null, error: { code: 'XX000' } });
    const dados = new FormData();
    dados.set('lead', id);
    dados.set('lista', '//externo.com');
    await expect(enviarLeadAoCrm(dados)).rejects.toThrow('redirect:/prospeccao?crm=erro');
  });
});
