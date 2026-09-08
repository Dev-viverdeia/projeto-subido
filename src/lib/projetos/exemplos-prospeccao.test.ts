import { describe, expect, it } from 'vitest';
import fixture from '@/app/preview/prospeccao-projeto/fixture.json';
import { lerRoteiroProjeto } from './roteiro';
import {
  exemploAulaProspeccao,
  exemploPassoProspeccao,
  exemplosPassosProspeccao,
  PROSPECCAO_SLUG,
} from './exemplos-prospeccao';

describe('Exemplos da Prospeccao', () => {
  const roteiro = lerRoteiroProjeto(fixture.roteiro)!;
  it('cobre os dez passos reais, sem alterar os identificadores de progresso', () => {
    expect(roteiro).not.toBeNull();
    const ids = roteiro.fases.flatMap((fase) => fase.passos.map((passo) => passo.id));
    expect(ids).toHaveLength(10);
    expect(Object.keys(exemplosPassosProspeccao).sort()).toEqual(ids.sort());
    for (const id of ids) {
      const exemplo = exemploPassoProspeccao(PROSPECCAO_SLUG, id)!;
      expect(exemplo.titulo).toBeTruthy();
      expect(exemplo.entrega).toBeTruthy();
      if (exemplo.tipo === 'fluxo') expect(exemplo.etapas).toHaveLength(4);
      if (exemplo.tipo === 'conversa') expect(exemplo.cenarios).toHaveLength(3);
      if (exemplo.tipo === 'ficha') expect(exemplo.campos).toHaveLength(4);
      if (exemplo.tipo === 'analise') {
        expect(exemplo.casos).toHaveLength(3);
        for (const caso of exemplo.casos) {
          expect(caso.criterios).toHaveLength(3);
          expect(caso.decisao).toBeTruthy();
          expect(caso.motivo).toBeTruthy();
        }
      }
    }
  });
  it('cobre as três aulas pelo conteúdo, não pela posição', () => {
    expect(roteiro.trilhaDidatica!.aulas).toHaveLength(3);
    for (const aula of [...roteiro.trilhaDidatica!.aulas].reverse()) {
      expect(exemploAulaProspeccao(PROSPECCAO_SLUG, aula.titulo)).not.toBeNull();
    }
  });
  it('mantém o roteiro original para outros projetos ou conteúdo desconhecido', () => {
    expect(exemploPassoProspeccao('outro-projeto', 'traduzir-icp')).toBeNull();
    expect(exemploPassoProspeccao(PROSPECCAO_SLUG, 'passo-novo')).toBeNull();
    expect(exemploPassoProspeccao(PROSPECCAO_SLUG, 'toString')).toBeNull();
    expect(
      exemploAulaProspeccao('outro-projeto', roteiro.trilhaDidatica!.aulas[0]!.titulo),
    ).toBeNull();
    expect(exemploAulaProspeccao(PROSPECCAO_SLUG, 'Aula nova')).toBeNull();
    expect(exemploAulaProspeccao(PROSPECCAO_SLUG, '__proto__')).toBeNull();
  });
});
