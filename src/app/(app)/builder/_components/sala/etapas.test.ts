import { describe, expect, it } from 'vitest';
import type { SolucaoBuilder } from '@/lib/builder/queries';
import { contarTarefas, etapaInicial, motivoDoCadeado } from './etapas';

/**
 * O TRAVAMENTO É DERIVADO DO DADO, e este teste existe para que continue sendo.
 *
 * A tentação óbvia é gravar `etapa_atual` numa coluna. No dia em que ela
 * discordasse do documento, a pessoa ficaria presa numa etapa que já cumpriu —
 * ou solta numa que não pode abrir, o que é pior, porque a etapa "Construir" sem
 * stack escolhida não tem prompt de partida para mostrar.
 *
 * Nada em tsc, eslint ou build percebe uma regra de liberação errada: os quatro
 * degraus continuam renderizando, só que abrindo na hora errada.
 */
function projeto(over: Partial<SolucaoBuilder> = {}): SolucaoBuilder {
  return {
    id: 'p1',
    titulo: 'Vendedor no WhatsApp',
    ideiaOriginal: 'quero um vendedor',
    respostas: [],
    documento: null,
    documentoIlegivel: false,
    status: 'rascunho',
    erro: null,
    modelo: null,
    criadoEm: '2026-08-01T00:00:00.000Z',
    oportunidadeId: null,
    projetoBaseId: null,
    stack: null,
    tarefas: {},
    ...over,
  };
}

const DOC = {
  etapas: [
    { titulo: 'A', descricao: 'a', ferramentas: [] },
    { titulo: 'B', descricao: 'b', ferramentas: [] },
    { titulo: 'C', descricao: 'c', ferramentas: [] },
  ],
} as unknown as NonNullable<SolucaoBuilder['documento']>;

describe('etapas da sala', () => {
  it('sem documento, só a criação abre', () => {
    const p = projeto();
    expect(motivoDoCadeado('criacao', p)).toBeNull();
    expect(motivoDoCadeado('entender', p)).toContain('sendo criado');
    expect(motivoDoCadeado('kit', p)).toContain('sendo criado');
    expect(motivoDoCadeado('construir', p)).toContain('sendo criado');
  });

  /* O kanban sem stack seria uma lista de tarefas sem por onde começar — o
     prompt de partida depende da escolha. */
  it('com documento e sem stack, construir segue travada e diz por quê', () => {
    const p = projeto({ documento: DOC, status: 'pronta' });
    expect(motivoDoCadeado('entender', p)).toBeNull();
    expect(motivoDoCadeado('kit', p)).toBeNull();
    expect(motivoDoCadeado('construir', p)).toContain('onde construir');
  });

  it('com stack escolhida, tudo abre', () => {
    const p = projeto({ documento: DOC, status: 'pronta', stack: 'lovable_supabase' });
    for (const e of ['criacao', 'entender', 'kit', 'construir'] as const) {
      expect(motivoDoCadeado(e, p)).toBeNull();
    }
  });

  /* Abrir sempre na primeira faria quem já tem o plano pronto passar por duas
     telas antes de chegar ao quadro. */
  it('a sala abre na última etapa liberada', () => {
    expect(etapaInicial(projeto())).toBe('criacao');
    expect(etapaInicial(projeto({ documento: DOC, status: 'pronta' }))).toBe('kit');
    expect(
      etapaInicial(projeto({ documento: DOC, status: 'pronta', stack: 'lovable_cloud' })),
    ).toBe('construir');
  });

  /* A contagem é do DOCUMENTO cruzada com o estado, nunca do número de linhas na
     tabela: índice sem linha é `a_fazer`, e linha cujo índice saiu do documento
     (regeração com menos etapas) não pode inflar o total. */
  it('conta as feitas contra o total do documento, não contra a tabela', () => {
    const p = projeto({
      documento: DOC,
      status: 'pronta',
      tarefas: { 0: 'feito', 1: 'fazendo', 7: 'feito' },
    });
    expect(contarTarefas(p)).toEqual({ feitas: 1, total: 3 });
  });

  it('sem documento não há denominador', () => {
    expect(contarTarefas(projeto())).toEqual({ feitas: 0, total: 0 });
  });

  /* O AVANÇO só pode existir quando a próxima está destravada — um "continuar"
     que esbarra num cadeado é a promessa que a etapa acabou de negar. A regra é
     a mesma do travamento, consultada com o degrau SEGUINTE. */
  it('o avanço respeita o mesmo cadeado da etapa de destino', () => {
    const semStack = projeto({ documento: DOC, status: 'pronta' });
    expect(motivoDoCadeado('construir', semStack)).not.toBeNull();

    const comStack = projeto({ documento: DOC, status: 'pronta', stack: 'lovable_supabase' });
    expect(motivoDoCadeado('construir', comStack)).toBeNull();
  });
});
