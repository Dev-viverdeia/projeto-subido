import 'server-only';

import { jsonDaResposta, type Registro } from './normalizacao';

export type ConfiguracaoGatewayDados = { url: string; segredo: string } | null;

type ConfiguracaoProvedoresWeb = {
  firecrawl: string | null;
  perplexity: string | null;
  gateway: ConfiguracaoGatewayDados;
};

type ResultadoPesquisa = {
  title?: unknown;
  url?: unknown;
  snippet?: unknown;
  date?: unknown;
  last_updated?: unknown;
};

async function chamarGateway(
  gateway: NonNullable<ConfiguracaoGatewayDados>,
  acao: 'firecrawl_scrape' | 'perplexity_search',
  payload: Record<string, unknown>,
) {
  const resposta = await fetch(gateway.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-via-data-secret': gateway.segredo,
    },
    body: JSON.stringify({ acao, payload }),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  return jsonDaResposta(resposta) as Promise<{ data?: Registro }>;
}

export async function rasparComFirecrawl(
  url: string,
  configuracao: ConfiguracaoProvedoresWeb,
): Promise<Registro> {
  if (configuracao.firecrawl) {
    const resposta = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${configuracao.firecrawl}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links'],
        onlyMainContent: false,
        maxAge: 172_800_000,
        timeout: 12_000,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(16_000),
    });
    return (await jsonDaResposta(resposta)) as Registro;
  }
  if (!configuracao.gateway) throw new Error('firecrawl_nao_configurado');
  const resposta = await chamarGateway(configuracao.gateway, 'firecrawl_scrape', { url });
  return resposta.data ?? {};
}

export async function pesquisarComPerplexity(
  consultas: string[],
  configuracao: ConfiguracaoProvedoresWeb,
): Promise<ResultadoPesquisa[]> {
  const corpo = {
    query: consultas.slice(0, 5),
    max_results: 5,
    country: 'BR',
    search_language_filter: ['pt'],
  };
  let json: Registro;
  if (configuracao.perplexity) {
    const resposta = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${configuracao.perplexity}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(corpo),
      cache: 'no-store',
      signal: AbortSignal.timeout(18_000),
    });
    json = (await jsonDaResposta(resposta)) as Registro;
  } else {
    if (!configuracao.gateway) throw new Error('perplexity_nao_configurada');
    const resposta = await chamarGateway(configuracao.gateway, 'perplexity_search', corpo);
    json = resposta.data ?? {};
  }
  return Array.isArray(json.results) ? (json.results as ResultadoPesquisa[]) : [];
}
