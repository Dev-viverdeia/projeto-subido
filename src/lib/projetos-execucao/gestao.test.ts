import { describe, expect, it } from 'vitest';
import { estaEmAcompanhamento, rotuloGestao } from './gestao';

describe('gestão de entregas', () => {
  it('mantém projetos legados pontuais', () => {
    expect(rotuloGestao({ status: 'em_execucao' })).toBe('Projeto pontual');
    expect(estaEmAcompanhamento({ status: 'concluido' })).toBe(false);
  });
  it('só acompanha recorrentes com execução entregue e acompanhamento aberto', () => {
    expect(estaEmAcompanhamento({ status: 'em_execucao', tipoServico: 'recorrente' })).toBe(false);
    expect(estaEmAcompanhamento({ status: 'concluido', tipoServico: 'recorrente' })).toBe(true);
    expect(
      estaEmAcompanhamento({
        status: 'concluido',
        tipoServico: 'recorrente',
        recorrenciaEncerradaEm: '2026-09-08',
      }),
    ).toBe(false);
  });
});
