// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ enviar: vi.fn(), receber: vi.fn(), limpar: vi.fn() }));
vi.mock('@/lib/env', () => ({ cronEnv: () => ({ CRON_SECRET: 'cron-teste' }) }));
vi.mock('@/lib/suporte/notificacoes', () => ({ processarNotificacoesSuporte: mocks.enviar }));
vi.mock('@/lib/suporte/email-recebido', () => ({ processarEmailsSuporte: mocks.receber }));
vi.mock('@/lib/suporte/limpeza', () => ({ limparAnexosSuporte: mocks.limpar }));
vi.mock('@/lib/operacoes/pulso', () => ({
  observarSuporte: (_fase: string, executar: () => Promise<unknown>) => executar(),
}));
import { GET } from './route';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.enviar.mockResolvedValue({ enviadas: 1, falhas: 0 });
  mocks.receber.mockResolvedValue({ incorporados: 1, revisao: 0 });
  mocks.limpar.mockResolvedValue(0);
});
const pedido = () =>
  new Request('https://subido.example/api/suporte/processar', {
    headers: { authorization: 'Bearer cron-teste' },
  });
describe('recuperação independente das filas de suporte', () => {
  it('continua enviando respostas quando a entrada está indisponível', async () => {
    mocks.receber.mockRejectedValue(new Error('timeout de entrada'));
    const resposta = await GET(pedido());
    expect(mocks.enviar).toHaveBeenCalledOnce();
    expect(mocks.limpar).toHaveBeenCalledOnce();
    expect(resposta.status).toBe(503);
  });
  it('continua recebendo pedidos quando o envio está indisponível', async () => {
    mocks.enviar.mockRejectedValue(new Error('timeout de saída'));
    const resposta = await GET(pedido());
    expect(mocks.receber).toHaveBeenCalledOnce();
    expect(mocks.limpar).toHaveBeenCalledOnce();
    expect(resposta.status).toBe(503);
  });
  it('não faz trabalho sem a autenticação do cron', async () => {
    const resposta = await GET(new Request('https://subido.example/api/suporte/processar'));
    expect(resposta.status).toBe(401);
    expect(mocks.enviar).not.toHaveBeenCalled();
    expect(mocks.receber).not.toHaveBeenCalled();
  });
});
