import { beforeEach, describe, expect, it, vi } from 'vitest';
const { acesso, rpc, revalidatePath } = vi.hoisted(() => ({
  acesso: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/planos/server', () => ({ obterAcessoRecurso: acesso }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({ rpc }) }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/errors', () => ({ handleError: () => new Error('Não foi possível salvar.') }));
import { salvarContatoFicha } from './contato-actions';
import { contatoFichaSchema } from './contato-schema';

const entrada = {
  oportunidade: '11111111-1111-4111-8111-111111111111',
  contatoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  revisao: 2,
  nome: ' Ana ',
  telefone: '(48) 99999-0000',
  email: ' ANA@EXEMPLO.COM ',
};
beforeEach(() => {
  vi.clearAllMocks();
  acesso.mockResolvedValue({ permitido: true, plano: 'pro' });
  rpc.mockResolvedValue({ data: true, error: null });
});
describe('edição de contato', () => {
  it('envia só os campos permitidos e atualiza as fichas', async () => {
    expect(await salvarContatoFicha(entrada)).toEqual({ ok: true });
    expect(acesso).toHaveBeenCalledWith('vendas');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('crm_editar_contato', {
      p_oportunidade: entrada.oportunidade,
      p_contato: entrada.contatoId,
      p_revisao: 2,
      p_nome: 'Ana',
      p_telefone: '(48) 99999-0000',
      p_email: 'ana@exemplo.com',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/vendas', 'layout');
  });
  it.each(['sessao', 'plano'])('não grava sem acesso: %s', async (motivo) => {
    acesso.mockResolvedValue({ permitido: false, motivo });
    expect((await salvarContatoFicha(entrada)).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([
    { email: 'invalido' },
    { telefone: 'javascript:alert(1)' },
    { telefone: '123' },
    { nome: 'Nome\nInjetado' },
    { nome: 'x'.repeat(161) },
    { revisao: -1 },
    { contatoId: null },
    { oportunidade: 'nao-e-id' },
  ])('rejeita entradas inválidas: %j', async (alteracao) => {
    expect((await salvarContatoFicha({ ...entrada, ...alteracao })).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('aceita criar só com canal e limpar campos existentes', async () => {
    expect(
      contatoFichaSchema.safeParse({
        ...entrada,
        nome: '',
        email: '',
        contatoId: null,
        revisao: null,
      }).success,
    ).toBe(true);
    expect(
      contatoFichaSchema.safeParse({ ...entrada, nome: '', email: '', telefone: '' }).success,
    ).toBe(true);
    expect(
      contatoFichaSchema.safeParse({
        ...entrada,
        nome: '',
        email: '',
        telefone: '',
        contatoId: null,
        revisao: null,
      }).success,
    ).toBe(false);
    await salvarContatoFicha({ ...entrada, contatoId: null, revisao: null });
    expect(rpc).toHaveBeenCalledWith(
      'crm_editar_contato',
      expect.objectContaining({ p_contato: undefined, p_revisao: undefined }),
    );
  });
  it('recusa revisão antiga sem apagar campos ou expor erro interno', async () => {
    rpc.mockResolvedValue({ error: { code: '40001', message: 'segredo-interno' } });
    expect(await salvarContatoFicha(entrada)).toMatchObject({ ok: false, conflito: true });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it('traduz falha do banco e não confirma sucesso', async () => {
    rpc.mockResolvedValue({ error: { code: 'P0002', message: 'segredo-interno' } });
    expect(await salvarContatoFicha(entrada)).toEqual({
      ok: false,
      erro: 'Não foi possível salvar.',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
