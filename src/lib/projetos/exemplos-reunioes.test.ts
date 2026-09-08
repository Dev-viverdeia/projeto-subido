import { describe, expect, it } from 'vitest';
import fixture from '@/app/preview/reunioes-projeto/fixture.json';
import { lerRoteiroProjeto } from './roteiro';
import { exemploAulaProjeto, exemploPassoProjeto } from './exemplos';
import { exemplosPassosReunioes, REUNIOES_SLUG } from './exemplos-reunioes';

const roteiro = lerRoteiroProjeto(fixture.roteiro)!;

describe('Exemplos do Assistente de reuniões', () => {
  it('cobre os dez passos do currículo público, com os mesmos IDs', () => {
    const ids = roteiro.fases.flatMap((fase) => fase.passos.map((passo) => passo.id));
    expect(ids).toHaveLength(10);
    expect(Object.keys(exemplosPassosReunioes).sort()).toEqual(ids.sort());
    for (const id of ids) {
      const exemplo = exemploPassoProjeto(REUNIOES_SLUG, id)!;
      expect(exemplo.titulo).toBeTruthy();
      expect(exemplo.entrega).toBeTruthy();
      if (exemplo.tipo === 'fluxo') expect(exemplo.etapas).toHaveLength(4);
      if (exemplo.tipo === 'ficha') expect(exemplo.campos).toHaveLength(4);
      if (exemplo.tipo === 'conversa' || exemplo.tipo === 'pos-call') {
        expect(exemplo.cenarios).toHaveLength(3);
      }
    }
  });
  it('encontra as três aulas pelo título, independentemente da ordem', () => {
    expect(roteiro.trilhaDidatica!.aulas).toHaveLength(3);
    for (const aula of [...roteiro.trilhaDidatica!.aulas].reverse()) {
      expect(exemploAulaProjeto(REUNIOES_SLUG, aula.titulo)).not.toBeNull();
    }
  });
  it('mantém fallback e isolamento entre os projetos', () => {
    expect(exemploPassoProjeto(REUNIOES_SLUG, 'passo-novo')).toBeNull();
    expect(exemploPassoProjeto(REUNIOES_SLUG, 'toString')).toBeNull();
    expect(exemploPassoProjeto(REUNIOES_SLUG, 'mapear-jornada')).toBeNull();
    expect(exemploPassoProjeto('sdr-atendimento-qualificacao', 'gerar-pos-call')).toBeNull();
    expect(
      exemploAulaProjeto('maquina-prospeccao-b2b', 'Leve fatos confirmados ao CRM'),
    ).toBeNull();
    expect(exemploAulaProjeto(REUNIOES_SLUG, '__proto__')).toBeNull();
    expect(exemploAulaProjeto(REUNIOES_SLUG, 'Aula nova')).toBeNull();
  });
  it('separa acordo, data ausente e ausência de compromisso sem inventar campos', () => {
    const { cenarios } = exemplosPassosReunioes['gerar-pos-call'];
    expect(cenarios.map((c) => c.estado)).toEqual(['acordo', 'pendente', 'sem_acordo']);
    expect(cenarios[1]!.prazo).toBe('Não combinado');
    expect(cenarios[2]!.responsavel).toBe('Não definido');
    for (const cenario of cenarios) {
      expect(cenario.falas).toHaveLength(2);
      for (const fala of cenario.falas) {
        expect(fala.pessoa).toBeTruthy();
        expect(fala.horario).toMatch(/^\d{2}:\d{2}$/);
        expect(fala.texto).toBeTruthy();
      }
      expect(cenario.revisao).toBeTruthy();
    }
  });
});
