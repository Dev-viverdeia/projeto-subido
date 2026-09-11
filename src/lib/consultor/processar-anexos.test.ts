// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types.generated';

const mocks = vi.hoisted(() => ({
  criar: vi.fn(),
  transcrever: vi.fn(),
  apagar: vi.fn(),
  chave: vi.fn(),
  download: vi.fn(),
  reservar: vi.fn(),
  informar: vi.fn(),
}));
vi.mock('./orcamento', () => ({ comOrcamentoSobral: mocks.reservar }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ openAIEnv: mocks.chave }));
vi.mock('openai', () => ({
  default: class {
    static AuthenticationError = class extends Error {};
    static RateLimitError = class extends Error {};
    files = { create: mocks.criar, delete: mocks.apagar };
    audio = { transcriptions: { create: mocks.transcrever } };
  },
  toFile: vi.fn(() => Promise.resolve(new Blob(['teste']))),
}));
import { prepararAnexosParaModelo, type AnexoPersistidoSobral } from './processar-anexos';

const dono = '11111111-1111-4111-8111-111111111111';
const threadId = '22222222-2222-4222-8222-222222222222';
const id = '33333333-3333-4333-8333-333333333333';
const caminho = `${dono}/${threadId}/${id}-audio.webm`;
const contexto = { dono, threadId };
const storageFrom = vi.fn(() => ({ download: mocks.download }));
const cliente = { storage: { from: storageFrom } } as unknown as SupabaseClient<Database>;
const anexo: AnexoPersistidoSobral = {
  id,
  nome: 'áudio.webm',
  tipoMime: 'audio/webm',
  categoria: 'audio',
  caminhoStorage: caminho,
  transcricao: null,
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.chave.mockReturnValue({ OPENAI_API_KEY: 'qa-sem-rede' });
  mocks.download.mockResolvedValue({ data: new Blob(['áudio']), error: null });
  mocks.transcrever.mockResolvedValue({ text: 'Resumo da reunião' });
  mocks.criar.mockResolvedValue({ id: 'temporario' });
  mocks.apagar.mockResolvedValue({});
  mocks.reservar
    .mockReset()
    .mockImplementation(
      (_dono, _teto, gerar: (informar: (n: number) => void) => Promise<unknown>) =>
        gerar(mocks.informar),
    );
});

describe('fronteira dos anexos privados do Sobral', () => {
  it.each([
    caminho.replace(dono, '99999999-9999-4999-8999-999999999999'),
    caminho.replace(threadId, '99999999-9999-4999-8999-999999999999'),
    `${caminho}#outra-chave`,
    `${caminho}?download=1`,
    `${dono}/${threadId}/../arquivo`,
    `${dono}/${threadId}/%2e%2e/arquivo`,
    `${dono}/${threadId}/outro-id-audio.webm`,
    `${caminho}\\outro`,
    `/${caminho}`,
  ])('rejeita caminho não canônico antes de qualquer provedor: %s', async (caminhoStorage) => {
    await expect(
      prepararAnexosParaModelo(cliente, [{ ...anexo, caminhoStorage }], contexto),
    ).rejects.toThrow('Envie o arquivo novamente');
    expect(mocks.download).not.toHaveBeenCalled();
    expect(mocks.chave).not.toHaveBeenCalled();
  });
  it('não reaproveita transcrição de um registro antigo com caminho de outra conta', async () => {
    await expect(
      prepararAnexosParaModelo(
        cliente,
        [
          {
            ...anexo,
            caminhoStorage: `vitima/${threadId}/${id}-audio.webm`,
            transcricao: 'privado',
          },
        ],
        contexto,
      ),
    ).rejects.toThrow();
    expect(mocks.transcrever).not.toHaveBeenCalled();
  });
  it('usa o cliente recebido para baixar e transcrever o áudio da própria conversa', async () => {
    mocks.transcrever.mockResolvedValue({
      text: 'Resumo da reunião',
      usage: { type: 'tokens', total_tokens: 240 },
    });
    const preparado = await prepararAnexosParaModelo(cliente, [anexo], contexto);
    expect(storageFrom).toHaveBeenCalledWith('sobral-anexos');
    expect(mocks.download).toHaveBeenCalledWith(caminho);
    expect(preparado.transcricoes).toEqual([{ id, texto: 'Resumo da reunião' }]);
    expect(mocks.reservar.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.transcrever.mock.invocationCallOrder[0]!,
    );
    expect(mocks.informar).toHaveBeenCalledWith(240);
  });
  it('não transcreve áudio novo quando a reserva é recusada', async () => {
    mocks.reservar.mockRejectedValue(new Error('limite_sobral_mensal'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(prepararAnexosParaModelo(cliente, [anexo], contexto)).rejects.toThrow();
    expect(mocks.transcrever).not.toHaveBeenCalled();
    log.mockRestore();
  });
  it('não envia nada ao modelo quando o Storage nega a leitura', async () => {
    mocks.download.mockResolvedValue({ data: null, error: new Error('RLS denied') });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(prepararAnexosParaModelo(cliente, [anexo], contexto)).rejects.toThrow(
      'Não consegui analisar',
    );
    expect(mocks.transcrever).not.toHaveBeenCalled();
    expect(mocks.reservar).not.toHaveBeenCalled();
    expect(mocks.criar).not.toHaveBeenCalled();
    log.mockRestore();
  });
  it.each(['imagem', 'documento'] as const)(
    'preserva %s e remove o arquivo temporário',
    async (categoria) => {
      const preparado = await prepararAnexosParaModelo(
        cliente,
        [{ ...anexo, categoria }],
        contexto,
      );
      expect(preparado.entradas[0]?.fileId).toBe('temporario');
      await preparado.limpar();
      expect(mocks.apagar).toHaveBeenCalledWith('temporario');
    },
  );
  it('reaproveita o áudio já transcrito da própria conversa sem cobrar nova transcrição', async () => {
    const preparado = await prepararAnexosParaModelo(
      cliente,
      [{ ...anexo, transcricao: 'já processado' }],
      contexto,
    );
    expect(preparado.entradas[0]?.transcricao).toBe('já processado');
    expect(mocks.download).not.toHaveBeenCalled();
    expect(mocks.transcrever).not.toHaveBeenCalled();
  });
  it('não chama provedores em mensagens sem anexos', async () => {
    expect((await prepararAnexosParaModelo(cliente, [], contexto)).entradas).toEqual([]);
    expect(mocks.chave).not.toHaveBeenCalled();
  });
});
