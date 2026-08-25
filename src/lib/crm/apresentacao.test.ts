import { describe, expect, it } from 'vitest';
import { acaoParaFicha, resumoParaFicha, valorFatoParaFicha } from './apresentacao';

describe('apresentação da ficha enriquecida', () => {
  it('remove identificadores e traduz o registro técnico da oportunidade', () => {
    expect(
      valorFatoParaFicha(
        "ID a0e64e9e-cf56-45bb-9d9a-786f034478d0; título 'SDR de atendimento'; etapa 'novo_lead'; origem 'manual'; criado_em 2026-08-25T20:42:32.263885+00:00",
      ),
    ).toBe('Projeto em negociação: SDR de atendimento. Ficha criada em 25 de agosto de 2026.');
  });

  it('deixa a próxima ação curta sem perder o verbo principal', () => {
    expect(
      acaoParaFicha(
        'Enviar email para Mariana propondo reunião de 30 minutos: confirmar canais, volume e decisores.',
      ),
    ).toBe('Enviar email para Mariana propondo reunião de 30 minutos.');
  });

  it('limita resumos legados muito longos', () => {
    expect(resumoParaFicha('Contexto '.repeat(80)).length).toBeLessThanOrEqual(261);
  });

  it('remove hora técnica de fatos comerciais', () => {
    expect(
      valorFatoParaFicha(
        "Proposta 'Nina — SDR de Atendimento e Qualificação' apresentada em 25/08/2026 20:54:59 UTC (status: apresentada)",
      ),
    ).toBe(
      "Proposta 'Nina — SDR de Atendimento e Qualificação' apresentada em 25 de agosto de 2026",
    );
  });
});
