import { describe, expect, it } from 'vitest';
import {
  AnaliseCallSchema,
  LoteSegmentosSchema,
  mesclarSegmentos,
  textoDaTranscricao,
  type SegmentoLive,
} from './coach-schema';

function segmento(parcial: Partial<SegmentoLive> = {}): SegmentoLive {
  return {
    itemId: 'item-1',
    texto: 'O atendimento demora duas horas.',
    ordinal: 0,
    segundoReuniao: 12,
    finalizadoEm: '2026-08-08T18:00:00.000Z',
    ...parcial,
  };
}

describe('memória do Live Coach', () => {
  it('mescla por item e mantém a ordem original da conversa', () => {
    const resultado = mesclarSegmentos(
      [segmento(), segmento({ itemId: 'item-3', texto: 'Terceiro.', ordinal: 2 })],
      [
        segmento({ itemId: 'item-2', texto: 'Segundo.', ordinal: 1 }),
        segmento({ itemId: 'item-1', texto: 'Primeiro revisado.' }),
      ],
    );

    expect(resultado.map((item) => item.itemId)).toEqual(['item-1', 'item-2', 'item-3']);
    expect(resultado[0]!.texto).toBe('Primeiro revisado.');
    expect(textoDaTranscricao(resultado)).toBe('Primeiro revisado.\nSegundo.\nTerceiro.');
  });

  it('rejeita lotes grandes antes de atingir o modelo ou o banco', () => {
    const muitoGrande = Array.from({ length: 24 }, (_, indice) =>
      segmento({ itemId: `item-${indice}`, texto: 'a'.repeat(1_100), ordinal: indice }),
    );

    expect(LoteSegmentosSchema.safeParse({ segmentos: muitoGrande }).success).toBe(false);
  });

  it('rejeita identificadores vazios e tempos negativos', () => {
    const resultado = LoteSegmentosSchema.safeParse({
      segmentos: [segmento({ itemId: '', segundoReuniao: -1 })],
    });

    expect(resultado.success).toBe(false);
  });

  it('obriga a análise a separar decisões, lacunas e sinais de avanço', () => {
    const resultado = AnaliseCallSchema.safeParse({
      resumo: 'A empresa confirmou o problema, mas ainda precisa validar o responsável interno.',
      dores: ['As mensagens se perdem durante a troca de turno.'],
      objecoes: [],
      decisoes: ['O primeiro escopo ficará restrito ao WhatsApp.'],
      compromissos: ['Marina enviará o fluxo atual até sexta-feira.'],
      proximos_passos: ['Revisar o fluxo enviado e marcar a apresentação do diagnóstico.'],
      oportunidades_projeto: ['Hipótese: projeto de triagem e registro do atendimento.'],
      lacunas: ['Quem aprova o orçamento final?'],
      sinais_compra: ['A diretora pediu uma proposta com cronograma.'],
      sentimento: 'cauteloso',
      nota_comercial: 72,
    });

    expect(resultado.success).toBe(true);
  });
});
