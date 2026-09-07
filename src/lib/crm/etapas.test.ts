import { describe, expect, it } from 'vitest';
import {
  ETAPAS_MOVIMENTO_CRM,
  FASES_CRM,
  etapaVisivel,
  faseDaEtapa,
  rotuloMotivoPerda,
} from './etapas';

describe('etapas do CRM', () => {
  it('separa quatro etapas do quadro e o histórico de perdas', () => {
    expect(FASES_CRM.map((fase) => fase.id)).toEqual([
      'entrada',
      'conversa',
      'proposta',
      'ganho',
      'desfecho',
    ]);
    expect(faseDaEtapa('qualificacao')).toBe('entrada');
    expect(faseDaEtapa('negociacao')).toBe('proposta');
    expect(faseDaEtapa('ganho')).toBe('ganho');
    expect(faseDaEtapa('perdido')).toBe('desfecho');
    expect(FASES_CRM.map((fase) => fase.rotulo)).toEqual([
      'Preparar',
      'Descobrir',
      'Propor',
      'Ganho',
      'Desfecho',
    ]);
  });

  it('oferece apenas decisões comerciais úteis ao mover um card', () => {
    expect(ETAPAS_MOVIMENTO_CRM.map((etapa) => etapa.id)).toEqual([
      'novo_lead',
      'descoberta',
      'proposta',
      'ganho',
      'perdido',
    ]);
    expect(etapaVisivel('qualificacao')).toBe('novo_lead');
    expect(etapaVisivel('negociacao')).toBe('proposta');
  });

  it('traduz o motivo persistido para uma explicação humana', () => {
    expect(rotuloMotivoPerda('sem_orcamento')).toBe('Sem orçamento disponível');
    expect(rotuloMotivoPerda('nao_informado')).toBe('Motivo não informado');
    expect(rotuloMotivoPerda('proposta_recusada')).toBe('Proposta recusada pelo cliente');
  });
});
