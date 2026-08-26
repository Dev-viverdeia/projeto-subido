// @vitest-environment node

import { afterAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { PERPLEXITY_SEARCH_USD_MICROS_POR_REQUISICAO } from './custos';
import { prospectarEmpresas, type ResultadoProvedores } from './provedores';
import type { BuscaProspeccao, LeadProspeccaoEntrada } from './schema';

const executar = process.env.RUN_PROSPECCAO_QUALITY_BENCHMARK === '1';
const SERPAPI_USD_MICROS_POR_REQUISICAO = 10_000;

const cenarios = [
  {
    nome: 'serviço local de saúde',
    segmento: 'clínica odontológica',
    localizacao: 'Belo Horizonte, MG',
    quantidade: 5,
  },
  {
    nome: 'serviço profissional B2B',
    segmento: 'escritório de contabilidade',
    localizacao: 'Curitiba, PR',
    quantidade: 5,
  },
  {
    nome: 'mercado imobiliário regional',
    segmento: 'imobiliária',
    localizacao: 'Campinas, SP',
    quantidade: 5,
  },
] satisfies Array<BuscaProspeccao & { nome: string }>;

type RelatorioQualidade = ReturnType<typeof medirResultado>;
const relatorios: RelatorioQualidade[] = [];

function percentual(parte: number, total: number) {
  return total > 0 ? Math.round((parte / total) * 1_000) / 10 : 0;
}

function temTelefone(lead: LeadProspeccaoEntrada) {
  return Boolean(lead.telefone || lead.telefones.length);
}

function temDecisorDireto(lead: LeadProspeccaoEntrada) {
  return lead.decisores.some(
    (decisor) => decisor.email || decisor.telefone || decisor.linkedin_url,
  );
}

function identidade(lead: LeadProspeccaoEntrada) {
  return (
    lead.dominio ||
    lead.telefones[0]?.replace(/\D/g, '') ||
    lead.telefone?.replace(/\D/g, '') ||
    lead.chave_externa
  );
}

function custoConhecidoUsdMicros(resultado: ResultadoProvedores) {
  return resultado.custos.reduce((total, uso) => {
    if (uso.custoUsdMicros !== undefined) return total + uso.custoUsdMicros;
    if (uso.provedor === 'serpapi') {
      return total + uso.unidades * SERPAPI_USD_MICROS_POR_REQUISICAO;
    }
    if (uso.provedor === 'perplexity') {
      return total + uso.unidades * PERPLEXITY_SEARCH_USD_MICROS_POR_REQUISICAO;
    }
    return total;
  }, 0);
}

function medirResultado(
  cenario: (typeof cenarios)[number],
  resultado: ResultadoProvedores,
  latenciaMs: number,
) {
  const { leads } = resultado;
  const identidades = leads.map(identidade);
  const unicos = new Set(identidades).size;
  const custoUsdMicros = custoConhecidoUsdMicros(resultado);
  const telefonePct = percentual(leads.filter(temTelefone).length, leads.length);
  const decisorPct = percentual(leads.filter((lead) => lead.decisores.length).length, leads.length);
  const decisorDiretoPct = percentual(leads.filter(temDecisorDireto).length, leads.length);
  const mediaCompletude = leads.length
    ? Math.round(
        (leads.reduce((total, lead) => total + lead.qualificacao.completude, 0) / leads.length) *
          10,
      ) / 10
    : 0;

  return {
    cenario: cenario.nome,
    busca: `${cenario.segmento} · ${cenario.localizacao}`,
    solicitados: cenario.quantidade,
    entregues: leads.length,
    coberturaDaSolicitacaoPct: percentual(leads.length, cenario.quantidade),
    unicidadePct: percentual(unicos, leads.length),
    contatos: {
      telefonePct,
      emailPct: percentual(leads.filter((lead) => lead.emails.length).length, leads.length),
      redeSocialPct: percentual(
        leads.filter((lead) => lead.redes_sociais.length).length,
        leads.length,
      ),
      sitePct: percentual(leads.filter((lead) => lead.site_url).length, leads.length),
      decisorPct,
      decisorDiretoPct,
    },
    qualificacao: {
      completudeMedia: mediaCompletude,
      projetoRecomendadoPct: percentual(
        leads.filter((lead) => lead.qualificacao.oportunidade).length,
        leads.length,
      ),
    },
    operacao: {
      latenciaMs,
      provedores: resultado.provedores,
      usos: resultado.custos.map((uso) => ({
        provedor: uso.provedor,
        operacao: uso.operacao,
        status: uso.status,
        unidades: uso.unidades,
        latenciaMs: uso.latenciaMs ?? null,
        custoUsd: uso.custoUsdMicros ? uso.custoUsdMicros / 1_000_000 : null,
        creditosProvedor: uso.creditosProvedor ?? null,
      })),
      custoConhecidoUsd: Math.round((custoUsdMicros / 1_000_000) * 10_000) / 10_000,
      custoConhecidoPorLeadUsd: leads.length
        ? Math.round((custoUsdMicros / 1_000_000 / leads.length) * 10_000) / 10_000
        : null,
    },
    avaliacao: {
      aprovado: false,
      gargalos: [
        ...(leads.length < cenario.quantidade ? ['entrega_incompleta'] : []),
        ...(telefonePct < 80 ? ['poucos_telefones'] : []),
        ...(decisorPct < 20 ? ['poucos_decisores'] : []),
        ...(decisorDiretoPct < 20 ? ['poucos_contatos_de_decisores'] : []),
        ...(resultado.provedores.inteligencia !== 'ia' ? ['qualificacao_sem_ia'] : []),
        ...(resultado.provedores.firecrawl === 'falhou' ? ['contexto_de_sites_indisponivel'] : []),
        ...(latenciaMs > 30_000 ? ['latencia_acima_de_30s'] : []),
      ],
    },
  };
}

describe.runIf(executar)('benchmark real de qualidade da Prospecção', () => {
  it.each(cenarios)(
    '$nome',
    async (cenario) => {
      const inicio = Date.now();
      const resultado = await prospectarEmpresas(cenario);
      const relatorio = medirResultado(cenario, resultado, Date.now() - inicio);
      relatorio.avaliacao.aprovado = relatorio.avaliacao.gargalos.length === 0;
      relatorios.push(relatorio);

      expect(relatorio.entregues).toBeGreaterThanOrEqual(3);
      expect(relatorio.unicidadePct).toBe(100);
      expect(relatorio.contatos.telefonePct).toBeGreaterThanOrEqual(60);
      expect(relatorio.qualificacao.completudeMedia).toBeGreaterThanOrEqual(40);
      expect(resultado.provedores.serpapi).toMatch(/concluido|parcial/);
      expect(resultado.custos.some((uso) => uso.provedor === 'serpapi')).toBe(true);
      expect.soft(relatorio.avaliacao.gargalos, 'gargalos para uma lista qualificada').toEqual([]);
    },
    90_000,
  );

  afterAll(() => {
    process.stdout.write(
      `\nPROSPECCAO_QUALITY_BENCHMARK=${JSON.stringify({ relatorios }, null, 2)}\n`,
    );
  });
});
