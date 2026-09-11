import { beforeEach, describe, expect, it, vi } from 'vitest';
const { rpc, getUser, revalidatePath } = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/consultor/revalidacao', () => ({ revalidarDirecaoOperacional: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ rpc, auth: { getUser } }),
}));
import { gerenciarEntrega, agendarAcompanhamento } from './gestao-actions';
const id = '11111111-1111-4111-8111-111111111111';
const atualizado = '2026-09-08T12:00:00+00:00';
function form(acao = 'concluir') {
  const f = new FormData();
  f.set('projeto', id);
  f.set('acao', acao);
  f.set('atualizadoEm', atualizado);
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: 'dono' } } });
  rpc.mockResolvedValue({ data: true, error: null });
});
describe('gestão autorizada', () => {
  it('envia identidade, versão e confirmação explícita à operação atômica', async () => {
    const f = form();
    f.set('confirmarPendencias', 'sim');
    expect((await gerenciarEntrega({}, f)).sucesso).toBe('Entrega concluída.');
    expect(rpc).toHaveBeenCalledWith('projeto_gerenciar_entrega', {
      p_projeto_id: id,
      p_acao: 'concluir',
      p_atualizado_em: atualizado,
      p_confirmar_pendencias: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/entregas');
    expect(revalidatePath).toHaveBeenCalledWith('/crm');
    expect(revalidatePath).toHaveBeenCalledWith('/crm/[id]', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/portal/[codigo]', 'page');
  });
  it('não presume ciência das pendências', async () => {
    await gerenciarEntrega({}, form());
    expect(rpc).toHaveBeenCalledWith(
      'projeto_gerenciar_entrega',
      expect.objectContaining({ p_confirmar_pendencias: false }),
    );
  });
  it('não permite operação sem sessão', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const resultado = await gerenciarEntrega({}, form());
    expect(resultado.erro).toContain('sessão expirou');
    expect(resultado.recuperacao).toBe('entrar');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('valida entradas antes de acessar o banco', async () => {
    expect((await gerenciarEntrega({}, form('apagar'))).erro).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each(['40001', 'P0002'])('não confirma conflito ou outra conta (%s)', async (code) => {
    rpc.mockResolvedValue({ data: null, error: { code, message: 'private database detail' } });
    const r = await gerenciarEntrega({}, form());
    expect(r.erro).toBeTruthy();
    expect(r.sucesso).toBeUndefined();
    expect(r.erro).not.toContain('private');
    expect(r.recuperacao).toBe(code === '40001' ? 'atualizar' : undefined);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it('recupera falha de conexão sem derrubar a tela', async () => {
    rpc.mockRejectedValue(new Error('network secret'));
    const resultado = await gerenciarEntrega({}, form());
    expect(resultado.erro).toContain('conexão falhou');
    expect(resultado.recuperacao).toBe('atualizar');
  });
  it('agenda compromisso com identificador estável, sem convite externo', async () => {
    const f = new FormData();
    f.set('projeto', id);
    f.set('acao', id);
    f.set('titulo', 'Revisar indicadores');
    f.set('prazo', '2026-09-20');
    expect((await agendarAcompanhamento({}, f)).sucesso).toBe('Próxima ação agendada.');
    expect(rpc).toHaveBeenCalledWith('projeto_agendar_acompanhamento', {
      p_projeto_id: id,
      p_acao_id: id,
      p_titulo: 'Revisar indicadores',
      p_prazo: '2026-09-20',
    });
    f.set('prazo', '2026-02-31');
    expect((await agendarAcompanhamento({}, f)).erro).toBeTruthy();
  });
});
