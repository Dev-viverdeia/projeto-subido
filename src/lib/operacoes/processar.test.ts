import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  reivindicarOperacoes: vi.fn(),
  concluirOperacao: vi.fn(),
  registrarFalhaOperacao: vi.fn(),
  recuperarEnriquecimentosAbandonados: vi.fn(),
  processarListaProspeccao: vi.fn(),
  falharListaProspeccao: vi.fn(),
  encerrarGravacao: vi.fn(),
  processarPosCall: vi.fn(),
}));

vi.mock('./admin', () => ({
  reivindicarOperacoes: mocks.reivindicarOperacoes,
  concluirOperacao: mocks.concluirOperacao,
  registrarFalhaOperacao: mocks.registrarFalhaOperacao,
  recuperarEnriquecimentosAbandonados: mocks.recuperarEnriquecimentosAbandonados,
}));
vi.mock('@/lib/prospeccao/processar', () => ({
  processarListaProspeccao: mocks.processarListaProspeccao,
}));
vi.mock('@/lib/prospeccao/admin', () => ({
  falharListaProspeccao: mocks.falharListaProspeccao,
}));
vi.mock('@/lib/calls/gravacao', () => ({ encerrarGravacao: mocks.encerrarGravacao }));
vi.mock('@/lib/calls/processamento', () => ({ processarPosCall: mocks.processarPosCall }));

import { processarLoteOperacoes, processarOperacaoPorId } from './processar';
import type { OperacaoJob } from './tipos';

const DONO = '11111111-1111-4111-8111-111111111111';
const LISTA = '22222222-2222-4222-8222-222222222222';
const JOB = '33333333-3333-4333-8333-333333333333';
const BLOQUEIO = '44444444-4444-4444-8444-444444444444';

function operacao(parcial: Partial<OperacaoJob> = {}): OperacaoJob {
  return {
    id: JOB,
    dono: DONO,
    tipo: 'prospeccao',
    chave_idempotencia: `prospeccao:${LISTA}`,
    referencia_tipo: 'prospeccao_lista',
    referencia_id: LISTA,
    payload: {
      dono: DONO,
      lista: LISTA,
      busca: { segmento: 'Clínicas', localizacao: 'Belo Horizonte', quantidade: 5 },
    },
    status: 'processando',
    prioridade: 10,
    tentativas: 1,
    max_tentativas: 3,
    disponivel_em: '2026-08-26T12:00:00.000Z',
    bloqueado_ate: '2026-08-26T12:06:00.000Z',
    bloqueio_id: BLOQUEIO,
    bloqueado_por: 'teste',
    iniciado_em: '2026-08-26T12:00:00.000Z',
    concluido_em: null,
    erro_codigo: null,
    erro_mensagem: null,
    resultado: null,
    criado_em: '2026-08-26T12:00:00.000Z',
    atualizado_em: '2026-08-26T12:00:00.000Z',
    ...parcial,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.recuperarEnriquecimentosAbandonados.mockResolvedValue(0);
  mocks.concluirOperacao.mockResolvedValue(operacao({ status: 'concluida' }));
});

describe('fila durável de operações', () => {
  it('conclui uma prospecção e guarda o tamanho entregue', async () => {
    mocks.reivindicarOperacoes.mockResolvedValue([operacao()]);
    mocks.processarListaProspeccao.mockResolvedValue({ empresas: 5 });

    await expect(processarOperacaoPorId(JOB)).resolves.toEqual({ processadas: 1 });

    expect(mocks.concluirOperacao).toHaveBeenCalledWith(expect.objectContaining({ id: JOB }), {
      empresas: 5,
    });
    expect(mocks.falharListaProspeccao).not.toHaveBeenCalled();
  });

  it('mantém os créditos reservados quando ainda haverá retry', async () => {
    mocks.reivindicarOperacoes.mockResolvedValue([operacao()]);
    mocks.processarListaProspeccao.mockRejectedValue(new Error('provedor_indisponivel'));
    mocks.registrarFalhaOperacao.mockResolvedValue(operacao({ status: 'pendente' }));

    await processarOperacaoPorId(JOB);

    expect(mocks.registrarFalhaOperacao).toHaveBeenCalledOnce();
    expect(mocks.falharListaProspeccao).not.toHaveBeenCalled();
  });

  it('estorna a lista somente depois da última tentativa', async () => {
    mocks.reivindicarOperacoes.mockResolvedValue([operacao({ tentativas: 3 })]);
    mocks.processarListaProspeccao.mockRejectedValue(new Error('sem_resultados'));
    mocks.registrarFalhaOperacao.mockResolvedValue(
      operacao({ status: 'falhou', tentativas: 3, erro_mensagem: 'sem_resultados' }),
    );

    await processarOperacaoPorId(JOB);

    expect(mocks.falharListaProspeccao).toHaveBeenCalledWith(DONO, LISTA, 'sem_resultados');
  });

  it('fecha a gravação e conclui a análise pós-reunião no mesmo job', async () => {
    const reuniao = '55555555-5555-4555-8555-555555555555';
    mocks.reivindicarOperacoes.mockResolvedValue([
      operacao({
        tipo: 'pos_call',
        referencia_tipo: 'call_reuniao',
        referencia_id: reuniao,
        payload: { reuniaoId: reuniao },
      }),
    ]);
    mocks.processarPosCall.mockResolvedValue('concluida');

    await processarOperacaoPorId(JOB);

    expect(mocks.encerrarGravacao).toHaveBeenCalledWith(reuniao);
    expect(mocks.concluirOperacao).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'pos_call' }),
      { status: 'concluida' },
    );
  });

  it('executa o watchdog mesmo quando a fila está vazia', async () => {
    mocks.recuperarEnriquecimentosAbandonados.mockResolvedValue(2);
    mocks.reivindicarOperacoes.mockResolvedValue([]);

    await expect(processarLoteOperacoes()).resolves.toEqual({
      reivindicadas: 0,
      concluidas: 0,
      reagendadas: 0,
      falhas: 0,
      enriquecimentosRecuperados: 2,
    });
  });
});
