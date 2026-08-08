import { describe, expect, it } from 'vitest';
import {
  estadoDoProgresso,
  mesclarProgresso,
  PROGRESSO_VAZIO,
  type EstadoProgressoConta,
} from './estado';

function estado(parcial: Partial<EstadoProgressoConta>): EstadoProgressoConta {
  return {
    aulas: {},
    formacoes: {},
    etapas: {},
    solucoes: {},
    ...parcial,
  };
}

describe('estado do progresso da conta', () => {
  it('preserva a primeira conclusão e a atividade mais recente ao migrar', () => {
    const conta = estado({
      aulas: { a1: '2026-08-08T12:00:00.000Z' },
      formacoes: { base: '2026-08-08T12:00:00.000Z' },
    });
    const legado = estado({
      aulas: {
        a1: '2026-08-07T12:00:00.000Z',
        a2: '2026-08-08T13:00:00.000Z',
      },
      formacoes: { base: '2026-08-08T14:00:00.000Z' },
    });

    expect(mesclarProgresso(conta, legado)).toEqual(
      estado({
        aulas: {
          a1: '2026-08-07T12:00:00.000Z',
          a2: '2026-08-08T13:00:00.000Z',
        },
        formacoes: { base: '2026-08-08T14:00:00.000Z' },
      }),
    );
  });

  it('não compartilha mutação com o estado vazio', () => {
    const unido = mesclarProgresso(PROGRESSO_VAZIO, estado({ aulas: { a1: '2026-08-08Z' } }));
    delete unido.aulas.a1;
    expect(PROGRESSO_VAZIO.aulas).toEqual({});
  });

  it('não trata conteúdo sem itens como concluído', () => {
    expect(estadoDoProgresso(0, 0)).toBe('sem-itens');
    expect(estadoDoProgresso(2, 2)).toBe('concluida');
  });
});
