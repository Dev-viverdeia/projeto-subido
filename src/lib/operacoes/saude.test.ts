import { describe, expect, it } from 'vitest';
import { avaliarSaudeOperacional, type ResumoEscalaOperacional } from './saude';

const base: ResumoEscalaOperacional = {
  pendentes: 0,
  processando: 1,
  concluidas: 20,
  falhas: 0,
  retomadas: 0,
  espera_maxima_segundos: 0,
  latencia_p95_segundos: 120,
  taxa_sucesso: 1,
  chamadas_provedores: 30,
  falhas_provedores: 0,
  latencia_p95_provedor_ms: 11_000,
  custo_usd_micros: 25_000,
  limite_fila_segundos: 300,
  limite_taxa_falha: 0.1,
  limite_custo_usd_micros: 50_000_000,
  capacidade_prospeccao: 8,
  capacidade_pos_call: 12,
};

describe('avaliarSaudeOperacional', () => {
  it('mantém a operação saudável abaixo dos limites', () => {
    expect(avaliarSaudeOperacional(base)).toMatchObject({
      nivel: 'saudavel',
      alertas: [],
      capacidadeTotal: 20,
    });
  });

  it('evidencia uma fila acima do limite sem misturar outras causas', () => {
    const resultado = avaliarSaudeOperacional({ ...base, espera_maxima_segundos: 360 });
    expect(resultado.nivel).toBe('atencao');
    expect(resultado.alertas).toHaveLength(1);
    expect(resultado.alertas[0]).toMatchObject({ id: 'fila', nivel: 'atencao' });
  });

  it('torna crítica uma taxa de falha duas vezes maior que o limite', () => {
    const resultado = avaliarSaudeOperacional({ ...base, taxa_sucesso: 0.79 });
    expect(resultado.nivel).toBe('critico');
    expect(resultado.alertas.some((alerta) => alerta.id === 'falhas')).toBe(true);
  });

  it('calcula falha de provedor somente quando há chamadas', () => {
    expect(
      avaliarSaudeOperacional({ ...base, chamadas_provedores: 0, falhas_provedores: 4 }),
    ).toMatchObject({ taxaFalhaProvedores: 0, nivel: 'saudavel' });
  });
});
