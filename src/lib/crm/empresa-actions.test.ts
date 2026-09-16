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
import { salvarEmpresaFicha } from './empresa-actions';
import { dominioEmpresa, pesquisaAnteriorAoCadastro } from './empresa-schema';

const entrada = {
  oportunidade: '11111111-1111-4111-8111-111111111111',
  empresaId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  revisao: 2,
  nome: ' Empresa ',
  site: 'https://www.empresa.com.br/contato?ref=abc',
};
beforeEach(() => {
  vi.clearAllMocks();
  acesso.mockResolvedValue({ permitido: true });
  rpc.mockResolvedValue({ error: null });
});
describe('editar empresa', () => {
  it('normaliza o site e envia só campos permitidos', async () => {
    expect(await salvarEmpresaFicha(entrada)).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('crm_editar_empresa', {
      p_oportunidade: entrada.oportunidade,
      p_empresa: entrada.empresaId,
      p_revisao: 2,
      p_nome: 'Empresa',
      p_dominio: 'empresa.com.br',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/vendas', 'layout');
  });
  it.each(['sessao', 'plano'])('exige acesso atual: %s', async (motivo) => {
    acesso.mockResolvedValue({ permitido: false, motivo });
    expect((await salvarEmpresaFicha(entrada)).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([
    { nome: '' },
    { nome: 'A\nB' },
    { nome: 'x'.repeat(161) },
    { revisao: -1 },
    { empresaId: 'id' },
    { site: 'javascript:alert(1)' },
  ])('rejeita entrada inválida %j', async (alteracao) => {
    expect((await salvarEmpresaFicha({ ...entrada, ...alteracao })).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('aceita remover site e não dispara enriquecimento', async () => {
    expect(await salvarEmpresaFicha({ ...entrada, site: '' })).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledExactlyOnceWith(
      'crm_editar_empresa',
      expect.objectContaining({ p_dominio: '' }),
    );
  });
  it('mostra conflito sem expor erro interno', async () => {
    rpc.mockResolvedValue({ error: { code: '40001', message: 'privado' } });
    expect(await salvarEmpresaFicha(entrada)).toMatchObject({ ok: false, conflito: true });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it('não confirma gravação falha', async () => {
    rpc.mockResolvedValue({ error: { code: 'P0002', message: 'privado' } });
    expect(await salvarEmpresaFicha(entrada)).toEqual({
      ok: false,
      erro: 'Não foi possível salvar.',
    });
  });
  it.each([
    'localhost',
    '127.0.0.1',
    'http://2130706433',
    'http://[::1]',
    'empresa.local',
    'a.internal',
    'user:senha@empresa.com.br',
    'https://user:senha@empresa.com.br',
    'https://empresa.com.br:8080',
    '//empresa.com.br',
    'empresa.com.br\\@outro.com',
    'empresa.com.br\n',
    'https://empresa.com.br./',
    'https://-erro.com',
    'https://erro..com',
  ])('não aceita host impróprio: %s', (site) => {
    // Espaço no fim é tolerado; quebras dentro do endereço não são.
    if (site === 'empresa.com.br\n') expect(dominioEmpresa('empresa.\ncom.br')).toBeNull();
    else expect(dominioEmpresa(site)).toBeNull();
  });
  it.each([
    ['empresa.com.br', 'empresa.com.br'],
    ['HTTP://WWW.EMPRESA.COM.BR/a', 'empresa.com.br'],
    ['', ''],
  ])('normaliza %s', (valor, esperado) => expect(dominioEmpresa(valor)).toBe(esperado));
  it('sinaliza pesquisa anterior, inclusive concluída depois da edição', () => {
    expect(pesquisaAnteriorAoCadastro('2026-09-15T12:00:00Z', '2026-09-15T11:00:00Z')).toBe(true);
    expect(pesquisaAnteriorAoCadastro('2026-09-15T12:00:00Z', '2026-09-15T13:00:00Z')).toBe(false);
    expect(pesquisaAnteriorAoCadastro(null, '2026-09-15T11:00:00Z')).toBe(false);
  });
});
