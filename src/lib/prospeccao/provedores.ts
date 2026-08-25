import 'server-only';

import { prospeccaoEnv } from '@/lib/env';
import { buscarDecisores, iniciarEnriquecimentoDeContatos } from './decisores';
import {
  buscarApify,
  buscarFullEnrichEmpresas,
  buscarSerpApi,
  quantidadeParaDescoberta,
  type ParametrosDescoberta,
} from './descoberta';
import { enriquecerSite, mapearComLimite } from './enriquecer-site';
import { analisarOportunidadesDeProjeto } from './inteligencia-comercial';
import {
  carregarExposicoesProspeccao,
  carregarMemoriaProspeccao,
  dominioNormalizado,
  identidadeDaEmpresa,
  type ExposicaoProspeccao,
  type MemoriaProspeccao,
} from './memoria';
import { qualificar, unicos } from './normalizacao';
import type { BuscaProspeccao, LeadProspeccaoEntrada } from './schema';

export type ResultadoProvedores = {
  leads: LeadProspeccaoEntrada[];
  provedores: {
    serpapi: 'concluido' | 'falhou' | 'nao_configurado';
    apify: 'concluido' | 'falhou' | 'nao_configurado';
    fullenrich_busca: 'concluido' | 'falhou' | 'nao_configurado';
    firecrawl: 'concluido' | 'parcial' | 'falhou' | 'nao_configurado';
    fullenrich: 'concluido' | 'parcial' | 'falhou' | 'nao_configurado';
    inteligencia: 'ia' | 'regras';
  };
};

export type EtapaPipelineProspeccao =
  'descoberta' | 'identidade' | 'contexto' | 'decisores' | 'qualificacao' | 'contatos';

type ContextoProspeccao = {
  dono?: string;
  lista?: string;
  aoProgresso?: (etapa: EtapaPipelineProspeccao, detalhe?: string) => Promise<void> | void;
};

export class ErroConfiguracaoProspeccao extends Error {
  constructor() {
    super('As integrações de Prospecção ainda estão sendo configuradas.');
    this.name = 'ErroConfiguracaoProspeccao';
  }
}

function motivoDaFalha(resultado: PromiseRejectedResult) {
  return resultado.reason instanceof Error ? resultado.reason.message : 'erro_desconhecido';
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

function temBaseParaEnriquecer(lead: LeadProspeccaoEntrada) {
  return temContatoDireto(lead) || Boolean(lead.dominio || lead.site_url);
}

export async function prospectarEmpresas(
  busca: BuscaProspeccao,
  contexto: ContextoProspeccao = {},
): Promise<ResultadoProvedores> {
  const configuracao = prospeccaoEnv();
  if (!configuracao.pronto) throw new ErroConfiguracaoProspeccao();
  await contexto.aoProgresso?.('descoberta', 'Consultando fontes de empresas da região.');

  const buscaDescoberta = {
    ...busca,
    quantidade: quantidadeParaDescoberta(busca.quantidade),
  } satisfies ParametrosDescoberta;
  const memoria = contexto.dono ? await carregarMemoriaProspeccao(contexto.dono) : null;

  const serpConfigurada = Boolean(configuracao.serpApi);
  const apifyConfigurado = Boolean(configuracao.apifyToken && configuracao.apifyActor);
  const fullEnrichBuscaConfigurado = Boolean(configuracao.fullEnrich);
  const [serp, apify, fullEnrichBusca] = await Promise.allSettled([
    configuracao.serpApi
      ? buscarSerpApi(buscaDescoberta, configuracao.serpApi)
      : Promise.resolve([]),
    configuracao.apifyToken && configuracao.apifyActor
      ? buscarApify(buscaDescoberta, configuracao.apifyToken, configuracao.apifyActor)
      : Promise.resolve([]),
    configuracao.fullEnrich
      ? buscarFullEnrichEmpresas(buscaDescoberta, configuracao.fullEnrich)
      : Promise.resolve([]),
  ]);
  const encontradosSerp = serp.status === 'fulfilled' ? serp.value : [];
  const encontradosApify = apify.status === 'fulfilled' ? apify.value : [];
  const encontradosFullEnrich = fullEnrichBusca.status === 'fulfilled' ? fullEnrichBusca.value : [];
  if (serp.status === 'rejected') {
    console.error(`[prospeccao:serpapi] ${motivoDaFalha(serp)}`);
  }
  if (apify.status === 'rejected') {
    console.error(`[prospeccao:apify] ${motivoDaFalha(apify)}`);
  }
  if (fullEnrichBusca.status === 'rejected') {
    console.error(`[prospeccao:fullenrich-busca] ${motivoDaFalha(fullEnrichBusca)}`);
  }
  let combinados = combinar(combinar(encontradosSerp, encontradosApify), encontradosFullEnrich);
  const descobertaConcluida =
    (serpConfigurada && serp.status === 'fulfilled') ||
    (apifyConfigurado && apify.status === 'fulfilled') ||
    (fullEnrichBuscaConfigurado && fullEnrichBusca.status === 'fulfilled');
  if (!descobertaConcluida) throw new Error('provedores_descoberta_indisponiveis');

  await contexto.aoProgresso?.('identidade', 'Retirando repetições e empresas já recebidas.');
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

  await contexto.aoProgresso?.('contexto', 'Reunindo site, presença digital e fatos públicos.');
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
    .filter(temBaseParaEnriquecer)
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
  await contexto.aoProgresso?.('decisores', 'Localizando pessoas com papel de decisão.');
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
  await contexto.aoProgresso?.(
    'qualificacao',
    'Relacionando cada empresa ao projeto de IA mais aderente.',
  );
  const inteligencia = await analisarOportunidadesDeProjeto(leads);
  leads = inteligencia.leads;
  await contexto.aoProgresso?.('contatos', 'Validando os melhores canais para iniciar a conversa.');
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
      fullenrich_busca: !fullEnrichBuscaConfigurado
        ? 'nao_configurado'
        : fullEnrichBusca.status === 'fulfilled'
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
      inteligencia: inteligencia.modo,
    },
  };
}
