import { describe, expect, it } from 'vitest';
import { SinaisSobralSchema } from './direcao';
import { resolverRecomendacoes } from './conteudo';

const sinais = SinaisSobralSchema.parse({
  momento: '2026-08-20T12:00:00.000Z',
  oportunidades: {
    total: 0,
    abertas: 0,
    semProximaAcao: 0,
    emDescoberta: 0,
    emPropostaOuNegociacao: 0,
    ganhas: 0,
  },
  calls: { total: 0, agendadas: 0, concluidas: 0 },
  propostas: { total: 0, rascunhos: 0, prontas: 0, apresentadas: 0, aceitas: 0 },
  studio: { total: 0, prontos: 0 },
  projetos: { total: 0, ativos: 0, acoesPendentes: 0, acoesAtrasadas: 0 },
  radar: [],
  catalogo: [{ slug: 'sdr-ia', titulo: 'SDR com IA', categoria: 'Vendas' }],
  formacoes: [{ slug: 'fundamentos', titulo: 'Fundamentos de IA', resumo: 'Base prática.' }],
  aulas: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      titulo: 'Descoberta comercial',
      formacaoSlug: 'fundamentos',
      formacaoTitulo: 'Fundamentos de IA',
    },
  ],
  ferramentas: [
    {
      chave: 'sdr-ia:OpenAI',
      titulo: 'OpenAI',
      projetoSlug: 'sdr-ia',
      projetoTitulo: 'SDR com IA',
    },
  ],
  foco: null,
});

describe('recomendações de conteúdo do Sobral AI', () => {
  it('resolve somente conteúdos reais em caminhos internos', () => {
    const cartoes = resolverRecomendacoes(
      [
        {
          tipo: 'aula',
          chave: '11111111-1111-4111-8111-111111111111',
          motivo: 'Ajuda a preparar as perguntas da primeira reunião.',
        },
        {
          tipo: 'ferramenta',
          chave: 'sdr-ia:OpenAI',
          motivo: 'É a ferramenta usada no projeto recomendado para esta tarefa.',
        },
        {
          tipo: 'projeto',
          chave: 'projeto-inexistente',
          motivo: 'Este conteúdo não existe e precisa ser ignorado.',
        },
      ],
      sinais,
    );

    expect(cartoes).toHaveLength(2);
    expect(cartoes[0]).toMatchObject({
      tipo: 'aula',
      href: '/formacoes/fundamentos/aula/11111111-1111-4111-8111-111111111111',
    });
    expect(cartoes[1]).toMatchObject({
      tipo: 'ferramenta',
      href: '/solucoes/sdr-ia',
    });
  });

  it('remove recomendações repetidas e respeita o limite visual', () => {
    const cartoes = resolverRecomendacoes(
      Array.from({ length: 5 }, () => ({
        tipo: 'projeto' as const,
        chave: 'sdr-ia',
        motivo: 'O projeto mostra o passo a passo necessário para esta tarefa.',
      })),
      sinais,
    );

    expect(cartoes).toHaveLength(1);
  });
});
