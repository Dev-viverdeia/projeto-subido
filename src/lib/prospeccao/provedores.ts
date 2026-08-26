import 'server-only';

import { prospeccaoEnv } from '@/lib/env';
import { pesquisarPossiveisDecisores } from './decisores';
import {
  buscarApify,
  buscarSerpApi,
  quantidadeParaDescoberta,
  type ParametrosDescoberta,
} from './descoberta';
import type { UsoProvedorProspeccao } from './custos';
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
  custos: UsoProvedorProspeccao[];
  provedores: {
    serpapi: 'concluido' | 'falhou' | 'nao_configurado' | 'nao_necessario';
    apify: 'concluido' | 'falhou' | 'nao_configurado';
    firecrawl: 'concluido' | 'parcial' | 'falhou' | 'nao_configurado';
    perplexity: 'concluido' | 'parcial' | 'falhou' | 'nao_configurado';
    inteligencia: 'ia' | 'regras';
  };
};

export type EtapaPipelineProspeccao =
  'descoberta' | 'identidade' | 'contexto' | 'decisores' | 'qualificacao' | 'contatos';

type ContextoProspeccao = {
  dono?: string;
  lista?: string;
  aoProgresso?: (etapa: EtapaPipelineProspeccao, detalhe?: string) => Promise<void> | void;
  aoCusto?: (uso: UsoProvedorProspeccao) => Promise<void> | void;
};

export class ErroConfiguracaoProspeccao extends Error {
  constructor() {
    super('As integrações de Prospecção ainda estão sendo configuradas.');
    this.name = 'ErroConfiguracaoProspeccao';
  }
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
  const custos: UsoProvedorProspeccao[] = [];
  const adicionarCusto = async (uso: UsoProvedorProspeccao) => {
    custos.push(uso);
    await contexto.aoCusto?.(uso);
  };

  const serpConfigurada = Boolean(configuracao.serpApi);
  const apifyConfigurado = Boolean(configuracao.apifyToken && configuracao.apifyActor);
  let estadoApify: 'concluido' | 'falhou' | 'nao_configurado' = apifyConfigurado
    ? 'falhou'
    : 'nao_configurado';
  let estadoSerp: 'concluido' | 'falhou' | 'nao_configurado' | 'nao_necessario' = serpConfigurada
    ? 'nao_necessario'
    : 'nao_configurado';
  let encontradosApify: LeadProspeccaoEntrada[] = [];
  let encontradosSerp: LeadProspeccaoEntrada[] = [];

  if (configuracao.apifyToken && configuracao.apifyActor) {
    const inicioApify = Date.now();
    try {
      const resultado = await buscarApify(
        buscaDescoberta,
        configuracao.apifyToken,
        configuracao.apifyActor,
      );
      encontradosApify = resultado.leads;
      await adicionarCusto(resultado.uso);
      estadoApify = 'concluido';
    } catch (erro) {
      await adicionarCusto({
        provedor: 'apify',
        operacao: 'google_places',
        status: 'falhou',
        unidades: 0,
        unidade: 'execucao',
        latenciaMs: Date.now() - inicioApify,
      });
      console.error(
        `[prospeccao:apify] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
      );
    }
  }

  // SerpAPI é contingência: só consome uma busca quando o Apify não cobriu o lote.
  if (configuracao.serpApi && encontradosApify.length < buscaDescoberta.quantidade) {
    estadoSerp = 'falhou';
    const inicioSerp = Date.now();
    try {
      const resultado = await buscarSerpApi(buscaDescoberta, configuracao.serpApi);
      encontradosSerp = resultado.leads;
      await adicionarCusto(resultado.uso);
      estadoSerp = 'concluido';
    } catch (erro) {
      await adicionarCusto({
        provedor: 'serpapi',
        operacao: 'google_maps_search',
        status: 'falhou',
        unidades: 0,
        unidade: 'requisicao',
        latenciaMs: Date.now() - inicioSerp,
      });
      console.error(
        `[prospeccao:serpapi] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
      );
    }
  }

  let combinados = combinar(encontradosApify, encontradosSerp);
  const descobertaConcluida = estadoApify === 'concluido' || estadoSerp === 'concluido';
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
  const webConfigurada = Boolean(configuracao.firecrawl || configuracao.gateway);
  const configuracaoWeb = {
    firecrawl: configuracao.firecrawl,
    perplexity: configuracao.perplexity,
    gateway: configuracao.gateway,
  };
  const lidos = webConfigurada
    ? await mapearComLimite(comSite, 5, (lead) => enriquecerSite(lead, configuracaoWeb))
    : [];
  for (const resultado of lidos) await adicionarCusto(resultado.uso);
  const porChave = new Map(
    lidos.map((resultado) => [resultado.lead.chave_externa, resultado.lead]),
  );
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
  const pesquisaConfigurada = Boolean(
    configuracao.perplexity || (configuracao.gateway && configuracao.gatewayPerplexityAtiva),
  );
  const pesquisa = pesquisaConfigurada
    ? await pesquisarPossiveisDecisores(candidatosFinais, configuracaoWeb)
    : { leads: candidatosFinais, usos: [] };
  for (const uso of pesquisa.usos) await adicionarCusto(uso);
  let leads = pesquisa.leads
    .map((lead) => ({ ...lead, qualificacao: qualificar(lead) }))
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
  if (inteligencia.uso) await adicionarCusto(inteligencia.uso);
  await contexto.aoProgresso?.('contatos', 'Validando os melhores canais para iniciar a conversa.');
  const consultasPerplexity = pesquisa.usos.length;
  const concluidasPerplexity = pesquisa.usos.filter((uso) => uso.status === 'concluido').length;

  return {
    leads,
    custos,
    provedores: {
      serpapi: estadoSerp,
      apify: estadoApify,
      firecrawl: !webConfigurada
        ? 'nao_configurado'
        : comSite.length === 0
          ? 'concluido'
          : sitesConfirmados === comSite.length
            ? 'concluido'
            : sitesConfirmados > 0
              ? 'parcial'
              : 'falhou',
      perplexity: !pesquisaConfigurada
        ? 'nao_configurado'
        : consultasPerplexity === 0 || concluidasPerplexity === consultasPerplexity
          ? 'concluido'
          : concluidasPerplexity > 0
            ? 'parcial'
            : 'falhou',
      inteligencia: inteligencia.modo,
    },
  };
}
