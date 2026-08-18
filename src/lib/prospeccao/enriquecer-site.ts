import 'server-only';

import {
  emailsValidos,
  jsonDaResposta,
  qualificar,
  redesDeUrls,
  telefonesUnicos,
  texto,
  unicos,
  type Registro,
} from './normalizacao';
import type { LeadProspeccaoEntrada } from './schema';

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
  const urlsNoTexto = markdown.match(/https?:\/\/[^\s)\]}>'"]+/gi) ?? [];
  return {
    emails: emailsValidos([...emailsEmLinks, ...emailsNoTexto]),
    telefones: telefonesUnicos([...telefonesEmLinks, ...telefonesNoTexto]).slice(0, 12),
    redes: redesDeUrls([...links, ...urlsNoTexto]),
  };
}

async function rasparPagina(url: string, chave: string) {
  const resposta = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
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
  return {
    markdown: texto(json.data?.markdown) ?? '',
    links: Array.isArray(json.data?.links)
      ? json.data.links.filter((item): item is string => typeof item === 'string')
      : [],
    metadata: json.data?.metadata,
  };
}

function paginasDeContato(site: string, links: string[]) {
  const origem = new URL(site).origin;
  return [...new Set(links)]
    .filter((link) => {
      try {
        const url = new URL(link, site);
        return (
          url.origin === origem &&
          /\/(contato|contact|sobre|about|quem-somos|equipe|team)(\/|$)/i.test(url.pathname)
        );
      } catch {
        return false;
      }
    })
    .slice(0, 2);
}

export async function mapearComLimite<T, R>(
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

export async function enriquecerSite(lead: LeadProspeccaoEntrada, chave: string) {
  if (!lead.site_url) return lead;
  try {
    const inicial = await rasparPagina(lead.site_url, chave);
    const complementares = await mapearComLimite(
      paginasDeContato(lead.site_url, inicial.links),
      2,
      (url) => rasparPagina(url, chave),
    );
    const paginas = [inicial, ...complementares];
    const markdown = paginas.map((pagina) => pagina.markdown).join('\n');
    const links = paginas.flatMap((pagina) => pagina.links);
    const resumo = markdown ? resumoDoMarkdown(inicial.markdown || markdown) : null;
    const contatos = contatosDoSite(markdown, links);
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
        site_titulo: texto(inicial.metadata?.title),
        site_descricao: texto(inicial.metadata?.description),
        site_resumo: resumo,
        paginas_consultadas: paginas.length,
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
