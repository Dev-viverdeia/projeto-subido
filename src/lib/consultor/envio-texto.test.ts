import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), from: vi.fn(), query: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getSession: mocks.session },
    rpc: mocks.rpc,
    from: mocks.from,
  }),
}));
import { novaTentativaTexto, registrarEnvio } from './registrar-envio';
const construtor = (final: () => unknown) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    abortSignal: vi.fn(() => builder),
    setHeader: vi.fn(() => builder),
    maybeSingle: vi.fn(final),
    then: (resolve: (r: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve().then(final).then(resolve, reject),
  };
  return builder;
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({
    data: { session: { user: { id: 'conta-a' }, access_token: 'jwt-teste' } },
  });
  mocks.rpc.mockImplementation((_nome: string, args: { p_mensagem: string }) =>
    construtor(() => ({ data: args.p_mensagem, error: null })),
  );
  mocks.query.mockResolvedValue({ data: null, error: null });
  mocks.from.mockImplementation(() => construtor(mocks.query));
});
describe('recibo do envio de texto', () => {
  it('cria IDs antes do POST e registra conversa + mensagem na mesma RPC', async () => {
    const tentativa = novaTentativaTexto(' Minha pergunta ');
    const resultado = await registrarEnvio(tentativa);
    expect(resultado).toEqual({
      threadId: tentativa.threadId,
      mensagemId: tentativa.mensagemId,
      falha: null,
    });
    expect(mocks.rpc).toHaveBeenCalledWith('sobral_confirmar_texto', {
      p_thread: tentativa.threadId,
      p_mensagem: tentativa.mensagemId,
      p_conteudo: 'Minha pergunta',
      p_nova: true,
    });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(
      (mocks.rpc.mock.results[0]!.value as ReturnType<typeof construtor>).setHeader,
    ).toHaveBeenCalledWith('Authorization', 'Bearer jwt-teste');
  });
  it('retoma com os mesmos IDs quando o ACK se perde', async () => {
    const tentativa = novaTentativaTexto('Minha pergunta', 'conversa-existente');
    mocks.rpc.mockImplementationOnce(() =>
      construtor(() => {
        throw new Error('rede');
      }),
    );
    expect(await registrarEnvio(tentativa)).toMatchObject({ pendente: true });
    expect(await registrarEnvio(tentativa)).toMatchObject({
      mensagemId: tentativa.mensagemId,
      falha: null,
    });
    expect(mocks.rpc.mock.calls[0]).toEqual(mocks.rpc.mock.calls[1]);
    expect((mocks.rpc.mock.calls[1]?.[1] as { p_nova: boolean }).p_nova).toBe(false);
  });
  it('conferir mensagem confirmada usa somente leitura', async () => {
    const tentativa = novaTentativaTexto('Minha pergunta');
    tentativa.solicitado = true;
    mocks.query.mockResolvedValue({
      data: {
        id: tentativa.mensagemId,
        thread_id: tentativa.threadId,
        papel: 'usuario',
        conteudo: 'Minha pergunta',
        consultor_anexos: [],
      },
      error: null,
    });
    expect(await registrarEnvio(tentativa, true)).toMatchObject({
      falha: null,
      mensagemId: tentativa.mensagemId,
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
    const query = mocks.from.mock.results[0]!.value as ReturnType<typeof construtor>;
    expect(query.eq).toHaveBeenCalledWith('id', tentativa.mensagemId);
    expect(query.eq).toHaveBeenCalledWith('thread_id', tentativa.threadId);
    expect(query.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer jwt-teste');
  });
  it('ausência confirmada permite retomar, sem POST automático', async () => {
    const tentativa = novaTentativaTexto('Minha pergunta');
    tentativa.solicitado = true;
    expect(await registrarEnvio(tentativa, true)).toMatchObject({ ausente: true, pendente: true });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(['rede', 'erro'])('consulta com %s não equivale a mensagem ausente', async (tipo) => {
    const tentativa = novaTentativaTexto('Pergunta');
    tentativa.solicitado = true;
    if (tipo === 'rede') mocks.query.mockRejectedValue(new Error('rede'));
    else mocks.query.mockResolvedValue({ data: null, error: { code: '503' } });
    const r = await registrarEnvio(tentativa, true);
    expect(r).toMatchObject({ pendente: true });
    expect(r).not.toHaveProperty('ausente');
  });
  it.each(['outro texto', 'anexo', 'consultor'])('não aceita recibo com %s', async (tipo) => {
    const tentativa = novaTentativaTexto('Pergunta');
    tentativa.solicitado = true;
    mocks.query.mockResolvedValue({
      data: {
        papel: tipo === 'consultor' ? 'consultor' : 'usuario',
        conteudo: tipo === 'outro texto' ? 'Outra pergunta' : 'Pergunta',
        consultor_anexos: tipo === 'anexo' ? [{ id: 'a' }] : [],
      },
      error: null,
    });
    expect(await registrarEnvio(tentativa, true)).toMatchObject({ threadId: null, pendente: true });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('ACK inválido mantém a tentativa incerta', async () => {
    mocks.rpc.mockImplementation(() => construtor(() => ({ data: 'id-errado', error: null })));
    expect(await registrarEnvio(novaTentativaTexto('Pergunta'))).toMatchObject({ pendente: true });
  });
  it('sessão ausente antes do POST devolve a pergunta à edição', async () => {
    mocks.session.mockResolvedValue({ data: { session: null } });
    expect(await registrarEnvio(novaTentativaTexto('Pergunta'))).toMatchObject({
      pendente: false,
      tipo: 'sessao',
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('troca de conta mantém o recibo e não envia para outra conta', async () => {
    const tentativa = novaTentativaTexto('Pergunta');
    mocks.rpc.mockImplementationOnce(() =>
      construtor(() => {
        throw new Error('rede');
      }),
    );
    await registrarEnvio(tentativa);
    mocks.session.mockResolvedValue({ data: { session: { user: { id: 'conta-b' } } } });
    expect(await registrarEnvio(tentativa)).toMatchObject({ pendente: true, tipo: 'sessao' });
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
  it.each(['', ' '.repeat(10), 'x'.repeat(8001)])(
    'valida o texto antes do servidor',
    async (texto) => {
      expect(await registrarEnvio(novaTentativaTexto(texto))).toMatchObject({
        pendente: false,
        threadId: null,
      });
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
});
