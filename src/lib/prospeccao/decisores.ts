import 'server-only';

import { PERPLEXITY_SEARCH_USD_MICROS_POR_REQUISICAO, type UsoProvedorProspeccao } from './custos';
import { pesquisarComPerplexity, type ConfiguracaoGatewayDados } from './gateway';
import { texto, urlPublica } from './normalizacao';
import type { LeadProspeccaoEntrada } from './schema';

type ConfiguracaoPesquisa = {
  firecrawl: string | null;
  perplexity: string | null;
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

function consultaPara(lead: LeadProspeccaoEntrada) {
  const localizacao = [lead.cidade, lead.estado].filter(Boolean).join(', ');
  return `"${lead.nome}" ${localizacao} fundador sócio proprietário diretor gerente responsável LinkedIn equipe`;
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
    const inicio = Date.now();
    try {
      const resultados = await pesquisarComPerplexity(lote.map(consultaPara), configuracao);
      const fontes = resultados.flatMap((resultado) => {
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

  return {
    usos,
    leads: leads.map((lead) => ({
      ...lead,
      dados: {
        ...lead.dados,
        pesquisa_decisores: fontesPorLead.get(lead.chave_externa) ?? [],
      },
    })),
  };
}
