import 'server-only';

import { jsonDaResposta, origemApify, origemSerp, type Registro } from './normalizacao';
import type { UsoProvedorProspeccao } from './custos';
import type { BuscaProspeccao, LeadProspeccaoEntrada } from './schema';

export type ParametrosDescoberta = Omit<BuscaProspeccao, 'quantidade'> & { quantidade: number };
export type ResultadoDescoberta = {
  leads: LeadProspeccaoEntrada[];
  uso: UsoProvedorProspeccao;
};

export function quantidadeParaDescoberta(quantidade: number) {
  return Math.min(60, Math.max(15, quantidade * 3));
}

export async function buscarSerpApi(
  busca: ParametrosDescoberta,
  chave: string,
): Promise<ResultadoDescoberta> {
  const inicio = Date.now();
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
  const leads = respostas
    .flat()
    .map(origemSerp)
    .filter((lead): lead is LeadProspeccaoEntrada => Boolean(lead));
  return {
    leads,
    uso: {
      provedor: 'serpapi',
      operacao: 'google_maps_search',
      status: 'concluido',
      unidades: paginas.length,
      unidade: 'requisicao',
      latenciaMs: Date.now() - inicio,
      metadados: { resultados: leads.length },
    },
  };
}

export async function buscarApify(
  busca: ParametrosDescoberta,
  token: string,
  actorId: string,
): Promise<ResultadoDescoberta> {
  const inicio = Date.now();
  const ator = encodeURIComponent(actorId.replace('/', '~'));
  const autenticacao = { Authorization: `Bearer ${token}` };
  const parametrosExecucao = new URLSearchParams({
    waitForFinish: '42',
    maxTotalChargeUsd: '1.00',
  });
  const resposta = await fetch(`https://api.apify.com/v2/acts/${ator}/runs?${parametrosExecucao}`, {
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
  let execucao = json.data;
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
    const finalizada = (await jsonDaResposta(espera)) as { data?: Registro };
    execucao = finalizada.data ?? execucao;
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
  const leads = itens
    .map(origemApify)
    .filter((lead): lead is LeadProspeccaoEntrada => Boolean(lead));
  const custoUsd =
    typeof execucao?.usageTotalUsd === 'number' && Number.isFinite(execucao.usageTotalUsd)
      ? execucao.usageTotalUsd
      : 0;
  return {
    leads,
    uso: {
      provedor: 'apify',
      operacao: 'google_places',
      status: 'concluido',
      unidades: 1,
      unidade: 'execucao',
      custoUsdMicros: Math.round(custoUsd * 1_000_000),
      latenciaMs: Date.now() - inicio,
      metadados: { resultados: leads.length, execucao: id },
    },
  };
}
