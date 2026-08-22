import { describe, expect, it } from 'vitest';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import type { EstadoProgressoConta } from '@/lib/progresso/local';
import { selecionarProximaFormacao } from './TrilhaFormacoes';

function formacao(slug: string, aulaIds: string[]): FormacaoResumo {
  return {
    id: slug,
    slug,
    titulo: slug,
    resumo: '',
    capa_url: null,
    publicado_em: null,
    criado_em: '2026-08-21T00:00:00.000Z',
    modulos: 1,
    aulas: aulaIds.length,
    aulaIds,
  };
}

function progresso(
  aulas: string[] = [],
  formacoes: Record<string, string> = {},
): EstadoProgressoConta {
  return {
    aulas: Object.fromEntries(aulas.map((id) => [id, '2026-08-21T00:00:00.000Z'])),
    formacoes,
    etapas: {},
    solucoes: {},
  };
}

const TRILHA = [formacao('base', ['a1', 'a2']), formacao('agentes', ['b1', 'b2'])];

describe('próxima formação da trilha', () => {
  it('começa pela primeira formação quando não há progresso', () => {
    expect(selecionarProximaFormacao(TRILHA, progresso())?.slug).toBe('base');
  });

  it('prioriza a formação em andamento mais recente', () => {
    const estado = progresso(['b1'], { agentes: '2026-08-21T12:00:00.000Z' });
    expect(selecionarProximaFormacao(TRILHA, estado)?.slug).toBe('agentes');
  });

  it('avança quando a formação anterior foi concluída', () => {
    expect(selecionarProximaFormacao(TRILHA, progresso(['a1', 'a2']))?.slug).toBe('agentes');
  });

  it('encerra quando todas as formações foram concluídas', () => {
    expect(selecionarProximaFormacao(TRILHA, progresso(['a1', 'a2', 'b1', 'b2']))).toBeNull();
  });
});
