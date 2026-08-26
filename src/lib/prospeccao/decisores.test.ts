import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { pesquisarPossiveisDecisores } from './decisores';
import { origemApify } from './normalizacao';

describe('pesquisa de decisores', () => {
  it('usa a SerpAPI como contingência e preserva a empresa de cada resultado', async () => {
    const lead = origemApify({
      title: 'Clínica Aurora',
      city: 'Belo Horizonte',
      state: 'MG',
      phone: '+55 31 3333-4444',
      placeId: 'clinica-aurora',
    });
    if (!lead) throw new Error('fixture inválida');

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          organic_results: [
            {
              title: 'Ana Aurora - Fundadora da Clínica Aurora',
              link: 'https://www.linkedin.com/in/ana-aurora',
              snippet: 'Ana Aurora é fundadora e diretora da Clínica Aurora em Belo Horizonte.',
            },
            {
              title: 'Diretor de outra empresa',
              link: 'https://www.linkedin.com/in/outra-pessoa',
              snippet: 'Atua em uma empresa de tecnologia em São Paulo.',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await pesquisarPossiveisDecisores([lead], {
      firecrawl: null,
      perplexity: null,
      serpApi: 'serpapi-valida',
      usarPerplexity: false,
      gateway: null,
    });

    expect(resultado.leads[0]?.dados.pesquisa_decisores).toEqual([
      {
        titulo: 'Ana Aurora - Fundadora da Clínica Aurora',
        url: 'https://www.linkedin.com/in/ana-aurora',
        trecho: 'Ana Aurora é fundadora e diretora da Clínica Aurora em Belo Horizonte.',
        data: null,
      },
    ]);
    expect(resultado.leads[0]?.decisores).toEqual([
      {
        nome: 'Ana Aurora',
        cargo: 'Fundadora',
        senioridade: null,
        linkedin_url: 'https://www.linkedin.com/in/ana-aurora',
        localizacao: 'Belo Horizonte, MG',
        email: null,
        telefone: null,
        fonte: 'Pesquisa pública · LinkedIn',
      },
    ]);
    expect(resultado.usos).toEqual([
      expect.objectContaining({
        provedor: 'serpapi',
        operacao: 'pesquisa_decisores',
        status: 'concluido',
        unidades: 1,
      }),
    ]);
  });
});
