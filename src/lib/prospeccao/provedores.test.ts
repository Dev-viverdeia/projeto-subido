import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ prospeccaoEnv: vi.fn() }));

import { prospeccaoEnv } from '@/lib/env';
import { prospectarEmpresas } from './provedores';

const busca = {
  segmento: 'Clínicas odontológicas',
  localizacao: 'Belo Horizonte, MG',
  quantidade: 5 as const,
};

describe('provedores da prospecção', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prospeccaoEnv).mockReturnValue({
      pronto: true,
      apifyToken: 'token-apify-valido',
      apifyActor: 'compass/crawler-google-places',
      serpApi: null,
      firecrawl: null,
      fullEnrich: null,
    });
  });

  it('faz uma busca completa apenas com Apify usando tipo e região', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            title: 'Clínica Aurora',
            categoryName: 'Clínica odontológica',
            address: 'Av. do Contorno, 1850',
            city: 'Belo Horizonte',
            state: 'MG',
            phone: '+55 31 3333-4444',
            phones: ['+55 31 3333-4444', '+55 31 98888-1111'],
            emails: ['contato@clinica-aurora.example.com'],
            instagrams: ['https://instagram.com/clinicaaurora'],
            openingHours: [{ day: 'segunda-feira', hours: '08:00–18:00' }],
            website: 'https://clinica-aurora.example.com',
            totalScore: 4.8,
            reviewsCount: 127,
            placeId: 'aurora-bh',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await prospectarEmpresas(busca);

    expect(resultado.leads).toHaveLength(1);
    expect(resultado.leads[0]).toMatchObject({
      nome: 'Clínica Aurora',
      cidade: 'Belo Horizonte',
      telefone: '+55 31 3333-4444',
      telefones: ['+55 31 3333-4444', '+55 31 98888-1111'],
      emails: ['contato@clinica-aurora.example.com'],
      redes_sociais: [{ rede: 'instagram', url: 'https://instagram.com/clinicaaurora' }],
      fontes: ['Google Maps · dados públicos'],
    });
    expect(resultado.leads[0]?.qualificacao.completude).toBe(75);
    expect(resultado.provedores).toEqual({
      apify: 'concluido',
      serpapi: 'nao_configurado',
      firecrawl: 'nao_configurado',
      fullenrich: 'nao_configurado',
    });

    const requisicao = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = requisicao[1].body;
    expect(typeof body).toBe('string');
    if (typeof body !== 'string') throw new Error('Corpo da busca deveria ser JSON.');
    const corpo = JSON.parse(body) as Record<string, unknown>;
    expect(corpo).toMatchObject({
      searchStringsArray: ['Clínicas odontológicas'],
      locationQuery: 'Belo Horizonte, MG',
      maxCrawledPlacesPerSearch: 5,
      scrapeContacts: true,
      scrapePlaceDetailPage: true,
    });
  });

  it('associa possíveis decisores profissionais e recalcula a completude', async () => {
    vi.mocked(prospeccaoEnv).mockReturnValue({
      pronto: true,
      apifyToken: 'token-apify-valido',
      apifyActor: 'compass/crawler-google-places',
      serpApi: null,
      firecrawl: null,
      fullEnrich: 'token-fullenrich-valido',
    });
    const fetchMock = vi.fn().mockImplementation((url: string | URL) => {
      if (String(url).includes('fullenrich.com')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              people: [
                {
                  full_name: 'Ana Aurora',
                  headline: 'Fundadora',
                  location: { city: 'Belo Horizonte', region: 'MG', country: 'Brasil' },
                  social_profiles: {
                    professional_network: { url: 'https://linkedin.com/in/ana-aurora' },
                  },
                  employment: {
                    current: {
                      title: 'Fundadora e diretora',
                      seniority: 'Founder',
                      company: {
                        name: 'Clínica Aurora',
                        domain: 'clinica-aurora.example.com',
                        industry: 'Hospitais e saúde',
                      },
                    },
                  },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify([
            {
              title: 'Clínica Aurora',
              website: 'https://clinica-aurora.example.com',
              phone: '+55 31 3333-4444',
              emails: ['contato@clinica-aurora.example.com'],
              instagrams: ['https://instagram.com/clinicaaurora'],
              placeId: 'aurora-bh',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await prospectarEmpresas(busca);

    expect(resultado.leads[0]).toMatchObject({
      decisores: [
        {
          nome: 'Ana Aurora',
          cargo: 'Fundadora e diretora',
          senioridade: 'Founder',
          linkedin_url: 'https://linkedin.com/in/ana-aurora',
          localizacao: 'Belo Horizonte, MG, Brasil',
          email: null,
          telefone: null,
          fonte: 'FullEnrich · perfil profissional público',
        },
      ],
    });
    expect(resultado.leads[0]?.qualificacao.completude).toBe(100);
    expect(resultado.provedores.fullenrich).toBe('concluido');
  });

  it('falha a lista quando o único motor disponível não responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    await expect(prospectarEmpresas(busca)).rejects.toThrow('provedores_descoberta_indisponiveis');
  });
});
