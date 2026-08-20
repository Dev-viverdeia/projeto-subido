import { describe, expect, it } from 'vitest';
import {
  criarRecomendacaoFallback,
  prazoDaRecomendacao,
  resolverFatosUsados,
  SaidaRecomendacaoModeloSchema,
  type ContextoRecomendacao,
} from './recomendacao';

const contexto: ContextoRecomendacao = {
  momento: '2026-08-10T18:00:00.000Z',
  oportunidadeId: '11111111-1111-4111-8111-111111111111',
  empresa: 'Clínica Aurora',
  titulo: 'Projeto de atendimento',
  etapa: 'negociacao',
  fatos: [
    { id: 1, fonte: 'CRM', texto: 'A oportunidade ficou sem próxima ação.' },
    { id: 2, fonte: 'Call', texto: 'A diretora fará a validação final.' },
    { id: 3, fonte: 'Proposta', texto: 'A proposta está apresentada.' },
  ],
  proximoPassoDaCall: null,
  propostaMaisRecente: 'apresentada',
  callFutura: null,
};

describe('recomendação factual do Sobral AI', () => {
  it('converte o prazo do modelo em meio-dia no Brasil sem perder a data', () => {
    expect(prazoDaRecomendacao(contexto.momento, 3)).toBe('2026-08-13T12:00:00-03:00');
    expect(prazoDaRecomendacao(contexto.momento, null)).toBeNull();
  });

  it('só expõe fatos que realmente existem no contexto', () => {
    expect(resolverFatosUsados(contexto.fatos, [2, 99, 2])).toEqual([
      'Reunião · A diretora fará a validação final.',
    ]);
  });

  it('usa a proposta apresentada como fallback quando o modelo não responde', () => {
    const recomendacao = criarRecomendacaoFallback(contexto);

    expect(recomendacao.acao).toBe('Agendar uma conversa de decisão sobre a proposta');
    expect(recomendacao.modelo).toBe('regra-factual-v2');
    expect(recomendacao.tokens).toBe(0);
  });

  it('prioriza o compromisso explícito detectado na call', () => {
    const recomendacao = criarRecomendacaoFallback({
      ...contexto,
      proximoPassoDaCall: 'Enviar o escopo revisado para a diretora',
    });

    expect(recomendacao.acao).toBe('Enviar o escopo revisado para a diretora');
  });

  it('rejeita uma saída do modelo sem evidência numerada', () => {
    expect(
      SaidaRecomendacaoModeloSchema.safeParse({
        acao: 'Agendar conversa de decisão',
        motivo: 'A proposta está apresentada e precisa de uma decisão explícita do cliente.',
        fatos_utilizados: [],
        prazo_em_dias: 2,
      }).success,
    ).toBe(false);
  });
});
