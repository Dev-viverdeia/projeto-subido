import 'server-only';

import { jsonDaResposta, origemApify, origemSerp, type Registro } from './normalizacao';
import type { UsoProvedorProspeccao } from './custos';
import type { BuscaProspeccao, LeadProspeccaoEntrada } from './schema';

export type ParametrosDescoberta = Omit<BuscaProspeccao, 'quantidade'> & {
  quantidade: number;
  deslocamentoInicial?: number;
};
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
  const paginaInicial = Math.max(0, Math.trunc((busca.deslocamentoInicial ?? 0) / 20)) % 3;
  const totalPaginas = Math.min(3, Math.ceil(busca.quantidade / 20));
  const paginas = Array.from(
    { length: totalPaginas },
    (_, indice) => ((paginaInicial + indice) % 3) * 20,
  );
  const respostas = await Promise.all(
    paginas.map(async (inicio) => {
      try {
        const parametros = new URLSearchParams({
          engine: 'google_maps',
          q: `${busca.segmento} em ${busca.localizacao}`,
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
        return {
          pagina: inicio,
          itens: Array.isArray(json.local_results) ? (json.local_results as Registro[]) : [],
          concluiu: true,
        };
      } catch {
        return { pagina: inicio, itens: [] as Registro[], concluiu: false };
      }
    }),
  );
  const concluidas = respostas.filter((resposta) => resposta.concluiu);
  if (!concluidas.length) throw new Error('serpapi_indisponivel');
  const leads = respostas
    .flatMap((resposta) => resposta.itens)
    .map(origemSerp)
    .filter((lead): lead is LeadProspeccaoEntrada => Boolean(lead));
  return {
    leads,
    uso: {
      provedor: 'serpapi',
      operacao: 'google_maps_search',
      status: concluidas.length === paginas.length ? 'concluido' : 'parcial',
      unidades: concluidas.length,
      unidade: 'requisicao',
      latenciaMs: Date.now() - inicio,
      metadados: {
        resultados: leads.length,
        paginas: concluidas.map((resposta) => resposta.pagina),
        paginas_com_falha: respostas
          .filter((resposta) => !resposta.concluiu)
          .map((resposta) => resposta.pagina),
      },
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
    waitForFinish: '8',
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
    signal: AbortSignal.timeout(14_000),
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
  let status = typeof execucao?.status === 'string' ? execucao.status : '';
  let aindaExecutando = ['READY', 'RUNNING'].includes(status);
  if (!itens.length && aindaExecutando) {
    const espera = await fetch(
      `https://api.apify.com/v2/actor-runs/${encodeURIComponent(id)}?waitForFinish=2`,
      { headers: autenticacao, cache: 'no-store', signal: AbortSignal.timeout(4_000) },
    );
    const finalizada = (await jsonDaResposta(espera)) as { data?: Registro };
    execucao = finalizada.data ?? execucao;
    status = typeof execucao?.status === 'string' ? execucao.status : status;
    aindaExecutando = ['READY', 'RUNNING'].includes(status);
    itens = await lerResultados();
  }

  if (aindaExecutando) {
    const respostaAbortar = await fetch(
      `https://api.apify.com/v2/actor-runs/${encodeURIComponent(id)}/abort?gracefully=false`,
      {
        method: 'POST',
        headers: autenticacao,
        cache: 'no-store',
        signal: AbortSignal.timeout(5_000),
      },
    ).catch(() => null);
    if (respostaAbortar?.ok) {
      const abortada = (await jsonDaResposta(respostaAbortar)) as { data?: Registro };
      execucao = abortada.data ?? execucao;
    }
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
