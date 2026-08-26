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
    gatewayPerplexityAtiva: false,
  }),
}));

import { buscarSerpApi } from './descoberta';
import { prospectarEmpresas } from './provedores';

function respostaJson(valor: unknown) {
  return new Response(JSON.stringify(valor), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('descoberta híbrida da prospecção', () => {
  it('usa SerpAPI como radar e Apify como aprofundamento no mesmo lote', async () => {
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
    expect(resultado.custos.map((uso) => uso.provedor)).toEqual(['serpapi', 'apify']);
  });

  it('distribui a página inicial da SerpAPI sem aumentar o número de requisições', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson({
        local_results: [
          {
            title: 'Clínica Horizonte',
            place_id: 'horizonte-serp',
            phone: '+55 31 3000-4000',
            operating_hours: { monday: '08:00–18:00' },
            gps_coordinates: { latitude: -19.9, longitude: -43.9 },
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await buscarSerpApi(
      {
        segmento: 'Clínicas odontológicas',
        localizacao: 'Belo Horizonte, MG',
        quantidade: 15,
        deslocamentoInicial: 40,
      },
      'token-serpapi-valido',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const endereco = String(fetchMock.mock.calls[0]?.[0]);
    expect(endereco).toContain('start=40');
    expect(endereco).toContain('q=Cl%C3%ADnicas+odontol%C3%B3gicas+em+Belo+Horizonte%2C+MG');
    expect(endereco).not.toContain('location=');
    expect(resultado.uso).toMatchObject({
      provedor: 'serpapi',
      unidades: 1,
      metadados: { resultados: 1, paginas: [40] },
    });
    expect(resultado.leads[0]).toMatchObject({
      nome: 'Clínica Horizonte',
      horarios: [{ dia: 'monday', horarios: '08:00–18:00' }],
      maps_url:
        'https://www.google.com/maps/search/?api=1&query=Cl%C3%ADnica+Horizonte&query_place_id=horizonte-serp',
      dados: { localizacao: { latitude: -19.9, longitude: -43.9 } },
    });
  });

  it('aproveita páginas válidas quando uma página da SerpAPI falha', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string | URL) => {
      if (String(url).includes('start=20')) {
        return Promise.resolve(new Response('{}', { status: 503 }));
      }
      return Promise.resolve(
        respostaJson({
          local_results: [
            { title: 'Clínica Resiliente', place_id: 'resiliente', phone: '+55 31 3111-2222' },
          ],
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await buscarSerpApi(
      {
        segmento: 'Clínicas odontológicas',
        localizacao: 'Belo Horizonte, MG',
        quantidade: 25,
      },
      'token-serpapi-valido',
    );

    expect(resultado.leads.map((lead) => lead.nome)).toEqual(['Clínica Resiliente']);
    expect(resultado.uso).toMatchObject({
      status: 'parcial',
      unidades: 1,
      metadados: { paginas: [0], paginas_com_falha: [20] },
    });
  });
});
