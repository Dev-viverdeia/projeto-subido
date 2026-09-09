import { describe, it, expect } from 'vitest';
import { atendimentoExemplo } from '@/components/operacoes/fixture';
import { avaliarAtendimento, ResumoAtendimentoSchema } from './atendimento';
describe('saúde do atendimento', () => {
  it('não apresenta indisponibilidade como zero ou sucesso', () => {
    expect(avaliarAtendimento(null).nivel).toBe('desconhecido');
    expect(ResumoAtendimentoSchema.safeParse({}).success).toBe(false);
  });
  it('fila com trabalho recente não é tratada como problema', () => {
    expect(avaliarAtendimento(atendimentoExemplo()).nivel).toBe('normal');
  });
  it('pulso ausente não confirma funcionamento do cron', () => {
    const r = atendimentoExemplo();
    r.pulsos = [];
    expect(avaliarAtendimento(r)).toMatchObject({
      nivel: 'desconhecido',
      entrada: 'desconhecido',
      saida: 'desconhecido',
    });
  });
  it.each([
    [299, 'normal'],
    [300, 'atencao'],
    [600, 'critico'],
  ])('pulso com %s segundos resulta em %s', (idade, nivel) => {
    const r = atendimentoExemplo();
    r.pulsos[0]!.conferido_em = new Date(
      Date.parse(r.verificado_em) - Number(idade) * 1000,
    ).toISOString();
    expect(avaliarAtendimento(r).entrada).toBe(nivel);
  });
  it('três falhas seguidas exigem ação mesmo com pulso recente', () => {
    const r = atendimentoExemplo();
    r.pulsos[2]!.falhou = true;
    r.pulsos[2]!.falhas_seguidas = 3;
    expect(avaliarAtendimento(r).nivel).toBe('critico');
  });
  it('respostas expiradas e fila atrasada não desaparecem nos totais', () => {
    const r = atendimentoExemplo();
    r.ia.expiradas = 1;
    r.saida.atrasadas = 1;
    expect(avaliarAtendimento(r)).toMatchObject({ ia: 'critico', saida: 'critico' });
  });
  it('um envio aceito ainda sem recibo não é contado como falha', () => {
    const r = atendimentoExemplo();
    r.saida.aceitas = 50;
    expect(avaliarAtendimento(r).saida).toBe('normal');
    r.saida.sem_confirmacao = 1;
    expect(avaliarAtendimento(r).saida).toBe('atencao');
  });
});
