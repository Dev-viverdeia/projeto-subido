import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { montarPlanoCall } from '@/lib/calls/plano';
import { assinaturaRoteiro, lerPosicaoRoteiro, POSICAO_INICIAL } from '@/lib/calls/posicao-roteiro';
import { limparPosicoesRoteiro, PREFIXO_POSICAO_ROTEIRO } from '@/lib/calls/posicao-roteiro-local';
import { usePosicaoRoteiro } from './usePosicaoRoteiro';

const plano = montarPlanoCall({
  tipo: 'descoberta',
  empresa: 'Horizonte',
  oportunidade: 'Atendimento com IA',
  proximaAcao: 'Revisar o piloto.',
  dossie: null,
});

beforeEach(() => limparPosicoesRoteiro());
afterEach(() => {
  vi.restoreAllMocks();
  limparPosicoesRoteiro();
});

describe('posição de leitura da reunião', () => {
  it('retoma pergunta, momento e consulta após desmontar, sem guardar conteúdo', () => {
    const first = renderHook(() => usePosicaoRoteiro('reuniao-a', plano, 'descoberta'));
    act(() => first.result.current.atualizar({ indice: 2 }));
    act(() => first.result.current.atualizar({ momento: 'fechamento', consulta: 'ao-vivo' }));
    first.unmount();
    const next = renderHook(() => usePosicaoRoteiro('reuniao-a', plano, 'descoberta'));
    expect(next.result.current.posicao).toEqual({
      indice: 2,
      momento: 'fechamento',
      consulta: 'ao-vivo',
    });
    const raw = sessionStorage.getItem(PREFIXO_POSICAO_ROTEIRO + 'reuniao-a')!;
    expect(Object.keys(JSON.parse(raw) as Record<string, unknown>).sort()).toEqual([
      'assinatura',
      'consulta',
      'indice',
      'momento',
      'versao',
    ]);
    expect(raw).not.toContain('Horizonte');
    expect(raw).not.toContain(plano.perguntas[2]!.pergunta);
    expect(raw.length).toBeLessThan(160);
  });

  it('não transfere posição entre reuniões ou roteiros diferentes', () => {
    const { result, rerender } = renderHook(
      ({ id, atual }) => usePosicaoRoteiro(id, atual, 'descoberta'),
      { initialProps: { id: 'a', atual: plano } },
    );
    act(() => result.current.atualizar({ indice: 2 }));
    rerender({ id: 'b', atual: plano });
    expect(result.current.posicao).toEqual(POSICAO_INICIAL);
    rerender({ id: 'a', atual: plano });
    expect(result.current.posicao.indice).toBe(2);
    rerender({ id: 'a', atual: { ...plano, abertura: 'Novo roteiro' } });
    expect(result.current.posicao).toEqual(POSICAO_INICIAL);
  });

  it('continua navegando e retoma após remount com armazenamento bloqueado', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const first = renderHook(() => usePosicaoRoteiro('a', plano, 'descoberta'));
    act(() => first.result.current.atualizar({ indice: 1 }));
    expect(first.result.current.posicao.indice).toBe(1);
    first.unmount();
    const next = renderHook(() => usePosicaoRoteiro('a', plano, 'descoberta'));
    expect(next.result.current.posicao.indice).toBe(1);
    act(() => limparPosicoesRoteiro());
    expect(next.result.current.posicao).toEqual(POSICAO_INICIAL);
  });

  it('limpa somente seus marcadores no logout e atualiza painéis montados', () => {
    sessionStorage.setItem('nao-relacionado', 'preservar');
    const { result } = renderHook(() => usePosicaoRoteiro('a', plano, 'descoberta'));
    act(() => result.current.atualizar({ indice: 1 }));
    act(() => limparPosicoesRoteiro());
    expect(result.current.posicao).toEqual(POSICAO_INICIAL);
    expect(sessionStorage.getItem(PREFIXO_POSICAO_ROTEIRO + 'a')).toBeNull();
    expect(sessionStorage.getItem('nao-relacionado')).toBe('preservar');
    sessionStorage.removeItem('nao-relacionado');
  });

  it('sem ID mantém navegação local, sem criar um marcador compartilhado', () => {
    const { result } = renderHook(() => usePosicaoRoteiro(undefined, plano, 'descoberta'));
    act(() => result.current.atualizar({ indice: 1 }));
    expect(result.current.posicao.indice).toBe(1);
    expect(
      Object.keys(sessionStorage).filter((k) => k.startsWith(PREFIXO_POSICAO_ROTEIRO)),
    ).toEqual([]);
  });

  it.each([
    '',
    '{',
    'null',
    '[]',
    ...[
      { versao: 2 },
      { indice: -1 },
      { indice: 999 },
      { indice: 1.2 },
      { momento: 'concluido' },
      { momento: ['perguntas'] },
      { consulta: 'respostas' },
      { assinatura: 'obsoleta' },
    ].map((p) =>
      JSON.stringify({
        ...POSICAO_INICIAL,
        versao: 1,
        assinatura: assinaturaRoteiro(plano, 'descoberta'),
        ...p,
      }),
    ),
  ])('ignora armazenamento inválido: %s', (raw) => {
    expect(
      lerPosicaoRoteiro(raw, assinaturaRoteiro(plano, 'descoberta'), plano.perguntas.length),
    ).toEqual(POSICAO_INICIAL);
  });
});
