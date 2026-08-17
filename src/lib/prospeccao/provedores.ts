import 'server-only';

import { prospeccaoEnv } from '@/lib/env';
import { buscarDecisores } from './decisores';
import {
  emailsValidos,
  jsonDaResposta,
  origemApify,
  origemSerp,
  qualificar,
  redesDeUrls,
  telefonesUnicos,
  texto,
  unicos,
  type Registro,
} from './normalizacao';
import type { BuscaProspeccao, LeadProspeccaoEntrada } from './schema';

export type ResultadoProvedores = {
  leads: LeadProspeccaoEntrada[];
  provedores: {
    serpapi: 'concluido' | 'falhou' | 'nao_configurado';
    apify: 'concluido' | 'falhou' | 'nao_configurado';
    firecrawl: 'concluido' | 'parcial' | 'falhou' | 'nao_configurado';
    fullenrich: 'concluido' | 'parcial' | 'falhou' | 'nao_configurado';
  };
};

export class ErroConfiguracaoProspeccao extends Error {
  constructor() {
    super('As integrações de Prospecção ainda estão sendo configuradas.');
    this.name = 'ErroConfiguracaoProspeccao';
  }
}

async function buscarSerpApi(
  busca: BuscaProspeccao,
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
        scrapeContacts: true,
        scrapePlaceDetailPage: true,
        maximumLeadsEnrichmentRecords: 0,
        verifyLeadsEnrichmentEmails: false,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(115_000),
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
    const combinado = {
      ...existente,
      categoria: existente.categoria ?? lead.categoria,
      endereco: existente.endereco ?? lead.endereco,
      cidade: existente.cidade ?? lead.cidade,
      estado: existente.estado ?? lead.estado,
      site_url: existente.site_url ?? lead.site_url,
      dominio: existente.dominio ?? lead.dominio,
      telefone: existente.telefone ?? lead.telefone,
      telefones: unicos([...existente.telefones, ...lead.telefones]).slice(0, 12),
      emails: unicos([...existente.emails, ...lead.emails]).slice(0, 12),
      redes_sociais: [...existente.redes_sociais, ...lead.redes_sociais].filter(
        (rede, indice, todas) => todas.findIndex((item) => item.url === rede.url) === indice,
      ),
      decisores: [...existente.decisores, ...lead.decisores].filter(
        (decisor, indice, todos) =>
          todos.findIndex(
            (item) =>
              item.linkedin_url === decisor.linkedin_url ||
              item.nome.toLocaleLowerCase('pt-BR') === decisor.nome.toLocaleLowerCase('pt-BR'),
          ) === indice,
      ),
      horarios: existente.horarios.length ? existente.horarios : lead.horarios,
      maps_url: existente.maps_url ?? lead.maps_url,
      imagem_url: existente.imagem_url ?? lead.imagem_url,
      avaliacao: existente.avaliacao ?? lead.avaliacao,
      total_avaliacoes: existente.total_avaliacoes ?? lead.total_avaliacoes,
      descricao: existente.descricao ?? lead.descricao,
      fontes: [...new Set([...existente.fontes, ...lead.fontes])],
      dados: { ...lead.dados, ...existente.dados },
    } satisfies LeadProspeccaoEntrada;
    porChave.set(lead.chave_externa, { ...combinado, qualificacao: qualificar(combinado) });
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

function contatosDoSite(markdown: string, links: string[]) {
  const emailsEmLinks = links
    .filter((link) => link.toLowerCase().startsWith('mailto:'))
    .map((link) => link.slice(7).split('?')[0] ?? '');
  const emailsNoTexto = markdown.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) ?? [];
  const telefonesEmLinks = links.flatMap((link) => {
    const normalizado = link.toLowerCase();
    if (normalizado.startsWith('tel:')) return [link.slice(4).split('?')[0] ?? ''];
    try {
      const url = new URL(link);
      if (url.hostname === 'wa.me' || url.hostname.endsWith('.wa.me')) return [url.pathname];
      if (url.hostname.endsWith('whatsapp.com')) return [url.searchParams.get('phone')];
    } catch {
      return [];
    }
    return [];
  });
  const telefonesNoTexto =
    markdown.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4})[-.\s]?\d{4}/g) ?? [];
  const urlsNoTexto = markdown.match(/https?:\/\/[^\s)\]}>"']+/gi) ?? [];
  return {
    emails: emailsValidos([...emailsEmLinks, ...emailsNoTexto]),
    telefones: telefonesUnicos([...telefonesEmLinks, ...telefonesNoTexto]).slice(0, 12),
    redes: redesDeUrls([...links, ...urlsNoTexto]),
  };
}

async function lerSite(lead: LeadProspeccaoEntrada, chave: string) {
  if (!lead.site_url) return lead;
  try {
    const resposta = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: lead.site_url,
        formats: ['markdown', 'links'],
        onlyMainContent: false,
        maxAge: 172_800_000,
        timeout: 12_000,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(16_000),
    });
    const json = (await jsonDaResposta(resposta)) as {
      success?: boolean;
      data?: { markdown?: unknown; links?: unknown; metadata?: Registro };
    };
    const markdown = texto(json.data?.markdown);
    const links = Array.isArray(json.data?.links)
      ? json.data.links.filter((item): item is string => typeof item === 'string')
      : [];
    const resumo = markdown ? resumoDoMarkdown(markdown) : null;
    const contatos = contatosDoSite(markdown ?? '', links);
    const atualizado = {
      ...lead,
      telefone: lead.telefone ?? contatos.telefones[0] ?? null,
      telefones: telefonesUnicos([...lead.telefones, ...contatos.telefones]).slice(0, 12),
      emails: unicos([...lead.emails, ...contatos.emails]).slice(0, 12),
      redes_sociais: redesDeUrls([
        ...lead.redes_sociais.map((rede) => rede.url),
        ...contatos.redes.map((rede) => rede.url),
      ]),
      descricao: lead.descricao ?? resumo,
      fontes: [...new Set([...lead.fontes, 'Site oficial · conteúdo público'])],
      dados: {
        ...lead.dados,
        site_titulo: texto(json.data?.metadata?.title),
        site_descricao: texto(json.data?.metadata?.description),
        site_resumo: resumo,
        site_contatos: {
          emails: contatos.emails,
          telefones: contatos.telefones,
          redes_sociais: contatos.redes,
        },
      },
      qualificacao: lead.qualificacao,
    } satisfies LeadProspeccaoEntrada;
    return { ...atualizado, qualificacao: qualificar(atualizado) };
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
  if (!descobertaConcluida) throw new Error('provedores_descoberta_indisponiveis');
  combinados = combinados.slice(0, busca.quantidade);

  const comSite = combinados.filter((lead) => lead.site_url);
  const firecrawl = configuracao.firecrawl;
  const lidos = firecrawl
    ? await mapearComLimite(comSite, 5, (lead) => lerSite(lead, firecrawl))
    : [];
  const porChave = new Map(lidos.map((lead) => [lead.chave_externa, lead]));
  const comContexto = combinados.map((lead) => porChave.get(lead.chave_externa) ?? lead);
  const sitesConfirmados = comContexto.filter((lead) =>
    lead.fontes.some((fonte) => fonte.startsWith('Site oficial')),
  ).length;

  const fullEnrich = configuracao.fullEnrich;
  const resultadosDecisores = fullEnrich
    ? await mapearComLimite(comContexto, 3, (lead) => buscarDecisores(lead, fullEnrich))
    : [];
  const leads = fullEnrich
    ? resultadosDecisores.map((resultado) => resultado.lead)
    : comContexto.map((lead) => ({ ...lead, qualificacao: qualificar(lead) }));
  const consultas = resultadosDecisores.filter((resultado) => resultado.consultado);
  const concluidas = consultas.filter((resultado) => resultado.sucesso).length;

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
      fullenrich: !fullEnrich
        ? 'nao_configurado'
        : consultas.length === 0 || concluidas === consultas.length
          ? 'concluido'
          : concluidas > 0
            ? 'parcial'
            : 'falhou',
    },
  };
}
