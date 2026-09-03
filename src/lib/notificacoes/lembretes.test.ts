import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConteudoEmailEntrega } from './entrega-email';

vi.mock('server-only', () => ({}));

type EnvioTeste = {
  eventoId: string;
  destinatario: string;
  conteudo: ConteudoEmailEntrega;
};
type ResultadoEnvioTeste = {
  status: 'enviada' | 'ja_enviada' | 'falhou';
  destinatario: string | null;
};

const { rpc, enviarNotificacaoEntrega } = vi.hoisted(() => ({
  rpc: vi.fn(),
  enviarNotificacaoEntrega: vi.fn<(entrada: EnvioTeste) => Promise<ResultadoEnvioTeste>>(),
}));

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock('@/lib/notificacoes/entrega', () => ({ enviarNotificacaoEntrega }));

import { processarLembretesValidacao } from './lembretes';

describe('lembretes de validação', () => {
  beforeEach(() => {
    rpc.mockReset();
    enviarNotificacaoEntrega.mockReset();
  });

  it('envia o lote reservado pelo banco para o portal correto', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          evento_id: '11111111-1111-4111-8111-111111111111',
          destinatario: 'cliente@empresa.com.br',
          empresa: 'Clínica Aurora',
          projeto: 'SDR com IA',
          tarefa: 'Validar atendimento',
          portal_codigo: '22222222-2222-4222-8222-222222222222',
        },
      ],
      error: null,
    });
    enviarNotificacaoEntrega.mockResolvedValue({
      status: 'enviada',
      destinatario: 'cliente@empresa.com.br',
    });

    await expect(processarLembretesValidacao(12)).resolves.toEqual({
      reservados: 1,
      enviados: 1,
      falharam: 0,
    });
    expect(rpc).toHaveBeenCalledWith('projeto_sistema_reservar_lembretes_aprovacao', {
      p_limite: 12,
    });
    const envio = enviarNotificacaoEntrega.mock.calls[0]?.[0];
    expect(envio?.eventoId).toBe('11111111-1111-4111-8111-111111111111');
    expect(envio?.destinatario).toBe('cliente@empresa.com.br');
    expect(envio?.conteudo.assunto).toContain('ainda espera sua validação');
    expect(envio?.conteudo.texto).toContain('/portal/22222222-2222-4222-8222-222222222222');
  });

  it('isola a falha de um e-mail e termina o lote', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          evento_id: '1',
          destinatario: 'um@empresa.com.br',
          empresa: 'Empresa 1',
          projeto: 'Projeto 1',
          tarefa: 'Entrega 1',
          portal_codigo: 'portal-1',
        },
        {
          evento_id: '2',
          destinatario: 'dois@empresa.com.br',
          empresa: 'Empresa 2',
          projeto: 'Projeto 2',
          tarefa: 'Entrega 2',
          portal_codigo: 'portal-2',
        },
      ],
      error: null,
    });
    enviarNotificacaoEntrega
      .mockRejectedValueOnce(new Error('provedor indisponível'))
      .mockResolvedValueOnce({ status: 'enviada', destinatario: 'dois@empresa.com.br' });

    await expect(processarLembretesValidacao()).resolves.toEqual({
      reservados: 2,
      enviados: 1,
      falharam: 1,
    });
  });
});
