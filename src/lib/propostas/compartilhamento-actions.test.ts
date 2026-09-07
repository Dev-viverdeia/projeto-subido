import { beforeEach, describe, expect, it, vi } from 'vitest';
const { exigir, client, revalidar } = vi.hoisted(() => ({
  exigir: vi.fn(),
  client: vi.fn(),
  revalidar: vi.fn(),
}));
vi.mock('@/lib/planos/server', () => ({ exigirRecurso: exigir }));
vi.mock('@/lib/supabase/server', () => ({ createClient: client }));
vi.mock('next/cache', () => ({ revalidatePath: revalidar }));
import { configurarLinkProposta } from './compartilhamento-actions';

const ID = '11111111-1111-4111-8111-111111111111';
const CODIGO = '22222222-2222-4222-8222-222222222222';
function form(operacao = 'desativar') {
  const form = new FormData();
  Object.entries({ id: ID, codigoAtual: CODIGO, operacao }).forEach(([k, v]) => form.set(k, v));
  return form;
}
function preparar(
  data: { id: string } | null = { id: ID },
  user: { id: string } | null = { id: 'dono-real' },
) {
  const query = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
  client.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(query),
  });
  return query;
}
beforeEach(() => vi.clearAllMocks());
describe('controle do link da proposta', () => {
  it('desativa só o compartilhamento, sem alterar venda, versão ou decisão', async () => {
    const query = preparar();
    const result = await configurarLinkProposta({}, form());
    expect(result.ativo).toBe(false);
    expect(exigir).toHaveBeenCalledWith('propostas');
    expect(query.update).toHaveBeenCalledWith({
      compartilhamento_ativo: false,
      compartilhamento_codigo: CODIGO,
    });
    expect(query.eq).toHaveBeenCalledWith('dono', 'dono-real');
    expect(query.eq).toHaveBeenCalledWith('compartilhamento_codigo', CODIGO);
  });
  it('gera outro código e invalida o endereço antigo', async () => {
    preparar();
    const result = await configurarLinkProposta({}, form('renovar'));
    expect(result.codigo).not.toBe(CODIGO);
    expect(result.ativo).toBe(true);
    expect(revalidar).toHaveBeenCalledWith(`/proposta/${CODIGO}`);
    expect(revalidar).toHaveBeenCalledWith(`/proposta/${result.codigo}`);
  });
  it('recusa outro dono, código antigo ou versão de aba desatualizada', async () => {
    preparar(null);
    expect((await configurarLinkProposta({}, form())).erro).toBeTruthy();
    expect(revalidar).not.toHaveBeenCalled();
  });
  it('recusa sessão ausente', async () => {
    const query = preparar(null, null);
    expect((await configurarLinkProposta({}, form())).erro).toMatch(/sessão/);
    expect(query.update).not.toHaveBeenCalled();
  });
});
