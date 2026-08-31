import { describe, expect, it } from 'vitest';
import type { Tables } from '@/lib/supabase/types.generated';
import { formatarDataEvolucao, mapearEvolucaoProjeto, ROTULO_DECISAO_EVOLUCAO } from './evolucao';

const LINHA: Tables<'projeto_evolucoes'> = {
  id: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
  dono: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  projeto_execucao_id: '11111111-1111-4111-8111-111111111111',
  status: 'registrada',
  revisao_em: '2026-09-09',
  resultado_observado: 'A equipe reduziu o tempo de primeira resposta no piloto.',
  evidencia_resultado_url: 'https://example.com/resultado',
  decisao: 'expandir',
  proximo_passo: 'Definir o segundo canal com a responsável.',
  proximo_passo_em: '2026-09-15',
  compartilhar_cliente: true,
  registrada_em: '2026-09-09T14:00:00.000Z',
  criado_em: '2026-08-10T18:20:00.000Z',
  atualizado_em: '2026-09-09T14:00:00.000Z',
};

describe('evolução do projeto', () => {
  it('preserva resultado factual, decisão e próximo passo para a interface', () => {
    expect(mapearEvolucaoProjeto(LINHA)).toMatchObject({
      status: 'registrada',
      resultadoObservado: LINHA.resultado_observado,
      decisao: 'expandir',
      proximoPassoEm: '2026-09-15',
      compartilharCliente: true,
    });
    expect(ROTULO_DECISAO_EVOLUCAO.expandir).toBe('Expandir este projeto');
  });

  it('formata a data sem deslocar o dia pelo fuso horário', () => {
    expect(formatarDataEvolucao('2026-09-09')).toMatch(/09 de setembro de 2026/i);
  });
});
