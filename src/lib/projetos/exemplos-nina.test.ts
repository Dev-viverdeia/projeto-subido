import { describe, expect, it } from 'vitest';
import fixture from '@/app/preview/nina/fixture.json';
import { lerRoteiroProjeto } from './roteiro';
import { exemploAulaNina, exemploPassoNina, exemplosPassosNina, NINA_SLUG } from './exemplos-nina';

describe('Exemplos da Nina', () => {
  const roteiro = lerRoteiroProjeto(fixture.roteiro)!;
  it('cobre os dez passos reais, sem alterar os identificadores de progresso', () => {
    expect(roteiro).not.toBeNull();
    const ids = roteiro.fases.flatMap((fase) => fase.passos.map((passo) => passo.id));
    expect(ids).toHaveLength(10);
    expect(Object.keys(exemplosPassosNina).sort()).toEqual(ids.sort());
    for (const id of ids) {
      const exemplo = exemploPassoNina(NINA_SLUG, id)!;
      expect(exemplo.titulo).toBeTruthy();
      expect(exemplo.entrega).toBeTruthy();
      if (exemplo.tipo === 'fluxo') expect(exemplo.etapas).toHaveLength(4);
      if (exemplo.tipo === 'conversa') expect(exemplo.cenarios).toHaveLength(3);
      if (exemplo.tipo === 'ficha') expect(exemplo.campos).toHaveLength(4);
    }
  });
  it('cobre as três aulas pelo conteúdo, não pela posição', () => {
    expect(roteiro.trilhaDidatica!.aulas).toHaveLength(3);
    for (const aula of [...roteiro.trilhaDidatica!.aulas].reverse()) {
      expect(exemploAulaNina(NINA_SLUG, aula.titulo)).not.toBeNull();
    }
  });
  it('mantém o roteiro original para outros projetos ou conteúdo desconhecido', () => {
    expect(exemploPassoNina('outro-projeto', 'mapear-jornada')).toBeNull();
    expect(exemploPassoNina(NINA_SLUG, 'passo-novo')).toBeNull();
    expect(exemploPassoNina(NINA_SLUG, 'toString')).toBeNull();
    expect(exemploAulaNina('outro-projeto', roteiro.trilhaDidatica!.aulas[0]!.titulo)).toBeNull();
    expect(exemploAulaNina(NINA_SLUG, 'Aula nova')).toBeNull();
    expect(exemploAulaNina(NINA_SLUG, '__proto__')).toBeNull();
  });
});
