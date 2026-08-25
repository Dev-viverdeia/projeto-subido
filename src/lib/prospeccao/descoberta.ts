import 'server-only';

import {
  jsonDaResposta,
  origemApify,
  origemFullEnrichEmpresa,
  origemSerp,
  type Registro,
} from './normalizacao';
import type { BuscaProspeccao, LeadProspeccaoEntrada } from './schema';

export type ParametrosDescoberta = Omit<BuscaProspeccao, 'quantidade'> & { quantidade: number };

export function quantidadeParaDescoberta(quantidade: number) {
  return Math.min(60, Math.max(15, quantidade * 3));
}

export async function buscarSerpApi(
  busca: ParametrosDescoberta,
  chave: string,
): Promise<LeadProspeccaoEntrada[]> {
  const paginas = Array.from(
    { length: Math.ceil(busca.quantidade / 20) },
    (_, indice) => indice * 20,
  );
  const respostas = await Promise.all(
    paginas.map(async (inicio) => {
      const parametros = new URLSearchParams({
        engine: 'google_maps',
        q: busca.segmento,
        location: busca.localizacao,
        hl: 'pt',
        gl: 'br',
        type: 'search',
        start: String(inicio),
        api_key: chave,
      });
      const resposta = await fetch(`https://serpapi.com/search.json?${parametros}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(18_000),
      });
      const json = (await jsonDaResposta(resposta)) as Registro;
      return Array.isArray(json.local_results) ? (json.local_results as Registro[]) : [];
    }),
  );
  return respostas
    .flat()
    .map(origemSerp)
    .filter((lead): lead is LeadProspeccaoEntrada => Boolean(lead));
}

export async function buscarApify(
  busca: ParametrosDescoberta,
  token: string,
  actorId: string,
): Promise<LeadProspeccaoEntrada[]> {
  const ator = encodeURIComponent(actorId.replace('/', '~'));
  const autenticacao = { Authorization: `Bearer ${token}` };
  const resposta = await fetch(`https://api.apify.com/v2/acts/${ator}/runs?waitForFinish=42`, {
    method: 'POST',
    headers: { ...autenticacao, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchStringsArray: [busca.segmento],
      locationQuery: busca.localizacao,
      maxCrawledPlacesPerSearch: busca.quantidade,
      language: 'pt-BR',
      countryCode: 'br',
      skipClosedPlaces: true,
      scrapeContacts: true,
      scrapePlaceDetailPage: true,
      maximumLeadsEnrichmentRecords: 0,
      verifyLeadsEnrichmentEmails: false,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(48_000),
  });
  const json = (await jsonDaResposta(resposta)) as { data?: Registro };
  const execucao = json.data;
  const id = typeof execucao?.id === 'string' ? execucao.id : null;
  const dataset = typeof execucao?.defaultDatasetId === 'string' ? execucao.defaultDatasetId : null;
  if (!id || !dataset) throw new Error('apify_execucao_sem_dataset');

  const lerResultados = async () => {
    const resultado = await fetch(
      `https://api.apify.com/v2/datasets/${encodeURIComponent(dataset)}/items?clean=true&format=json&limit=${busca.quantidade}`,
      {
        headers: autenticacao,
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      },
    );
    const recebido = await jsonDaResposta(resultado);
    return Array.isArray(recebido) ? (recebido as Registro[]) : [];
  };

  let itens = await lerResultados();
  const status = typeof execucao?.status === 'string' ? execucao.status : '';
  const aindaExecutando = ['READY', 'RUNNING'].includes(status);
  if (!itens.length && aindaExecutando) {
    const espera = await fetch(
      `https://api.apify.com/v2/actor-runs/${encodeURIComponent(id)}?waitForFinish=8`,
      { headers: autenticacao, cache: 'no-store', signal: AbortSignal.timeout(12_000) },
    );
    await jsonDaResposta(espera);
    itens = await lerResultados();
  }

  if (aindaExecutando) {
    await fetch(
      `https://api.apify.com/v2/actor-runs/${encodeURIComponent(id)}/abort?gracefully=false`,
      {
        method: 'POST',
        headers: autenticacao,
        cache: 'no-store',
        signal: AbortSignal.timeout(5_000),
      },
    ).catch(() => undefined);
  }

  if (!itens.length && !['SUCCEEDED', 'RUNNING', 'READY'].includes(status)) {
    throw new Error(`apify_execucao_${status.toLowerCase() || 'falhou'}`);
  }
  return itens.map(origemApify).filter((lead): lead is LeadProspeccaoEntrada => Boolean(lead));
}

export async function buscarFullEnrichEmpresas(
  busca: ParametrosDescoberta,
  chave: string,
): Promise<LeadProspeccaoEntrada[]> {
  const resposta = await fetch('https://app.fullenrich.com/api/v2/company/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: Math.min(busca.quantidade, 60),
      keywords: [{ value: busca.segmento, exact_match: false, exclude: false }],
      headquarters_locations: [{ value: busca.localizacao, exact_match: false, exclude: false }],
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(18_000),
  });
  const json = (await jsonDaResposta(resposta)) as Registro;
  const empresas = Array.isArray(json.companies) ? (json.companies as Registro[]) : [];
  return empresas
    .map(origemFullEnrichEmpresa)
    .filter((lead): lead is LeadProspeccaoEntrada => Boolean(lead));
}
