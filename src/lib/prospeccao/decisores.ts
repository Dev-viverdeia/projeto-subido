import 'server-only';

import {
  PERPLEXITY_SEARCH_USD_MICROS_POR_REQUISICAO,
  SERPAPI_SEARCH_USD_MICROS_POR_REQUISICAO,
  type UsoProvedorProspeccao,
} from './custos';
import {
  pesquisarComPerplexity,
  pesquisarDecisorComSerpApi,
  type ConfiguracaoGatewayDados,
} from './gateway';
import { texto, urlPublica } from './normalizacao';
import type { LeadProspeccaoEntrada } from './schema';

type ConfiguracaoPesquisa = {
  firecrawl: string | null;
  perplexity: string | null;
  serpApi: string | null;
  usarPerplexity: boolean;
  gateway: ConfiguracaoGatewayDados;
};

type FontePesquisa = {
  titulo: string;
  url: string;
  trecho: string | null;
  data: string | null;
};

function normalizar(valor: string | null | undefined) {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\b(ltda|eireli|sa|s a|me|epp)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function termosDaEmpresa(nome: string) {
  return normalizar(nome)
    .split(' ')
    .filter((termo) => termo.length >= 4)
    .slice(0, 4);
}

function fonteRelacionada(fonte: FontePesquisa, lead: LeadProspeccaoEntrada) {
  const base = normalizar(`${fonte.titulo} ${fonte.trecho ?? ''}`);
  const termos = termosDaEmpresa(lead.nome);
  return termos.length > 0 && termos.some((termo) => base.includes(termo));
}

const TERMOS_GENERICOS = new Set([
  'assessoria',
  'clinica',
  'contabilidade',
  'contabil',
  'curitiba',
  'escritorio',
  'imobiliaria',
  'servicos',
]);

function possivelDecisorDaFonte(fonte: FontePesquisa, lead: LeadProspeccaoEntrada) {
  if (!/linkedin\.com\/in\//i.test(fonte.url)) return null;
  const nome = fonte.titulo
    .split(/\s(?:-|\||·)\s/)[0]
    ?.replace(/^[^\p{L}]+|[^\p{L}.]+$/gu, '')
    .trim();
  const partesNome = nome?.split(/\s+/).filter(Boolean) ?? [];
  if (!nome || partesNome.length < 2 || partesNome.length > 7) return null;

  const textoFonte = `${fonte.titulo} ${fonte.trecho ?? ''}`;
  const cargo = textoFonte.match(
    /\b(?:s[oó]ci[oa](?:\s+(?:fundador[a]?|propriet[aá]ri[oa]))?|fundador[a]?|propriet[aá]ri[oa]|diretor[a]?|ceo|presidente|gestor[a]?|respons[aá]vel)\b/i,
  )?.[0];
  if (!cargo) return null;

  const baseSemPessoa = normalizar(textoFonte).replace(normalizar(nome), ' ');
  const termosEmpresa = normalizar(lead.nome)
    .split(' ')
    .filter((termo) => termo.length >= 3 && !TERMOS_GENERICOS.has(termo));
  if (!termosEmpresa.length || !termosEmpresa.some((termo) => baseSemPessoa.includes(termo))) {
    return null;
  }

  return {
    nome,
    cargo,
    senioridade: null,
    linkedin_url: fonte.url,
    localizacao: [lead.cidade, lead.estado].filter(Boolean).join(', ') || null,
    email: null,
    telefone: null,
    fonte: 'Pesquisa pública · LinkedIn',
  } satisfies LeadProspeccaoEntrada['decisores'][number];
}

function consultaPara(lead: LeadProspeccaoEntrada) {
  const localizacao = [lead.cidade, lead.estado].filter(Boolean).join(', ');
  return `"${lead.nome}" ${localizacao} fundador sócio proprietário diretor gerente responsável LinkedIn equipe`;
}

function fontesDosResultados(
  resultados: Awaited<ReturnType<typeof pesquisarComPerplexity>>,
): FontePesquisa[] {
  return resultados.flatMap((resultado) => {
    const titulo = texto(resultado.title);
    const url = urlPublica(resultado.url);
    if (!titulo || !url) return [];
    return [
      {
        titulo,
        url,
        trecho: texto(resultado.snippet),
        data: texto(resultado.last_updated) ?? texto(resultado.date),
      } satisfies FontePesquisa,
    ];
  });
}

function lotesDeCinco<T>(itens: T[]) {
  const lotes: T[][] = [];
  for (let indice = 0; indice < itens.length; indice += 5) {
    lotes.push(itens.slice(indice, indice + 5));
  }
  return lotes;
}

export async function pesquisarPossiveisDecisores(
  leads: LeadProspeccaoEntrada[],
  configuracao: ConfiguracaoPesquisa,
): Promise<{ leads: LeadProspeccaoEntrada[]; usos: UsoProvedorProspeccao[] }> {
  const fontesPorLead = new Map<string, FontePesquisa[]>();
  const usos: UsoProvedorProspeccao[] = [];

  for (const lote of lotesDeCinco(leads)) {
    if (configuracao.usarPerplexity) {
      const inicio = Date.now();
      try {
        const resultados = await pesquisarComPerplexity(lote.map(consultaPara), configuracao);
        const fontes = fontesDosResultados(resultados);
        for (const lead of lote) {
          fontesPorLead.set(
            lead.chave_externa,
            fontes.filter((fonte) => fonteRelacionada(fonte, lead)).slice(0, 5),
          );
        }
        usos.push({
          provedor: 'perplexity',
          operacao: 'pesquisa_decisores',
          status: 'concluido',
          unidades: 1,
          unidade: 'requisicao',
          custoUsdMicros: PERPLEXITY_SEARCH_USD_MICROS_POR_REQUISICAO,
          latenciaMs: Date.now() - inicio,
          metadados: { empresas: lote.length, resultados: fontes.length },
        });
      } catch {
        usos.push({
          provedor: 'perplexity',
          operacao: 'pesquisa_decisores',
          status: 'falhou',
          unidades: 0,
          unidade: 'requisicao',
          latenciaMs: Date.now() - inicio,
          metadados: { empresas: lote.length },
        });
      }
    }

    const semFonte = lote.filter(
      (lead) => (fontesPorLead.get(lead.chave_externa) ?? []).length === 0,
    );
    if (configuracao.serpApi && semFonte.length) {
      const pesquisasSerp = await Promise.all(
        semFonte.map(async (lead) => {
          const inicio = Date.now();
          try {
            const resultados = await pesquisarDecisorComSerpApi(
              consultaPara(lead),
              configuracao.serpApi!,
            );
            const fontes = fontesDosResultados(resultados)
              .filter((fonte) => fonteRelacionada(fonte, lead))
              .slice(0, 5);
            return {
              lead,
              fontes,
              uso: {
                provedor: 'serpapi' as const,
                operacao: 'pesquisa_decisores',
                status: 'concluido' as const,
                unidades: 1,
                unidade: 'requisicao' as const,
                custoUsdMicros: SERPAPI_SEARCH_USD_MICROS_POR_REQUISICAO,
                latenciaMs: Date.now() - inicio,
                metadados: { empresa: lead.chave_externa, resultados: fontes.length },
              },
            };
          } catch {
            return {
              lead,
              fontes: [] as FontePesquisa[],
              uso: {
                provedor: 'serpapi' as const,
                operacao: 'pesquisa_decisores',
                status: 'falhou' as const,
                unidades: 0,
                unidade: 'requisicao' as const,
                latenciaMs: Date.now() - inicio,
                metadados: { empresa: lead.chave_externa },
              },
            };
          }
        }),
      );
      for (const pesquisa of pesquisasSerp) {
        fontesPorLead.set(pesquisa.lead.chave_externa, pesquisa.fontes);
        usos.push(pesquisa.uso);
      }
    }
  }

  return {
    usos,
    leads: leads.map((lead) => {
      const fontes = fontesPorLead.get(lead.chave_externa) ?? [];
      const encontrado = fontes
        .map((fonte) => possivelDecisorDaFonte(fonte, lead))
        .find((decisor) => decisor !== null);
      const jaExiste = encontrado
        ? lead.decisores.some(
            (decisor) =>
              decisor.linkedin_url === encontrado.linkedin_url ||
              normalizar(decisor.nome) === normalizar(encontrado.nome),
          )
        : true;
      return {
        ...lead,
        decisores:
          encontrado && !jaExiste ? [encontrado, ...lead.decisores].slice(0, 5) : lead.decisores,
        dados: {
          ...lead.dados,
          pesquisa_decisores: fontes,
        },
      };
    }),
  };
}
