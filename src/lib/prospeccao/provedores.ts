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
import { combinar } from './combinar-leads';
import { qualificar } from './normalizacao';
import type { BuscaProspeccao, LeadProspeccaoEntrada } from './schema';

export type ResultadoProvedores = {
  leads: LeadProspeccaoEntrada[];
  custos: UsoProvedorProspeccao[];
  provedores: {
    serpapi: 'concluido' | 'parcial' | 'falhou' | 'nao_configurado' | 'nao_necessario';
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

function deslocamentoSerp(busca: BuscaProspeccao, contexto: ContextoProspeccao) {
  if (!contexto.dono && !contexto.lista) return 0;
  const semente = [
    contexto.dono ?? '',
    contexto.lista ?? '',
    busca.segmento,
    busca.localizacao,
  ].join(':');
  let acumulado = 0;
  for (const caractere of semente) acumulado = (acumulado * 31 + caractere.charCodeAt(0)) >>> 0;
  return (acumulado % 3) * 20;
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
    deslocamentoInicial: deslocamentoSerp(busca, contexto),
  } satisfies ParametrosDescoberta;
  const memoria = contexto.dono ? await carregarMemoriaProspeccao(contexto.dono) : null;
  const custos: UsoProvedorProspeccao[] = [];
  const adicionarCusto = async (uso: UsoProvedorProspeccao) => {
    custos.push(uso);
    await contexto.aoCusto?.(uso);
  };

  const executarSerp = async () => {
    if (!configuracao.serpApi) {
      return {
        estado: 'nao_configurado' as const,
        leads: [] as LeadProspeccaoEntrada[],
        uso: null,
      };
    }
    const inicio = Date.now();
    try {
      const resultado = await buscarSerpApi(buscaDescoberta, configuracao.serpApi);
      return {
        estado: resultado.uso.status === 'parcial' ? ('parcial' as const) : ('concluido' as const),
        leads: resultado.leads,
        uso: resultado.uso,
      };
    } catch (erro) {
      console.error(
        `[prospeccao:serpapi] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
      );
      return {
        estado: 'falhou' as const,
        leads: [] as LeadProspeccaoEntrada[],
        uso: {
          provedor: 'serpapi' as const,
          operacao: 'google_maps_search',
          status: 'falhou' as const,
          unidades: 0,
          unidade: 'requisicao' as const,
          latenciaMs: Date.now() - inicio,
        },
      };
    }
  };

  const executarApify = async () => {
    if (!configuracao.apifyToken || !configuracao.apifyActor) {
      return {
        estado: 'nao_configurado' as const,
        leads: [] as LeadProspeccaoEntrada[],
        uso: null,
      };
    }
    const inicio = Date.now();
    try {
      const resultado = await buscarApify(
        buscaDescoberta,
        configuracao.apifyToken,
        configuracao.apifyActor,
      );
      return { estado: 'concluido' as const, leads: resultado.leads, uso: resultado.uso };
    } catch (erro) {
      console.error(
        `[prospeccao:apify] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
      );
      return {
        estado: 'falhou' as const,
        leads: [] as LeadProspeccaoEntrada[],
        uso: {
          provedor: 'apify' as const,
          operacao: 'google_places',
          status: 'falhou' as const,
          unidades: 0,
          unidade: 'execucao' as const,
          latenciaMs: Date.now() - inicio,
        },
      };
    }
  };

  // SerpAPI dá velocidade e diversidade; Apify aprofunda contatos no mesmo intervalo.
  // Uma falha isolada não derruba a lista quando o outro provedor trouxe empresas válidas.
  const [resultadoSerp, resultadoApify] = await Promise.all([executarSerp(), executarApify()]);
  for (const uso of [resultadoSerp.uso, resultadoApify.uso]) {
    if (uso) await adicionarCusto(uso);
  }
  const estadoSerp = resultadoSerp.estado;
  const estadoApify = resultadoApify.estado;
  const encontradosSerp = resultadoSerp.leads;
  const encontradosApify = resultadoApify.leads;

  let combinados = combinar(encontradosApify, encontradosSerp);
  const descobertaConcluida =
    estadoApify === 'concluido' || estadoSerp === 'concluido' || estadoSerp === 'parcial';
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
    .filter(temBaseParaEnriquecer)
    .slice(0, busca.quantidade)
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

  const candidatosBase = combinados;
  await contexto.aoProgresso?.('contexto', 'Reunindo site, presença digital e fatos públicos.');
  const comSite = candidatosBase.filter((lead) => lead.site_url);
  const webConfigurada = Boolean(configuracao.firecrawl || configuracao.gateway);
  const configuracaoWeb = {
    firecrawl: configuracao.firecrawl,
    perplexity: configuracao.perplexity,
    serpApi: configuracao.serpApi,
    usarPerplexity: Boolean(
      configuracao.perplexity || (configuracao.gateway && configuracao.gatewayPerplexityAtiva),
    ),
    gateway: configuracao.gateway,
  };
  const pesquisaConfigurada = Boolean(
    configuracao.serpApi ||
    configuracao.perplexity ||
    (configuracao.gateway && configuracao.gatewayPerplexityAtiva),
  );
  await contexto.aoProgresso?.('decisores', 'Localizando pessoas com papel de decisão.');
  const [lidos, pesquisa] = await Promise.all([
    webConfigurada
      ? mapearComLimite(comSite, 5, (lead) => enriquecerSite(lead, configuracaoWeb))
      : Promise.resolve([]),
    pesquisaConfigurada
      ? pesquisarPossiveisDecisores(candidatosBase, configuracaoWeb)
      : Promise.resolve({ leads: candidatosBase, usos: [] }),
  ]);
  for (const resultado of lidos) await adicionarCusto(resultado.uso);
  for (const uso of pesquisa.usos) await adicionarCusto(uso);
  const sitePorChave = new Map(
    lidos.map((resultado) => [resultado.lead.chave_externa, resultado.lead]),
  );
  const pesquisaPorChave = new Map(pesquisa.leads.map((lead) => [lead.chave_externa, lead]));
  const comContexto = candidatosBase.map((lead) => {
    const site = sitePorChave.get(lead.chave_externa) ?? lead;
    const decisores = pesquisaPorChave.get(lead.chave_externa) ?? lead;
    return combinar([site], [decisores])[0] ?? site;
  });
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
  let leads = candidatosFinais
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
  const usosPerplexity = pesquisa.usos.filter((uso) => uso.provedor === 'perplexity');
  const consultasPerplexity = usosPerplexity.length;
  const concluidasPerplexity = usosPerplexity.filter((uso) => uso.status === 'concluido').length;
  const perplexityConfigurada = Boolean(
    configuracao.perplexity || (configuracao.gateway && configuracao.gatewayPerplexityAtiva),
  );

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
      perplexity: !perplexityConfigurada
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
