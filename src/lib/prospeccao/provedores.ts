import 'server-only';

import { prospeccaoEnv } from '@/lib/env';
import { LeadProspeccaoSchema, type BuscaProspeccao, type LeadProspeccaoEntrada } from './schema';

type Registro = Record<string, unknown>;

export type ResultadoProvedores = {
  leads: LeadProspeccaoEntrada[];
  provedores: {
    serpapi: 'concluido' | 'falhou' | 'nao_configurado';
    apify: 'concluido' | 'falhou' | 'nao_configurado';
    firecrawl: 'concluido' | 'parcial' | 'falhou' | 'nao_configurado';
  };
};

export class ErroConfiguracaoProspeccao extends Error {
  constructor() {
    super('As integrações de Prospecção ainda estão sendo configuradas.');
    this.name = 'ErroConfiguracaoProspeccao';
  }
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

function numero(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}

function inteiro(valor: unknown): number | null {
  const recebido = numero(valor);
  return recebido === null ? null : Math.max(0, Math.trunc(recebido));
}

function urlPublica(valor: unknown): string | null {
  const recebida = texto(valor);
  if (!recebida) return null;
  try {
    const url = new URL(recebida.startsWith('http') ? recebida : `https://${recebida}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function dominioDe(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function chaveDo(registro: Registro, nome: string, endereco: string | null, site: string | null) {
  return (
    texto(registro.place_id) ??
    texto(registro.placeId) ??
    texto(registro.data_id) ??
    texto(registro.cid) ??
    dominioDe(site) ??
    `${nome}|${endereco ?? ''}`.toLocaleLowerCase('pt-BR')
  );
}

function origemSerp(registro: Registro): LeadProspeccaoEntrada | null {
  const nome = texto(registro.title);
  if (!nome) return null;
  const site = urlPublica(registro.website);
  const endereco = texto(registro.address);
  const resultado = LeadProspeccaoSchema.safeParse({
    chave_externa: chaveDo(registro, nome, endereco, site),
    nome,
    categoria: texto(registro.type),
    endereco,
    cidade: null,
    estado: null,
    site_url: site,
    dominio: dominioDe(site),
    telefone: texto(registro.phone),
    avaliacao: numero(registro.rating),
    total_avaliacoes: inteiro(registro.reviews),
    descricao: texto(registro.description),
    fontes: ['Google Maps · dados públicos'],
    dados: {
      place_id: texto(registro.place_id),
      maps_url: texto(registro.place_id_search) ?? texto(registro.directions),
      horario: registro.operating_hours ?? null,
    },
  });
  return resultado.success ? resultado.data : null;
}

function origemApify(registro: Registro): LeadProspeccaoEntrada | null {
  const nome = texto(registro.title) ?? texto(registro.name);
  if (!nome) return null;
  const site = urlPublica(registro.website) ?? urlPublica(registro.url);
  const endereco = texto(registro.address);
  const categorias = Array.isArray(registro.categories)
    ? registro.categories.filter((item): item is string => typeof item === 'string')
    : [];
  const resultado = LeadProspeccaoSchema.safeParse({
    chave_externa: chaveDo(registro, nome, endereco, site),
    nome,
    categoria: texto(registro.categoryName) ?? categorias[0] ?? null,
    endereco,
    cidade: texto(registro.city),
    estado: texto(registro.state),
    site_url: site,
    dominio: dominioDe(site),
    telefone: texto(registro.phone) ?? texto(registro.phoneUnformatted),
    avaliacao: numero(registro.totalScore),
    total_avaliacoes: inteiro(registro.reviewsCount),
    descricao: texto(registro.description),
    fontes: ['Google Maps · dados públicos'],
    dados: {
      place_id: texto(registro.placeId),
      maps_url: texto(registro.url),
      categoria_secundaria: categorias[1] ?? null,
    },
  });
  return resultado.success ? resultado.data : null;
}

async function jsonDaResposta(resposta: Response): Promise<unknown> {
  const json: unknown = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(`provedor_http_${resposta.status}`);
  return json;
}

async function buscarSerpApi(
  busca: BuscaProspeccao,
  chave: string,
): Promise<LeadProspeccaoEntrada[]> {
  const paginas = Array.from(
    { length: Math.ceil(busca.quantidade / 20) },
    (_, indice) => indice * 20,
  );
  const consulta = busca.segmento;
  const respostas = await Promise.all(
    paginas.map(async (inicio) => {
      const parametros = new URLSearchParams({
        engine: 'google_maps',
        q: consulta,
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

async function buscarApify(
  busca: BuscaProspeccao,
  token: string,
  actorId: string,
): Promise<LeadProspeccaoEntrada[]> {
  const ator = encodeURIComponent(actorId.replace('/', '~'));
  const resposta = await fetch(
    `https://api.apify.com/v2/acts/${ator}/run-sync-get-dataset-items?clean=true&format=json`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchStringsArray: [busca.segmento],
        locationQuery: busca.localizacao,
        maxCrawledPlacesPerSearch: busca.quantidade,
        language: 'pt-BR',
        countryCode: 'br',
        skipClosedPlaces: true,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(35_000),
    },
  );
  const json = await jsonDaResposta(resposta);
  const itens = Array.isArray(json) ? (json as Registro[]) : [];
  return itens.map(origemApify).filter((lead): lead is LeadProspeccaoEntrada => Boolean(lead));
}

function combinar(principal: LeadProspeccaoEntrada[], complemento: LeadProspeccaoEntrada[]) {
  const porChave = new Map<string, LeadProspeccaoEntrada>();
  for (const lead of [...principal, ...complemento]) {
    const existente = porChave.get(lead.chave_externa);
    if (!existente) {
      porChave.set(lead.chave_externa, lead);
      continue;
    }
    porChave.set(lead.chave_externa, {
      ...existente,
      categoria: existente.categoria ?? lead.categoria,
      endereco: existente.endereco ?? lead.endereco,
      cidade: existente.cidade ?? lead.cidade,
      estado: existente.estado ?? lead.estado,
      site_url: existente.site_url ?? lead.site_url,
      dominio: existente.dominio ?? lead.dominio,
      telefone: existente.telefone ?? lead.telefone,
      avaliacao: existente.avaliacao ?? lead.avaliacao,
      total_avaliacoes: existente.total_avaliacoes ?? lead.total_avaliacoes,
      descricao: existente.descricao ?? lead.descricao,
      fontes: [...new Set([...existente.fontes, ...lead.fontes])],
      dados: { ...lead.dados, ...existente.dados },
    });
  }
  return [...porChave.values()];
}

function resumoDoMarkdown(markdown: string): string | null {
  const limpo = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return limpo ? limpo.slice(0, 900) : null;
}

async function lerSite(lead: LeadProspeccaoEntrada, chave: string) {
  if (!lead.site_url) return lead;
  try {
    const resposta = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: lead.site_url,
        formats: ['markdown'],
        onlyMainContent: true,
        maxAge: 172_800_000,
        timeout: 12_000,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(16_000),
    });
    const json = (await jsonDaResposta(resposta)) as {
      success?: boolean;
      data?: { markdown?: unknown; metadata?: Registro };
    };
    const markdown = texto(json.data?.markdown);
    const resumo = markdown ? resumoDoMarkdown(markdown) : null;
    return {
      ...lead,
      descricao: lead.descricao ?? resumo,
      fontes: [...new Set([...lead.fontes, 'Site oficial · conteúdo público'])],
      dados: {
        ...lead.dados,
        site_titulo: texto(json.data?.metadata?.title),
        site_descricao: texto(json.data?.metadata?.description),
        site_resumo: resumo,
      },
    } satisfies LeadProspeccaoEntrada;
  } catch {
    return lead;
  }
}

async function mapearComLimite<T, R>(
  itens: T[],
  limite: number,
  executar: (item: T) => Promise<R>,
): Promise<R[]> {
  const resultado: Array<{ indice: number; valor: R }> = [];
  let proximo = 0;
  await Promise.all(
    Array.from({ length: Math.min(limite, itens.length) }, async () => {
      while (proximo < itens.length) {
        const indice = proximo++;
        const item = itens[indice];
        if (item === undefined) break;
        resultado.push({ indice, valor: await executar(item) });
      }
    }),
  );
  return resultado.sort((a, b) => a.indice - b.indice).map((item) => item.valor);
}

export async function prospectarEmpresas(busca: BuscaProspeccao): Promise<ResultadoProvedores> {
  const configuracao = prospeccaoEnv();
  if (!configuracao.pronto) throw new ErroConfiguracaoProspeccao();

  const serpConfigurada = Boolean(configuracao.serpApi);
  const apifyConfigurado = Boolean(configuracao.apifyToken && configuracao.apifyActor);
  const [serp, apify] = await Promise.allSettled([
    configuracao.serpApi ? buscarSerpApi(busca, configuracao.serpApi) : Promise.resolve([]),
    configuracao.apifyToken && configuracao.apifyActor
      ? buscarApify(busca, configuracao.apifyToken, configuracao.apifyActor)
      : Promise.resolve([]),
  ]);
  const encontradosSerp = serp.status === 'fulfilled' ? serp.value : [];
  const encontradosApify = apify.status === 'fulfilled' ? apify.value : [];
  let combinados = combinar(encontradosSerp, encontradosApify);

  const descobertaConcluida =
    (serpConfigurada && serp.status === 'fulfilled') ||
    (apifyConfigurado && apify.status === 'fulfilled');
  if (!descobertaConcluida) {
    throw new Error('provedores_descoberta_indisponiveis');
  }

  combinados = combinados.slice(0, busca.quantidade);

  const comSite = combinados.filter((lead) => lead.site_url);
  const firecrawl = configuracao.firecrawl;
  const lidos = firecrawl
    ? await mapearComLimite(comSite, 5, (lead) => lerSite(lead, firecrawl))
    : [];
  const porChave = new Map(lidos.map((lead) => [lead.chave_externa, lead]));
  const leads = combinados.map((lead) => porChave.get(lead.chave_externa) ?? lead);
  const sitesConfirmados = leads.filter((lead) =>
    lead.fontes.some((fonte) => fonte.startsWith('Site oficial')),
  ).length;

  return {
    leads,
    provedores: {
      serpapi: !serpConfigurada
        ? 'nao_configurado'
        : serp.status === 'fulfilled'
          ? 'concluido'
          : 'falhou',
      apify: !apifyConfigurado
        ? 'nao_configurado'
        : apify.status === 'fulfilled'
          ? 'concluido'
          : 'falhou',
      firecrawl: !firecrawl
        ? 'nao_configurado'
        : comSite.length === 0
          ? 'concluido'
          : sitesConfirmados === comSite.length
            ? 'concluido'
            : sitesConfirmados > 0
              ? 'parcial'
              : 'falhou',
    },
  };
}
