import { describe, expect, it } from 'vitest';
import { estadoDoResumo, type EntradaEstadoResumo, type OperacaoResumoCall } from './estado-resumo';

const AGORA = Date.parse('2026-09-13T15:00:00Z');
const base: EntradaEstadoResumo = {
  reuniao: { status: 'concluida' },
  analise: null,
  transcricao: null,
  operacoes: [],
};
const job: OperacaoResumoCall = {
  tipo: 'pos_call',
  status: 'processando',
  tentativas: 1,
  disponivelEm: new Date(AGORA).toISOString(),
  atualizadaEm: new Date(AGORA).toISOString(),
  bloqueadoAte: new Date(AGORA + 360_000).toISOString(),
};
const analise = { status: 'processando', resumo: null, atualizadaEm: job.atualizadaEm };
const ler = (dados: Partial<EntradaEstadoResumo> = {}) =>
  estadoDoResumo({ ...base, ...dados }, AGORA);

describe('estado factual do resumo', () => {
  it.each(['concluida', 'processando'] as const)(
    'não inventa processamento para reunião %s sem registros',
    (status) => {
      expect(ler({ reuniao: { status } })).toMatchObject({ tipo: 'sem_resumo', acompanhar: false });
      expect(ler().apoio).not.toContain('transcrição');
    },
  );
  it('distingue erro de consulta de fila vazia, sem ocultar resumo pronto', () => {
    expect(ler({ operacoes: null })).toMatchObject({ tipo: 'desconhecido', acompanhar: false });
    expect(
      ler({
        operacoes: null,
        analise: { ...analise, status: 'concluida', resumo: 'Decisão registrada.' },
      }).tipo,
    ).toBe('pronta');
  });
  it('prioriza conteúdo concluído sobre job que falhou depois da persistência', () => {
    expect(
      ler({
        analise: { ...analise, status: 'concluida', resumo: 'Decisão registrada.' },
        operacoes: [{ ...job, status: 'falhou' }],
      }).tipo,
    ).toBe('pronta');
  });
  it.each(['', '   ', null])('não trata resumo vazio %j como pronto', (resumo) => {
    expect(ler({ analise: { ...analise, status: 'concluida', resumo } }).tipo).toBe('sem_resumo');
  });
  it('aguarda somente uma reserva em execução válida', () => {
    expect(ler({ operacoes: [job] })).toMatchObject({ tipo: 'processando', acompanhar: true });
    expect(
      ler({ operacoes: [{ ...job, atualizadaEm: new Date(AGORA + 2_000).toISOString() }] })
        .acompanhar,
    ).toBe(true);
    expect(ler({ operacoes: [{ ...job, tipo: 'encerramento_sala' }] }).titulo).toBe(
      'Finalizando a reunião.',
    );
  });
  it.each([null, 'inválida', new Date(AGORA).toISOString(), new Date(AGORA - 1).toISOString()])(
    'não mantém spinner quando a reserva expirou: %s',
    (bloqueadoAte) => {
      expect(ler({ operacoes: [{ ...job, bloqueadoAte }] })).toMatchObject({
        tipo: 'demorada',
        acompanhar: false,
      });
    },
  );
  it.each([
    'inválida',
    new Date(AGORA + 60_000).toISOString(),
    new Date(AGORA - 600_000).toISOString(),
  ])('não considera processamento confiável com atualização %s', (atualizadaEm) => {
    expect(ler({ operacoes: [{ ...job, atualizadaEm }] }).acompanhar).toBe(false);
  });
  it.each([0, 2])('diferencia espera e retentativa já registrada (%s tentativas)', (tentativas) => {
    expect(
      ler({
        analise: { ...analise, status: 'falhou' },
        operacoes: [{ ...job, status: 'pendente', tentativas }],
      }),
    ).toMatchObject({ tipo: tentativas ? 'retentativa' : 'fila', acompanhar: true });
  });
  it('interrompe espera por fila esquecida e não esconde um job ativo atrás de um encerrado', () => {
    expect(
      ler({
        operacoes: [
          { ...job, status: 'pendente', disponivelEm: new Date(AGORA - 301_000).toISOString() },
        ],
      }).tipo,
    ).toBe('demorada');
    expect(ler({ operacoes: [{ ...job, status: 'concluida' }, job] }).acompanhar).toBe(true);
  });
  it('aceita análise legada recente, mas não processamento órfão antigo', () => {
    expect(ler({ analise }).acompanhar).toBe(true);
    expect(
      ler({ analise: { ...analise, atualizadaEm: new Date(AGORA - 300_000).toISOString() } }).tipo,
    ).toBe('demorada');
  });
  it('permite revisão manual na falha e só afirma haver transcrição quando existe texto', () => {
    const dados = { analise: { ...analise, status: 'falhou' } };
    expect(ler(dados)).toMatchObject({ tipo: 'falhou', acompanhar: false });
    expect(ler(dados).apoio).not.toContain('transcrição');
    expect(
      ler({ ...dados, transcricao: { textoCompleto: '  ', segmentos: [] } }).apoio,
    ).not.toContain('transcrição');
    expect(
      ler({
        ...dados,
        transcricao: { textoCompleto: null, segmentos: [{ texto: 'Conversa registrada.' }] },
      }).apoio,
    ).toContain('transcrição está disponível');
  });
  it.each(['concluida', 'cancelada'])(
    'não trata operação terminal %s sem análise como progresso',
    (status) => {
      expect(ler({ operacoes: [{ ...job, status }] }).tipo).toBe('sem_resumo');
    },
  );
  it('mostra falha terminal da fila mesmo sem linha de análise', () => {
    expect(ler({ operacoes: [{ ...job, status: 'falhou' }] }).tipo).toBe('falhou');
    expect(ler({ analise, operacoes: [{ ...job, status: 'falhou' }] }).acompanhar).toBe(false);
  });
  it('cancelamento e falta de conteúdo não disparam novas consultas', () => {
    expect(ler({ reuniao: { status: 'cancelada' }, operacoes: [job] })).toMatchObject({
      tipo: 'indisponivel',
      acompanhar: false,
    });
    expect(ler({ analise: { ...analise, status: 'sem_conteudo' } })).toMatchObject({
      tipo: 'sem_conteudo',
      acompanhar: false,
    });
  });
});
