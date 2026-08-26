import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({
  prospeccaoEnv: () => ({
    pronto: true,
    apifyToken: 'token-apify-valido',
    apifyActor: 'compass/crawler-google-places',
    serpApi: 'token-serpapi-valido',
    firecrawl: null,
    perplexity: null,
    gateway: null,
  }),
}));

import { prospectarEmpresas } from './provedores';

function respostaJson(valor: unknown) {
  return new Response(JSON.stringify(valor), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('waterfall de descoberta da prospecção', () => {
  it('consulta a SerpAPI somente quando o Apify não cobre o lote', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string | URL) => {
      const endereco = String(url);
      if (endereco.includes('api.apify.com/v2/acts/')) {
        return Promise.resolve(
          respostaJson({
            data: { id: 'run-vazio', defaultDatasetId: 'dataset-vazio', status: 'SUCCEEDED' },
          }),
        );
      }
      if (endereco.includes('api.apify.com/v2/datasets/')) {
        return Promise.resolve(respostaJson([]));
      }
      if (endereco.includes('serpapi.com/search.json')) {
        return Promise.resolve(
          respostaJson({
            local_results: [
              {
                title: 'Clínica Aurora',
                type: 'Clínica odontológica',
                address: 'Belo Horizonte, MG',
                phone: '+55 31 3333-4444',
                place_id: 'aurora-serp',
              },
            ],
          }),
        );
      }
      throw new Error(`URL inesperada: ${endereco}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await prospectarEmpresas({
      segmento: 'Clínicas odontológicas',
      localizacao: 'Belo Horizonte, MG',
      quantidade: 5,
    });

    expect(resultado.leads[0]).toMatchObject({
      nome: 'Clínica Aurora',
      telefone: '+55 31 3333-4444',
    });
    expect(resultado.provedores).toMatchObject({
      apify: 'concluido',
      serpapi: 'concluido',
    });
    expect(resultado.custos.map((uso) => uso.provedor)).toEqual(['apify', 'serpapi']);
  });
});
