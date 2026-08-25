import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({
  prospeccaoEnv: () => ({
    pronto: true,
    apifyToken: null,
    apifyActor: 'compass/crawler-google-places',
    serpApi: null,
    firecrawl: null,
    fullEnrich: 'token-fullenrich-valido',
    fullEnrichWebhook: null,
    hunter: null,
  }),
}));

import { prospectarEmpresas } from './provedores';

function respostaJson(valor: unknown) {
  return new Response(JSON.stringify(valor), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('descoberta profissional da prospecção', () => {
  it('descobre a empresa e o decisor pelo FullEnrich como único motor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string | URL) => {
        if (String(url).endsWith('/company/search')) {
          return Promise.resolve(
            respostaJson({
              companies: [
                {
                  id: 'empresa-aurora',
                  name: 'Clínica Aurora',
                  domain: 'clinica-aurora.example.com',
                  industry: { main_industry: 'Hospitais e saúde' },
                  locations: { headquarters: { city: 'Belo Horizonte', region: 'MG' } },
                  social_profiles: {
                    professional_network: {
                      url: 'https://linkedin.com/company/clinica-aurora',
                    },
                  },
                },
              ],
            }),
          );
        }
        if (String(url).endsWith('/people/search')) {
          return Promise.resolve(
            respostaJson({
              people: [
                {
                  full_name: 'Ana Aurora',
                  social_profiles: {
                    professional_network: { url: 'https://linkedin.com/in/ana-aurora' },
                  },
                  employment: {
                    current: {
                      title: 'Fundadora',
                      seniority: 'Founder',
                      company: {
                        name: 'Clínica Aurora',
                        domain: 'clinica-aurora.example.com',
                      },
                    },
                  },
                },
              ],
            }),
          );
        }
        throw new Error(`URL inesperada: ${String(url)}`);
      }),
    );

    const resultado = await prospectarEmpresas({
      segmento: 'Clínicas odontológicas',
      localizacao: 'Belo Horizonte, MG',
      quantidade: 5,
    });

    expect(resultado.leads[0]).toMatchObject({
      nome: 'Clínica Aurora',
      cidade: 'Belo Horizonte',
      categoria: 'Hospitais e saúde',
      decisores: [{ nome: 'Ana Aurora', cargo: 'Fundadora' }],
      qualificacao: {
        oportunidade: { projeto_titulo: 'SDR de Atendimento e Qualificação' },
      },
    });
    expect(resultado.provedores.fullenrich_busca).toBe('concluido');
    expect(resultado.provedores.fullenrich).toBe('concluido');
  });
});
