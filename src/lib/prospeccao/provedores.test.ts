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

function respostaJson(valor: unknown, status = 200) {
  return new Response(JSON.stringify(valor), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function inicioApify() {
  return respostaJson({
    data: { id: 'execucao-apify', defaultDatasetId: 'dataset-apify', status: 'SUCCEEDED' },
  });
}

function urlApify(url: string | URL) {
  return String(url).includes('api.apify.com/v2/acts/');
}

function urlDataset(url: string | URL) {
  return String(url).includes('api.apify.com/v2/datasets/');
}

describe('provedores da prospecção', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prospeccaoEnv).mockReturnValue({
      pronto: true,
      apifyToken: 'token-apify-valido',
      apifyActor: 'compass/crawler-google-places',
      serpApi: null,
      firecrawl: null,
      perplexity: null,
      gateway: null,
      gatewayPerplexityAtiva: false,
    });
  });

  it('faz uma busca completa apenas com Apify usando tipo e região', async () => {
    const itens = [
      {
        title: 'Clínica Aurora',
        categoryName: 'Clínica odontológica',
        address: 'Av. do Contorno, 1850',
        city: 'Belo Horizonte',
        state: 'MG',
        phone: '+55 31 3333-4444',
        phones: ['+55 31 3333-4444', '+55 31 98888-1111'],
        emails: ['contato@clinica-aurora.example.com'],
        instagram: 'https://instagram.com/clinicaaurora',
        instagrams: [
          'https://instagram.com/clinicaaurora',
          'https://instagram.com/reel/publicacao-duplicada',
        ],
        linkedIns: ['https://linkedin.com/company/clinica-aurora'],
        socialProfiles: [
          { url: 'https://youtube.com/watch?v=nao-e-perfil' },
          { url: 'https://youtube.com/@clinicaaurora' },
        ],
        openingHours: [{ day: 'segunda-feira', hours: '08:00–18:00' }],
        website: 'https://clinica-aurora.example.com',
        totalScore: 4.8,
        reviewsCount: 127,
        placeId: 'aurora-bh',
      },
    ];
    const fetchMock = vi.fn().mockImplementation((url: string | URL) => {
      if (urlApify(url)) return Promise.resolve(inicioApify());
      if (urlDataset(url)) return Promise.resolve(respostaJson(itens));
      throw new Error(`URL inesperada: ${String(url)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await prospectarEmpresas(busca);

    expect(resultado.leads).toHaveLength(1);
    expect(resultado.leads[0]).toMatchObject({
      nome: 'Clínica Aurora',
      cidade: 'Belo Horizonte',
      telefone: '+55 31 3333-4444',
      telefones: ['+55 31 3333-4444', '+55 31 98888-1111'],
      emails: ['contato@clinica-aurora.example.com'],
      redes_sociais: [
        { rede: 'instagram', url: 'https://instagram.com/clinicaaurora' },
        { rede: 'linkedin', url: 'https://linkedin.com/company/clinica-aurora' },
        { rede: 'youtube', url: 'https://youtube.com/@clinicaaurora' },
      ],
      fontes: ['Google Maps · dados públicos'],
    });
    expect(resultado.leads[0]?.qualificacao.completude).toBe(75);
    expect(resultado.provedores).toEqual({
      apify: 'concluido',
      serpapi: 'nao_configurado',
      firecrawl: 'nao_configurado',
      perplexity: 'nao_configurado',
      inteligencia: 'regras',
    });

    const requisicao = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = requisicao[1].body;
    expect(typeof body).toBe('string');
    if (typeof body !== 'string') throw new Error('Corpo da busca deveria ser JSON.');
    const corpo = JSON.parse(body) as Record<string, unknown>;
    expect(corpo).toMatchObject({
      searchStringsArray: ['Clínicas odontológicas'],
      locationQuery: 'Belo Horizonte, MG',
      maxCrawledPlacesPerSearch: 15,
      scrapeContacts: true,
      scrapePlaceDetailPage: true,
    });
  });

  it('descobre mais opções e entrega somente empresas com contato direto', async () => {
    const itens = [
      { title: 'Sem Contato', placeId: 'sem-contato' },
      { title: 'Com Telefone', placeId: 'com-telefone', phone: '+55 31 3222-1111' },
    ];
    const fetchMock = vi.fn().mockImplementation((url: string | URL) => {
      if (urlApify(url)) return Promise.resolve(inicioApify());
      if (urlDataset(url)) return Promise.resolve(respostaJson(itens));
      throw new Error(`URL inesperada: ${String(url)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await prospectarEmpresas(busca);

    expect(resultado.leads.map((lead) => lead.nome)).toEqual(['Com Telefone']);
  });

  it('trata contatos do site oficial e guarda a origem de cada dado', async () => {
    vi.mocked(prospeccaoEnv).mockReturnValue({
      pronto: true,
      apifyToken: 'token-apify-valido',
      apifyActor: 'compass/crawler-google-places',
      serpApi: null,
      firecrawl: 'token-firecrawl-valido',
      perplexity: null,
      gateway: null,
      gatewayPerplexityAtiva: false,
    });
    const fetchMock = vi.fn().mockImplementation((url: string | URL) => {
      if (urlApify(url)) return Promise.resolve(inicioApify());
      if (urlDataset(url)) {
        return Promise.resolve(
          respostaJson([
            {
              title: 'Clínica Aurora',
              website: 'https://clinica-aurora.example.com',
              placeId: 'aurora-bh',
            },
          ]),
        );
      }
      if (String(url).includes('firecrawl.dev')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                markdown: 'Fale conosco: comercial@aurora.example.com ou (31) 98888-1111.',
                links: [
                  'mailto:comercial@aurora.example.com',
                  'tel:+553133334444',
                  'https://wa.me/5531988881111',
                  'https://instagram.com/clinicaaurora',
                  'https://linkedin.com/company/clinica-aurora',
                ],
                metadata: { title: 'Clínica Aurora' },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      throw new Error(`URL inesperada: ${String(url)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await prospectarEmpresas(busca);

    expect(resultado.leads[0]).toMatchObject({
      telefone: '+553133334444',
      emails: ['comercial@aurora.example.com'],
      redes_sociais: [
        { rede: 'instagram', url: 'https://instagram.com/clinicaaurora' },
        { rede: 'linkedin', url: 'https://linkedin.com/company/clinica-aurora' },
      ],
      dados: {
        site_contatos: {
          emails: ['comercial@aurora.example.com'],
        },
      },
    });
    expect(resultado.leads[0]?.fontes).toContain('Site oficial · conteúdo público');
    expect(resultado.provedores.firecrawl).toBe('concluido');
  });

  it('identifica possível decisor com fonte sem inventar e-mail ou telefone', async () => {
    vi.mocked(prospeccaoEnv).mockReturnValue({
      pronto: true,
      apifyToken: 'token-apify-valido',
      apifyActor: 'compass/crawler-google-places',
      serpApi: null,
      firecrawl: null,
      perplexity: 'token-perplexity-valido',
      gateway: null,
      gatewayPerplexityAtiva: false,
    });
    const fetchMock = vi.fn().mockImplementation((url: string | URL) => {
      if (urlApify(url)) return Promise.resolve(inicioApify());
      if (urlDataset(url)) {
        return Promise.resolve(
          respostaJson([
            {
              title: 'Clínica Aurora',
              website: 'https://clinica-aurora.example.com',
              phone: '+55 31 3333-4444',
              emails: ['contato@clinica-aurora.example.com'],
              instagrams: ['https://instagram.com/clinicaaurora'],
              placeId: 'aurora-bh',
            },
          ]),
        );
      }
      if (String(url).includes('perplexity.ai/search')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              results: [
                {
                  title: 'Ana Aurora - Fundadora da Clínica Aurora',
                  url: 'https://linkedin.com/in/ana-aurora',
                  snippet: 'Ana Aurora é fundadora e diretora da Clínica Aurora em Belo Horizonte.',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      throw new Error(`URL inesperada: ${String(url)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await prospectarEmpresas(busca);

    expect(resultado.leads[0]?.decisores).toEqual([
      {
        nome: 'Ana Aurora',
        cargo: 'Fundadora',
        senioridade: null,
        linkedin_url: 'https://linkedin.com/in/ana-aurora',
        localizacao: null,
        email: null,
        telefone: null,
        fonte: 'Pesquisa pública · LinkedIn',
      },
    ]);
    expect(resultado.leads[0]?.dados.pesquisa_decisores).toEqual([
      {
        titulo: 'Ana Aurora - Fundadora da Clínica Aurora',
        url: 'https://linkedin.com/in/ana-aurora',
        trecho: 'Ana Aurora é fundadora e diretora da Clínica Aurora em Belo Horizonte.',
        data: null,
      },
    ]);
    expect(resultado.provedores.perplexity).toBe('concluido');
  });

  it('não trata WhatsApp como site nem aceita decisores de outra empresa', async () => {
    vi.mocked(prospeccaoEnv).mockReturnValue({
      pronto: true,
      apifyToken: 'token-apify-valido',
      apifyActor: 'compass/crawler-google-places',
      serpApi: null,
      firecrawl: null,
      perplexity: 'token-perplexity-valido',
      gateway: null,
      gatewayPerplexityAtiva: false,
    });
    const fetchMock = vi.fn().mockImplementation((url: string | URL) => {
      if (urlApify(url)) return Promise.resolve(inicioApify());
      if (urlDataset(url)) {
        return Promise.resolve(
          respostaJson([
            {
              title: 'Odontologia Especializada LG',
              website: 'https://api.whatsapp.com/send?phone=553134348698',
              url: 'https://www.google.com/maps/place/odontologia-lg',
              phone: '+55 31 3434-8698',
              placeId: 'odontologia-lg',
            },
          ]),
        );
      }
      if (String(url).includes('perplexity.ai/search')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              results: [
                {
                  title: 'Executiva da WhatsApp',
                  url: 'https://linkedin.com/in/executiva-whatsapp',
                  snippet: 'Diretora da WhatsApp.',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      throw new Error(`URL inesperada: ${String(url)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await prospectarEmpresas(busca);

    expect(resultado.leads[0]).toMatchObject({
      site_url: null,
      dominio: null,
      decisores: [],
    });
  });

  it('falha a lista quando o único motor disponível não responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    await expect(prospectarEmpresas(busca)).rejects.toThrow('provedores_descoberta_indisponiveis');
  });
});
