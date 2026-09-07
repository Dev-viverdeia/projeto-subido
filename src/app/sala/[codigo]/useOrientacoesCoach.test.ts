import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ESTADO_INICIAL_COACH,
  reduzirOrientacoes,
  useOrientacoesCoach,
} from './useOrientacoesCoach';
import type { SugestaoLive } from './CabineLiveCoach';

const sugestao: SugestaoLive = {
  id: 'a',
  categoria: 'impacto',
  titulo: 'Impacto real',
  sugestao: 'Quanto tempo isso toma da equipe?',
  metodologia: null,
  trecho_gatilho: 'São duas horas por dia.',
  prioridade: 2,
  criada_em: '2026-09-06T12:00:00.000Z',
};
const evento = {
  tipo: 'receber' as const,
  sugestao,
  historico: [],
  agora: Date.parse(sugestao.criada_em!),
};
describe('orientação visível no painel', () => {
  afterEach(() => vi.useRealTimers());
  it('sai do destaque quando a IA passa a observar, preservando o histórico', () => {
    const estado = reduzirOrientacoes(ESTADO_INICIAL_COACH, evento);
    const proximo = reduzirOrientacoes(estado, { ...evento, sugestao: null });
    expect(proximo.atual).toBeNull();
    expect(proximo.historico).toEqual([sugestao]);
  });
  it('uma repetição de rede não restaura uma orientação ocultada', () => {
    const estado = reduzirOrientacoes(ESTADO_INICIAL_COACH, evento);
    const oculto = reduzirOrientacoes(estado, { tipo: 'ocultar', id: 'a' });
    expect(reduzirOrientacoes(oculto, evento).atual).toBeNull();
  });
  it('não revive a orientação na reconexão após o prazo', () => {
    expect(
      reduzirOrientacoes(ESTADO_INICIAL_COACH, { ...evento, agora: evento.agora + 90_000 }).atual,
    ).toBeNull();
  });
  it('expira mesmo quando ninguém fala, sem renovar o relógio em respostas repetidas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(evento.agora);
    const { result } = renderHook(useOrientacoesCoach);
    act(() => result.current.receber(sugestao));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    act(() => result.current.receber(sugestao));
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.atual).toBeNull();
    expect(result.current.historico).toHaveLength(1);
  });
});
