import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { montarPlanoJornada } from '@/lib/jornada/motor';
import type { JornadaOperacional } from '@/lib/jornada/queries';
import type { Database } from '@/lib/supabase/types.generated';
import { obterSinaisSobral } from './contexto';

vi.mock('server-only', () => ({}));

function consulta<T>(data: T) {
  const resultado = Promise.resolve({ data, error: null });
  const encadeavel = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_alvo, propriedade) => {
        if (propriedade === 'then') return resultado.then.bind(resultado);
        return () => encadeavel;
      },
    },
  );
  return encadeavel;
}

describe('contexto factual do Sobral AI', () => {
  it('reusa os cinco domínios já lidos pela jornada na tela Início', async () => {
    const empresaId = '11111111-1111-4111-8111-111111111111';
    const oportunidadeId = '22222222-2222-4222-8222-222222222222';
    const perfil = {
      nicho: 'Clínicas',
      projetoInicialId: '33333333-3333-4333-8333-333333333333',
      projetoInicialTitulo: 'SDR de Atendimento e Qualificação',
      projetoInicialSlug: 'sdr-atendimento-qualificacao',
      posicionamento: 'Implanto atendimento com IA para clínicas.',
      atualizadoEm: '2026-08-13T12:00:00.000Z',
    };
    const aprendizado = {
      aulasConcluidas: 0,
      formacoesConcluidas: 0,
      etapasConcluidas: 0,
      projetosConcluidos: 0,
    };
    const jornada: JornadaOperacional = {
      perfil,
      projetos: [
        {
          id: perfil.projetoInicialId,
          slug: perfil.projetoInicialSlug,
          titulo: perfil.projetoInicialTitulo,
          resumo: 'Atendimento e qualificação com supervisão humana.',
          categoria: 'Atendimento',
        },
      ],
      aprendizado,
      plano: montarPlanoJornada({
        perfil,
        aprendizado,
        oportunidades: { total: 1, enriquecidas: 0, comProximaAcao: 0, ganhas: 0 },
        calls: { descobertasConcluidas: 0, kickoffsConcluidos: 0, entregasConcluidas: 0 },
        propostas: { total: 0, apresentadas: 0, aceitas: 0 },
        entregas: {
          projetosIniciados: 0,
          projetosConcluidos: 0,
          propostaAceitaEmFocoId: null,
          projetoEmFocoId: null,
          projetoEmFocoTitulo: null,
          tarefasConcluidas: 0,
          tarefasTotal: 0,
        },
      }),
      fatos: {
        oportunidades: [
          {
            id: oportunidadeId,
            empresa_id: empresaId,
            titulo: 'Atendimento da Clínica Aurora',
            etapa: 'novo_lead',
            proxima_acao: null,
            proxima_acao_em: null,
            atualizado_em: '2026-08-13T12:00:00.000Z',
          },
        ],
        enriquecimentos: [],
        calls: [],
        propostas: [],
        projetos: [],
        catalogo: [
          {
            slug: perfil.projetoInicialSlug,
            titulo: perfil.projetoInicialTitulo,
            categoria: 'Atendimento',
          },
        ],
      },
    };
    const dadosPorTabela: Record<string, unknown[]> = {
      solucoes: [
        {
          slug: perfil.projetoInicialSlug,
          titulo: perfil.projetoInicialTitulo,
          categoria: 'Atendimento',
          solucao_itens: [{ tipo: 'ferramenta', titulo: 'OpenAI' }],
        },
      ],
      formacoes: [
        {
          slug: 'fundamentos-de-ia',
          titulo: 'Fundamentos de IA',
          resumo: 'Base para começar a implementar.',
          modulos: [
            {
              aulas: [
                {
                  id: '44444444-4444-4444-8444-444444444444',
                  titulo: 'Como escolher o primeiro projeto',
                },
              ],
            },
          ],
        },
      ],
      crm_empresas: [{ id: empresaId, nome: 'Clínica Aurora' }],
      builder_solucoes: [],
      projeto_acoes: [],
    };
    const from = vi.fn((tabela: string) => consulta(dadosPorTabela[tabela] ?? []));
    const supabase = { from } as unknown as SupabaseClient<Database>;

    const sinais = await obterSinaisSobral(supabase, jornada);

    expect(from.mock.calls.map(([tabela]) => tabela)).toEqual([
      'solucoes',
      'formacoes',
      'crm_empresas',
      'builder_solucoes',
      'projeto_acoes',
    ]);
    expect(sinais.oportunidades.total).toBe(1);
    expect(sinais.foco).toMatchObject({
      oportunidadeId,
      empresa: 'Clínica Aurora',
    });
    expect(sinais.aulas[0]).toMatchObject({ titulo: 'Como escolher o primeiro projeto' });
    expect(sinais.ferramentas[0]).toMatchObject({ titulo: 'OpenAI' });
  });
});
