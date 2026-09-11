import { beforeEach, describe, expect, it, vi } from 'vitest';

const { arquivo, projeto, assinar, admin } = vi.hoisted(() => {
  const consulta = () => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  });
  const arquivo = consulta();
  const projeto = consulta();
  const assinar = vi.fn();
  const admin = {
    from: vi.fn((tabela: string) => (tabela === 'projeto_arquivos' ? arquivo : projeto)),
    storage: { from: vi.fn(() => ({ createSignedUrl: assinar })) },
  };
  return { arquivo, projeto, assinar, admin };
});
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => admin }));
import { GET } from './route';

const codigo = '44444444-4444-4444-8444-444444444444';
const arquivoId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const abrir = () =>
  GET(new Request('https://subido.viverdeia.ai'), {
    params: Promise.resolve({ codigo, arquivo: arquivoId }),
  });

describe('download do portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    arquivo.maybeSingle.mockResolvedValue({
      data: {
        dono: 'dono',
        projeto_execucao_id: 'projeto-1',
        caminho_storage: 'dono/projeto-1/arquivo.txt',
        nome_original: 'arquivo.txt',
      },
      error: null,
    });
    projeto.maybeSingle.mockResolvedValue({ data: { id: 'projeto-1' }, error: null });
    assinar.mockResolvedValue({
      data: { signedUrl: 'https://example.com/download-temporario' },
      error: null,
    });
  });
  it('exige publicação, visibilidade e código ativo do mesmo projeto antes de assinar', async () => {
    const resposta = await abrir();
    expect(arquivo.eq).toHaveBeenCalledWith('visivel_cliente', true);
    expect(arquivo.not).toHaveBeenCalledWith('publicado_em', 'is', null);
    expect(projeto.eq).toHaveBeenCalledWith('id', 'projeto-1');
    expect(projeto.eq).toHaveBeenCalledWith('portal_codigo', codigo);
    expect(projeto.eq).toHaveBeenCalledWith('portal_ativo', true);
    expect(projeto.eq).toHaveBeenCalledWith('dono', 'dono');
    expect(assinar).toHaveBeenCalledWith('dono/projeto-1/arquivo.txt', 60, {
      download: 'arquivo.txt',
    });
    expect(resposta.status).toBe(307);
    expect(resposta.headers.get('Cache-Control')).toBe('private, no-store');
  });
  it('não assina arquivo privado ou ainda não publicado', async () => {
    arquivo.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await abrir()).status).toBe(404);
    expect(assinar).not.toHaveBeenCalled();
    expect(projeto.maybeSingle).not.toHaveBeenCalled();
  });
  it('não assina quando o código não pertence ao projeto ou o portal foi pausado', async () => {
    projeto.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await abrir()).status).toBe(404);
    expect(assinar).not.toHaveBeenCalled();
  });
  it('não redireciona quando o storage falha', async () => {
    assinar.mockResolvedValue({ data: null, error: { message: 'unavailable' } });
    expect((await abrir()).status).toBe(503);
  });
  it.each(['../../vitima/projeto/segredo.pdf', '%2e%2e', 'a\\b', '/arquivo.txt'])(
    'não assina registro legado com caminho inseguro %s',
    async (nome) => {
      arquivo.maybeSingle.mockResolvedValue({
        data: {
          dono: 'dono',
          projeto_execucao_id: 'projeto-1',
          caminho_storage: `dono/projeto-1/${nome}`,
          nome_original: 'arquivo.txt',
        },
        error: null,
      });
      expect((await abrir()).status).toBe(404);
      expect(assinar).not.toHaveBeenCalled();
    },
  );
});
