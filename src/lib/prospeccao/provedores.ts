import 'server-only';

import { prospeccaoEnv } from '@/lib/env';
import { buscarDecisores, iniciarEnriquecimentoDeContatos } from './decisores';
import { enriquecerSite, mapearComLimite } from './enriquecer-site';
import {
  carregarExposicoesProspeccao,
  carregarMemoriaProspeccao,
  dominioNormalizado,
  identidadeDaEmpresa,
  type ExposicaoProspeccao,
  type MemoriaProspeccao,
} from './memoria';
import {
  jsonDaResposta,
  origemApify,
  origemSerp,
  qualificar,
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

type ContextoProspeccao = { dono?: string; lista?: string };
type ParametrosDescoberta = Omit<BuscaProspeccao, 'quantidade'> & { quantidade: number };

export class ErroConfiguracaoProspeccao extends Error {
  constructor() {
    super('As integrações de Prospecção ainda estão sendo configuradas.');
    this.name = 'ErroConfiguracaoProspeccao';
  }
}

function motivoDaFalha(resultado: PromiseRejectedResult) {
  return resultado.reason instanceof Error ? resultado.reason.message : 'erro_desconhecido';
}

async function buscarSerpApi(
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

function quantidadeParaDescoberta(quantidade: number) {
  return Math.min(60, Math.max(15, quantidade * 3));
}

async function buscarApify(
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

function identidadeDeCombinacao(lead: LeadProspeccaoEntrada) {
  const dominio = dominioNormalizado(lead.dominio);
  if (dominio) return `dominio:${dominio}`;
  const telefone = lead.telefones[0]?.replace(/\D/g, '') ?? lead.telefone?.replace(/\D/g, '');
  if (telefone && telefone.length >= 10) return `telefone:${telefone}`;
  return `empresa:${identidadeDaEmpresa(lead)}`;
}

function combinar(principal: LeadProspeccaoEntrada[], complemento: LeadProspeccaoEntrada[]) {
  const porChave = new Map<string, LeadProspeccaoEntrada>();
  for (const lead of [...principal, ...complemento]) {
    const identidade = identidadeDeCombinacao(lead);
    const existente = porChave.get(identidade);
    if (!existente) {
      porChave.set(identidade, lead);
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
    porChave.set(identidade, { ...combinado, qualificacao: qualificar(combinado) });
  }
  return [...porChave.values()];
}

function jaConhecido(lead: LeadProspeccaoEntrada, memoria: MemoriaProspeccao | null) {
  if (!memoria) return false;
  const dominio = dominioNormalizado(lead.dominio);
  return (
    memoria.chaves.has(lead.chave_externa) ||
    (Boolean(dominio) && memoria.dominios.has(dominio)) ||
    memoria.identidades.has(identidadeDaEmpresa(lead))
  );
}

function variacaoDeterministica(valor: string) {
  let acumulado = 0;
  for (const caractere of valor) acumulado = (acumulado * 31 + caractere.charCodeAt(0)) >>> 0;
  return (acumulado % 500) / 100;
}

function notaDeSelecao(lead: LeadProspeccaoEntrada, exposicao?: ExposicaoProspeccao, semente = '') {
  const canais =
    (lead.telefones.length || lead.telefone ? 28 : 0) +
    (lead.emails.length ? 22 : 0) +
    (lead.redes_sociais.length ? 14 : 0) +
    (lead.site_url ? 10 : 0);
  const reputacao =
    Math.min(12, Math.log10((lead.total_avaliacoes ?? 0) + 1) * 6) +
    ((lead.avaliacao ?? 0) >= 4.3 ? 6 : 0);
  const distribuicao = Math.min(36, (exposicao?.total ?? 0) * 3 + (exposicao?.recentes ?? 0) * 7);
  return (
    canais + reputacao - distribuicao + variacaoDeterministica(`${semente}:${lead.chave_externa}`)
  );
}

function temContatoDireto(lead: LeadProspeccaoEntrada) {
  return Boolean(
    lead.telefone ||
    lead.telefones.length ||
    lead.emails.length ||
    lead.redes_sociais.length ||
    lead.decisores.some((decisor) => decisor.email || decisor.telefone || decisor.linkedin_url),
  );
}

export async function prospectarEmpresas(
  busca: BuscaProspeccao,
  contexto: ContextoProspeccao = {},
): Promise<ResultadoProvedores> {
  const configuracao = prospeccaoEnv();
  if (!configuracao.pronto) throw new ErroConfiguracaoProspeccao();

  const buscaDescoberta = {
    ...busca,
    quantidade: quantidadeParaDescoberta(busca.quantidade),
  } satisfies ParametrosDescoberta;
  const memoria = contexto.dono ? await carregarMemoriaProspeccao(contexto.dono) : null;

  const serpConfigurada = Boolean(configuracao.serpApi);
  const apifyConfigurado = Boolean(configuracao.apifyToken && configuracao.apifyActor);
  const [serp, apify] = await Promise.allSettled([
    configuracao.serpApi
      ? buscarSerpApi(buscaDescoberta, configuracao.serpApi)
      : Promise.resolve([]),
    configuracao.apifyToken && configuracao.apifyActor
      ? buscarApify(buscaDescoberta, configuracao.apifyToken, configuracao.apifyActor)
      : Promise.resolve([]),
  ]);
  const encontradosSerp = serp.status === 'fulfilled' ? serp.value : [];
  const encontradosApify = apify.status === 'fulfilled' ? apify.value : [];
  if (serp.status === 'rejected') {
    console.error(`[prospeccao:serpapi] ${motivoDaFalha(serp)}`);
  }
  if (apify.status === 'rejected') {
    console.error(`[prospeccao:apify] ${motivoDaFalha(apify)}`);
  }
  let combinados = combinar(encontradosSerp, encontradosApify);
  const descobertaConcluida =
    (serpConfigurada && serp.status === 'fulfilled') ||
    (apifyConfigurado && apify.status === 'fulfilled');
  if (!descobertaConcluida) throw new Error('provedores_descoberta_indisponiveis');

  combinados = combinados.filter((lead) => !jaConhecido(lead, memoria));
  const exposicoes = contexto.dono
    ? await carregarExposicoesProspeccao(combinados.map((lead) => lead.chave_externa))
    : new Map<string, ExposicaoProspeccao>();
  combinados = combinados
    .sort(
      (a, b) =>
        notaDeSelecao(
          b,
          exposicoes.get(b.chave_externa),
          `${contexto.dono ?? ''}:${contexto.lista ?? ''}`,
        ) -
        notaDeSelecao(
          a,
          exposicoes.get(a.chave_externa),
          `${contexto.dono ?? ''}:${contexto.lista ?? ''}`,
        ),
    )
    .slice(0, Math.min(30, Math.max(busca.quantidade * 2, 12)))
    .map((lead) => ({
      ...lead,
      dados: {
        ...lead.dados,
        distribuicao: {
          exposicoes_plataforma: exposicoes.get(lead.chave_externa)?.total ?? 0,
          exposicoes_recentes: exposicoes.get(lead.chave_externa)?.recentes ?? 0,
          repeticao_usuario_eliminada: true,
        },
      },
    }));

  const comSite = combinados.filter((lead) => lead.site_url);
  const firecrawl = configuracao.firecrawl;
  const lidos = firecrawl
    ? await mapearComLimite(comSite, 5, (lead) => enriquecerSite(lead, firecrawl))
    : [];
  const porChave = new Map(lidos.map((lead) => [lead.chave_externa, lead]));
  const comContexto = combinados.map((lead) => porChave.get(lead.chave_externa) ?? lead);
  const sitesConfirmados = comContexto.filter((lead) =>
    lead.fontes.some((fonte) => fonte.startsWith('Site oficial')),
  ).length;

  const candidatosFinais = comContexto
    .filter(temContatoDireto)
    .sort(
      (a, b) =>
        b.qualificacao.completude - a.qualificacao.completude ||
        notaDeSelecao(
          b,
          exposicoes.get(b.chave_externa),
          `${contexto.dono ?? ''}:${contexto.lista ?? ''}`,
        ) -
          notaDeSelecao(
            a,
            exposicoes.get(a.chave_externa),
            `${contexto.dono ?? ''}:${contexto.lista ?? ''}`,
          ),
    )
    .slice(0, busca.quantidade);
  const fullEnrich = configuracao.fullEnrich;
  const resultadosDecisores = fullEnrich
    ? await mapearComLimite(candidatosFinais, 5, (lead) => buscarDecisores(lead, fullEnrich))
    : [];
  const qualificados = fullEnrich
    ? resultadosDecisores.map((resultado) => resultado.lead)
    : candidatosFinais.map((lead) => ({ ...lead, qualificacao: qualificar(lead) }));
  let leads = qualificados
    .filter(temContatoDireto)
    .sort(
      (a, b) =>
        b.qualificacao.completude - a.qualificacao.completude ||
        notaDeSelecao(
          b,
          exposicoes.get(b.chave_externa),
          `${contexto.dono ?? ''}:${contexto.lista ?? ''}`,
        ) -
          notaDeSelecao(
            a,
            exposicoes.get(a.chave_externa),
            `${contexto.dono ?? ''}:${contexto.lista ?? ''}`,
          ),
    )
    .slice(0, busca.quantidade);
  if (
    fullEnrich &&
    configuracao.fullEnrichWebhook &&
    contexto.dono &&
    contexto.lista &&
    leads.length
  ) {
    const enriquecimento = await iniciarEnriquecimentoDeContatos({
      leads,
      chave: fullEnrich,
      segredo: configuracao.fullEnrichWebhook,
      dono: contexto.dono,
      lista: contexto.lista,
    });
    leads = enriquecimento.leads;
  }
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
