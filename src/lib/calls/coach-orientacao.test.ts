import { describe, expect, it } from 'vitest';
import { orientacaoVigente, revisarOrientacao } from './coach-orientacao';
import { RespostaCoachSchema, type RespostaCoach, type SegmentoLive } from './coach-schema';

const resposta: RespostaCoach = {
  intervir: true,
  categoria: 'impacto',
  prioridade: 2,
  titulo: 'Dimensionar a demora no atendimento',
  recomendacao: 'Quantos agendamentos vocês perdem quando a resposta demora duas horas?',
  metodologia: 'Conversa consultiva',
  trecho_gatilho: 'A resposta demora duas horas.',
  confianca: 0.9,
};
const segmento: SegmentoLive = {
  itemId: '1',
  texto: 'A resposta demora duas horas.',
  ordinal: 1,
  segundoReuniao: 1,
  finalizadoEm: '2026-09-06T12:00:00.000Z',
};

describe('curadoria de orientações ao vivo', () => {
  it('libera uma pergunta nova apoiada no que foi dito', () => {
    expect(revisarOrientacao(resposta, [segmento], []).intervir).toBe(true);
  });
  it.each([
    { trecho_gatilho: 'Perdemos 50 clientes por dia.' },
    { trecho_gatilho: 'A resposta' },
    { confianca: 0.74 },
    { intervir: false },
  ])('retém evidência inventada, curta demais ou incerta: %j', (ajuste) => {
    expect(revisarOrientacao({ ...resposta, ...ajuste }, [segmento], []).intervir).toBe(false);
  });
  it('não encontra evidência por juntar falas desconectadas', () => {
    expect(
      revisarOrientacao(
        { ...resposta, trecho_gatilho: 'duas horas Quantos clientes' },
        [segmento, { ...segmento, texto: 'Quantos clientes vocês atendem?' }],
        [],
      ).intervir,
    ).toBe(false);
  });
  it('tolera pontuação da transcrição sem inventar palavras', () => {
    expect(
      revisarOrientacao(
        { ...resposta, trecho_gatilho: 'a resposta demora duas horas' },
        [segmento],
        [],
      ).intervir,
    ).toBe(true);
  });
  it('bloqueia a mesma pergunta, inclusive pequenas reformulações', () => {
    const anteriores = [{ sugestao: resposta.recomendacao, trecho_gatilho: null }];
    expect(revisarOrientacao(resposta, [segmento], anteriores).intervir).toBe(false);
    expect(
      revisarOrientacao(
        {
          ...resposta,
          recomendacao: 'Quantos agendamentos vocês perdem se a resposta demora duas horas?',
        },
        [segmento],
        anteriores,
      ).intervir,
    ).toBe(false);
  });
  it('permite avançar para outro ponto do mesmo problema', () => {
    expect(
      revisarOrientacao(
        {
          ...resposta,
          recomendacao: 'Quem pode liberar uma amostra anonimizada dessas conversas?',
        },
        [segmento],
        [{ sugestao: resposta.recomendacao, trecho_gatilho: null }],
      ).intervir,
    ).toBe(true);
  });
  it('uma pergunta reformulada exige evidência nova, não o mesmo gatilho ampliado', () => {
    const fala = { ...segmento, texto: 'A resposta demora duas horas. É isso mesmo, duas horas.' };
    expect(
      revisarOrientacao(
        {
          ...resposta,
          recomendacao: 'Quantos pacientes acabam desistindo?',
          trecho_gatilho: fala.texto,
        },
        [fala],
        [{ sugestao: 'Como a demora afeta os agendamentos?', trecho_gatilho: segmento.texto }],
      ).intervir,
    ).toBe(false);
  });
  it('limita a pergunta e o motivo para leitura durante a conversa', () => {
    expect(
      RespostaCoachSchema.safeParse({ ...resposta, recomendacao: 'a'.repeat(221) }).success,
    ).toBe(false);
    expect(RespostaCoachSchema.safeParse({ ...resposta, titulo: 'a'.repeat(71) }).success).toBe(
      false,
    );
  });
  it('não resgata uma orientação descartada, expirada ou com data inválida', () => {
    const agora = Date.parse(segmento.finalizadoEm);
    expect(
      orientacaoVigente({ status: 'nova', criada_em: segmento.finalizadoEm }, agora),
    ).not.toBeNull();
    expect(
      orientacaoVigente({ status: 'nova', criada_em: segmento.finalizadoEm }, agora + 90_000),
    ).toBeNull();
    expect(
      orientacaoVigente({ status: 'dispensada', criada_em: segmento.finalizadoEm }, agora),
    ).toBeNull();
    expect(orientacaoVigente({ status: 'nova', criada_em: 'inválida' }, agora)).toBeNull();
  });
});
