// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const deps = vi.hoisted(() => ({
  user: vi.fn(),
  registro: vi.fn(),
  eq: vi.fn(),
  assinar: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: deps.user },
      from: () => ({ select: () => ({ eq: deps.eq }) }),
      storage: { from: () => ({ createSignedUrl: deps.assinar }) },
    }),
}));
import { GET } from './route';
const id = '33333333-3333-4333-8333-333333333333';
const dono = '11111111-1111-4111-8111-111111111111';
const caminho = `${dono}/22222222-2222-4222-8222-222222222222/${id}-arquivo.png`;
const pedir = (anexo = id) =>
  GET(new Request('https://example.test/anexo'), { params: Promise.resolve({ anexo }) });
beforeEach(() => {
  vi.clearAllMocks();
  deps.user.mockResolvedValue({ data: { user: { id: dono } } });
  deps.eq.mockReturnValue({ eq: deps.eq, maybeSingle: deps.registro });
  deps.registro.mockResolvedValue({
    data: {
      caminho_storage: caminho,
      categoria: 'imagem',
      tipo_mime: 'image/png',
      nome: 'arquivo.png',
      consultor_mensagens: { thread_id: '22222222-2222-4222-8222-222222222222' },
    },
    error: null,
  });
  deps.assinar.mockResolvedValue({
    data: { signedUrl: 'https://storage.example.test/privado' },
    error: null,
  });
});
it('abre imagem da própria conta com URL curta e sem cache público', async () => {
  const resposta = await pedir();
  expect(resposta.status).toBe(307);
  expect(resposta.headers.get('cache-control')).toBe('private, no-store');
  expect(deps.eq).toHaveBeenCalledWith('dono', dono);
  expect(deps.assinar).toHaveBeenCalledWith(caminho, 90, { download: false });
});
it('força o download de documentos sem renderizar seu conteúdo na plataforma', async () => {
  deps.registro.mockResolvedValue({
    data: {
      caminho_storage: caminho,
      categoria: 'documento',
      tipo_mime: 'application/pdf',
      nome: 'escopo.pdf',
      consultor_mensagens: { thread_id: '22222222-2222-4222-8222-222222222222' },
    },
    error: null,
  });
  expect((await pedir()).status).toBe(307);
  expect(deps.assinar).toHaveBeenCalledWith(caminho, 90, { download: 'escopo.pdf' });
});
it('baixa uma imagem com nome original apenas depois de validar a conta', async () => {
  const resposta = await GET(new Request('https://example.test/anexo?download=1'), {
    params: Promise.resolve({ anexo: id }),
  });
  expect(resposta.status).toBe(307);
  expect(resposta.headers.get('cache-control')).toBe('private, no-store');
  expect(deps.eq).toHaveBeenCalledWith('dono', dono);
  expect(deps.assinar).toHaveBeenCalledWith(caminho, 90, { download: 'arquivo.png' });
});
it('não emite URL para uma conta sem sessão', async () => {
  deps.user.mockResolvedValue({ data: { user: null } });
  expect((await pedir()).status).toBe(401);
  expect(deps.registro).not.toHaveBeenCalled();
  expect(deps.assinar).not.toHaveBeenCalled();
});
it('preserva acentos e percentuais no nome sem alterar o token assinado', async () => {
  deps.registro.mockResolvedValue({
    data: {
      caminho_storage: caminho,
      categoria: 'documento',
      tipo_mime: 'application/pdf',
      nome: 'Revisão 20%_final.pdf',
      consultor_mensagens: { thread_id: '22222222-2222-4222-8222-222222222222' },
    },
    error: null,
  });
  deps.assinar.mockResolvedValue({
    data: {
      signedUrl:
        'https://storage.example.test/privado?token=assinatura-original&download=Revis%25C3%25A3o+20%2525_final.pdf',
    },
    error: null,
  });
  const resposta = await pedir();
  const destino = new URL(resposta.headers.get('location')!);
  expect(destino.searchParams.get('download')).toBe('Revisão 20%_final.pdf');
  expect(destino.searchParams.get('token')).toBe('assinatura-original');
});
it('não emite URL quando o registro é de outra conta ou não existe', async () => {
  deps.registro.mockResolvedValue({ data: null, error: null });
  expect((await pedir()).status).toBe(404);
  expect(deps.eq).toHaveBeenCalledWith('dono', dono);
  expect(deps.assinar).not.toHaveBeenCalled();
});
it('recusa um caminho fora da conta mesmo em registro legado', async () => {
  deps.registro.mockResolvedValue({
    data: {
      caminho_storage: caminho.replace(dono, 'outra-conta'),
      categoria: 'audio',
      tipo_mime: 'audio/webm',
      nome: 'fala.webm',
    },
    error: null,
  });
  expect((await pedir()).status).toBe(404);
  expect(deps.assinar).not.toHaveBeenCalled();
});
it('mantém a abertura de anexos antigos cujo UUID do arquivo difere do registro', async () => {
  const legado = caminho.replace(id, '44444444-4444-4444-8444-444444444444');
  deps.registro.mockResolvedValue({
    data: {
      caminho_storage: legado,
      categoria: 'audio',
      tipo_mime: 'audio/webm',
      nome: 'fala.webm',
      consultor_mensagens: { thread_id: '22222222-2222-4222-8222-222222222222' },
    },
    error: null,
  });
  expect((await pedir()).status).toBe(307);
  expect(deps.assinar).toHaveBeenCalledWith(legado, 90, { download: false });
});
it('recusa um arquivo de outra conversa mesmo dentro da pasta da conta', async () => {
  deps.registro.mockResolvedValue({
    data: {
      caminho_storage: caminho,
      categoria: 'imagem',
      tipo_mime: 'image/png',
      nome: 'arquivo.png',
      consultor_mensagens: { thread_id: '44444444-4444-4444-8444-444444444444' },
    },
    error: null,
  });
  expect((await pedir()).status).toBe(404);
  expect(deps.assinar).not.toHaveBeenCalled();
});
