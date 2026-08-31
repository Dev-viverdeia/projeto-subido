import { describe, expect, it } from 'vitest';
import type { EvolucaoProjeto } from './evolucao';
import { classificarRevisaoEvolucao, ordenarRevisoesEvolucao } from './radar-evolucao';

const BASE: EvolucaoProjeto = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'agendada',
  revisaoEm: '2026-08-31',
  resultadoObservado: null,
  evidenciaResultadoUrl: null,
  decisao: null,
  proximoPasso: null,
  proximoPassoEm: null,
  compartilharCliente: false,
  registradaEm: null,
  oportunidadeContinuidadeId: null,
};

describe('radar de evolução', () => {
  const agora = new Date('2026-08-31T15:00:00.000Z');

  it.each([
    ['2026-08-29', 'vencida', 'Atrasada há 2 dias'],
    ['2026-08-31', 'hoje', 'Revisão hoje'],
    ['2026-09-01', 'proxima', 'Revisão amanhã'],
    ['2026-09-07', 'proxima', 'Revisão em 7 dias'],
    ['2026-09-08', 'agendada', 'Revisão em 8 dias'],
  ] as const)('classifica %s como %s', (revisaoEm, status, rotulo) => {
    expect(classificarRevisaoEvolucao({ ...BASE, revisaoEm }, agora)).toMatchObject({
      status,
      rotulo,
    });
  });

  it('mantém o resultado registrado fora da fila pendente', () => {
    expect(classificarRevisaoEvolucao({ ...BASE, status: 'registrada' }, agora)).toMatchObject({
      status: 'registrada',
      rotulo: 'Resultado registrado',
    });
  });

  it('ordena atrasadas antes das próximas e das concluídas', () => {
    const projetos = [
      { nome: 'registrada', evolucao: { ...BASE, status: 'registrada' as const } },
      { nome: 'proxima', evolucao: { ...BASE, revisaoEm: '2026-09-02' } },
      { nome: 'vencida', evolucao: { ...BASE, revisaoEm: '2026-08-28' } },
    ];

    expect(ordenarRevisoesEvolucao(projetos, agora).map((projeto) => projeto.nome)).toEqual([
      'vencida',
      'proxima',
      'registrada',
    ]);
  });
});
