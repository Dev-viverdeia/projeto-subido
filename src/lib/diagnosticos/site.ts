import 'server-only';

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { FonteDiagnostico } from './schema';

const LIMITE_BYTES = 600_000;
const TIMEOUT_MS = 10_000;
const REDIRECIONAMENTOS = 3;
const LIMITE_PAGINAS = 5;

const TERMOS_RELEVANTES = [
  'atendimento',
  'contato',
  'fale',
  'ajuda',
  'suporte',
  'whatsapp',
  'duvidas',
  'faq',
  'orcamento',
  'agendar',
];

export type PaginaDiagnostico = {
  titulo: string;
  url: string;
  texto: string;
};

export class ErroColetaSite extends Error {
  constructor(readonly codigo: 'url_invalida' | 'destino_bloqueado' | 'indisponivel') {
    super(codigo);
    this.name = 'ErroColetaSite';
  }
}

export function normalizarSite(entrada: string | null | undefined): URL | null {
  const limpa = entrada?.trim();
  if (!limpa) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(limpa) ? limpa : `https://${limpa}`);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    if (url.port && !['80', '443'].includes(url.port)) return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

export async function coletarJornadaPublica(site: URL): Promise<{
  paginas: PaginaDiagnostico[];
  fontes: FonteDiagnostico[];
}> {
  const primeira = await lerPagina(site);
  const links = primeira.links.slice(0, LIMITE_PAGINAS - 1);
  const adicionais = await Promise.allSettled(links.map((link) => lerPagina(link)));
  const paginas: PaginaDiagnostico[] = [primeira.pagina];

  for (const resultado of adicionais) {
    if (resultado.status === 'fulfilled') paginas.push(resultado.value.pagina);
  }

  return {
    paginas,
    fontes: paginas.map((pagina) => ({
      tipo: 'site',
      titulo: pagina.titulo,
      url: pagina.url,
      status: 'lida',
    })),
  };
}

async function lerPagina(urlInicial: URL): Promise<{
  pagina: PaginaDiagnostico;
  links: URL[];
}> {
  let atual = new URL(urlInicial);

  for (let tentativa = 0; tentativa <= REDIRECIONAMENTOS; tentativa += 1) {
    await validarDestino(atual);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const resposta = await fetch(atual, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,text/plain;q=0.8',
          'User-Agent': 'SubidoDiagnostico/1.0 (+https://projeto-subido.vercel.app)',
        },
        cache: 'no-store',
      });

      if ([301, 302, 303, 307, 308].includes(resposta.status)) {
        const destino = resposta.headers.get('location');
        if (!destino || tentativa === REDIRECIONAMENTOS) {
          throw new ErroColetaSite('indisponivel');
        }
        atual = new URL(destino, atual);
        continue;
      }

      if (!resposta.ok) throw new ErroColetaSite('indisponivel');
      const tipo = resposta.headers.get('content-type')?.toLowerCase() ?? '';
      if (!tipo.includes('text/html') && !tipo.includes('text/plain')) {
        throw new ErroColetaSite('indisponivel');
      }

      const tamanho = Number(resposta.headers.get('content-length') ?? '0');
      if (tamanho > LIMITE_BYTES) throw new ErroColetaSite('indisponivel');
      const html = await lerCorpoLimitado(resposta);
      const texto = limparHtml(html).slice(0, 50_000);
      if (texto.length < 80) throw new ErroColetaSite('indisponivel');

      return {
        pagina: {
          titulo: extrairTitulo(html) ?? atual.hostname,
          url: atual.toString(),
          texto,
        },
        links: extrairLinksRelevantes(html, atual),
      };
    } catch (erro) {
      if (erro instanceof ErroColetaSite) throw erro;
      throw new ErroColetaSite('indisponivel');
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ErroColetaSite('indisponivel');
}

async function lerCorpoLimitado(resposta: Response): Promise<string> {
  if (!resposta.body) return '';
  const leitor = resposta.body.getReader();
  const blocos: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > LIMITE_BYTES) {
      await leitor.cancel();
      throw new ErroColetaSite('indisponivel');
    }
    blocos.push(value);
  }

  const unido = new Uint8Array(total);
  let deslocamento = 0;
  for (const bloco of blocos) {
    unido.set(bloco, deslocamento);
    deslocamento += bloco.byteLength;
  }
  return new TextDecoder().decode(unido);
}

async function validarDestino(url: URL): Promise<void> {
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal'
  ) {
    throw new ErroColetaSite('destino_bloqueado');
  }

  const direto = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true, verbatim: true });
  if (!direto.length || direto.some(({ address }) => !ehEnderecoPublico(address))) {
    throw new ErroColetaSite('destino_bloqueado');
  }
}

function ehEnderecoPublico(endereco: string): boolean {
  const valor = endereco.toLowerCase();
  if (valor.includes(':')) {
    if (valor.startsWith('::ffff:')) return ehEnderecoPublico(valor.slice('::ffff:'.length));
    return !(
      valor === '::' ||
      valor === '::1' ||
      valor.startsWith('fc') ||
      valor.startsWith('fd') ||
      valor.startsWith('fe8') ||
      valor.startsWith('fe9') ||
      valor.startsWith('fea') ||
      valor.startsWith('feb')
    );
  }

  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(valor)) return false;
  const partes = valor.split('.').map(Number);
  if (partes.some((parte) => parte > 255)) return false;
  const [a = 0, b = 0] = partes;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function extrairLinksRelevantes(html: string, base: URL): URL[] {
  const encontrados: Array<{ url: URL; prioridade: number }> = [];
  const vistos = new Set<string>();
  const regex = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let correspondencia: RegExpExecArray | null;

  while ((correspondencia = regex.exec(html))) {
    const href = decodificar(correspondencia[1] ?? '').trim();
    const rotulo = limparHtml(correspondencia[2] ?? '').toLowerCase();
    if (!href || href.startsWith('#')) continue;

    try {
      const url = new URL(href, base);
      url.hash = '';
      if (url.origin !== base.origin || !['http:', 'https:'].includes(url.protocol)) continue;
      const chave = url.toString();
      if (vistos.has(chave) || chave === base.toString()) continue;
      const alvo = `${url.pathname} ${rotulo}`.toLowerCase();
      const prioridade = TERMOS_RELEVANTES.findIndex((termo) => alvo.includes(termo));
      if (prioridade === -1) continue;
      vistos.add(chave);
      encontrados.push({ url, prioridade });
    } catch {
      /* Link quebrado não invalida a página que foi lida. */
    }
  }

  return encontrados.sort((a, b) => a.prioridade - b.prioridade).map(({ url }) => url);
}

function extrairTitulo(html: string): string | null {
  const titulo = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return titulo ? decodificar(titulo).replace(/\s+/g, ' ').trim().slice(0, 200) : null;
}

function limparHtml(html: string): string {
  return decodificar(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--([\s\S]*?)-->/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function decodificar(texto: string): string {
  return texto
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}
