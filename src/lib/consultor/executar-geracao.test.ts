// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types.generated';
import type { GeracaoSobral } from './geracao-contrato';

const mocks = vi.hoisted(() => ({ preparar: vi.fn(), finalizar: vi.fn(), produzir: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ criarAdminSobral: () => ({ rpc: mocks.finalizar }) }));
vi.mock('./processar-anexos', () => ({ prepararAnexosParaModelo: mocks.preparar }));
vi.mock('./conteudo', () => ({ resolverRecomendacoes: vi.fn() }));
vi.mock('./revalidacao', () => ({ revalidarDirecaoOperacional: vi.fn() }));
vi.mock('./servico', () => ({
  produzirLeituraSobral: mocks.produzir,
  direcaoDaMensagem: vi.fn(),
  persistirPlanoSobral: vi.fn(),
}));
import { executarGeracao } from './executar-geracao';

it('a geração entrega a sessão autenticada, nunca o cliente administrativo, ao leitor de anexos', async () => {
  const geracao: GeracaoSobral = {
    mensagem_id: '11111111-1111-4111-8111-111111111111',
    thread_id: '22222222-2222-4222-8222-222222222222',
    tentativa: '33333333-3333-4333-8333-333333333333',
    estado: 'gerando',
    texto: '',
    erro: null,
    resposta_id: null,
    parar_em: null,
    expira_em: '2026-12-10T10:00:00Z',
  };
  const cadeia = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: [
        {
          id: geracao.mensagem_id,
          papel: 'usuario',
          conteudo: 'Ouça',
          contexto_anexos: null,
          consultor_anexos: [
            {
              id: 'anexo',
              nome: 'audio',
              tipo_mime: 'audio/webm',
              categoria: 'audio',
              caminho_storage: 'privado',
              transcricao: null,
            },
          ],
        },
      ],
      error: null,
    }),
  };
  const supabase = { from: vi.fn(() => cadeia) } as unknown as SupabaseClient<Database>;
  mocks.preparar.mockRejectedValue(new Error('leitura negada no teste'));
  mocks.finalizar.mockResolvedValue({ data: { ...geracao, estado: 'falhou' }, error: null });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const controle = new AbortController();
  try {
    await executarGeracao({
      supabase,
      dono: 'dono-autenticado',
      geracao,
      controle,
      emitir: vi.fn(),
    });
    expect(mocks.preparar).toHaveBeenCalledWith(
      supabase,
      expect.any(Array),
      { dono: 'dono-autenticado', threadId: geracao.thread_id },
      controle.signal,
    );
    expect(mocks.produzir).not.toHaveBeenCalled();
    expect(mocks.finalizar).toHaveBeenCalledWith(
      'sobral_finalizar_geracao',
      expect.objectContaining({ p_estado: 'falhou' }),
    );
  } finally {
    log.mockRestore();
  }
});
