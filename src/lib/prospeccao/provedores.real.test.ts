import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { prospectarEmpresas } from './provedores';

const executar = process.env.RUN_REAL_PROVIDER_TESTS === '1';

describe.runIf(executar)('provedores reais da prospecção', () => {
  it('combina o radar da SerpAPI com o aprofundamento do Apify', async () => {
    const resultado = await prospectarEmpresas({
      segmento: 'clínica odontológica',
      localizacao: 'Belo Horizonte, MG',
      quantidade: 5,
    });

    expect(resultado.leads.length).toBeGreaterThan(0);
    expect(resultado.provedores.serpapi).toBe('concluido');
    expect(resultado.provedores.apify).toBe('concluido');
    expect(resultado.custos.map((uso) => uso.provedor)).toEqual(
      expect.arrayContaining(['serpapi', 'apify']),
    );
    expect(resultado.leads.some((lead) => lead.telefones.length > 0)).toBe(true);
  }, 60_000);
});
