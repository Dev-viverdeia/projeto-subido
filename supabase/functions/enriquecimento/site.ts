const LIMITE_BYTES = 500_000;
const TIMEOUT_MS = 8_000;
const REDIRECIONAMENTOS = 3;

export type PaginaPublica = {
  titulo: string;
  url: string;
  texto: string;
};

/** Entrada humana vira uma origem HTTPS, nunca um path ou protocolo arbitrário. */
export function normalizarSite(entrada: string | undefined): URL | null {
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

export async function lerPaginaPublica(urlInicial: URL): Promise<PaginaPublica> {
  let atual = urlInicial;

  for (let tentativa = 0; tentativa <= REDIRECIONAMENTOS; tentativa += 1) {
    await validarDestino(atual);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let resposta: Response;
    try {
      resposta = await fetch(atual, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,text/plain;q=0.8',
          'User-Agent': 'SubidoLeadResearch/1.0 (+https://projeto-subido.vercel.app)',
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(resposta.status)) {
      const destino = resposta.headers.get('location');
      if (!destino || tentativa === REDIRECIONAMENTOS) {
        throw new Error('redirecionamento_invalido');
      }
      atual = new URL(destino, atual);
      continue;
    }

    if (!resposta.ok) throw new Error(`site_http_${resposta.status}`);

    const tipo = resposta.headers.get('content-type')?.toLowerCase() ?? '';
    if (!tipo.includes('text/html') && !tipo.includes('text/plain')) {
      throw new Error('site_formato_invalido');
    }

    const tamanho = Number(resposta.headers.get('content-length') ?? '0');
    if (tamanho > LIMITE_BYTES) throw new Error('site_muito_grande');

    const html = (await resposta.text()).slice(0, LIMITE_BYTES);
    const titulo = extrairTitulo(html) ?? atual.hostname;
    // O dossiê precisa de posicionamento, serviços e sinais operacionais — não
    // de uma cópia integral da página. O teto antigo de 45 kB tornava o prompt
    // três vezes maior sem melhorar a decisão e fazia o modelo exceder o tempo
    // do processamento em segundo plano.
    const texto = limparHtml(html).slice(0, 14_000);
    if (texto.length < 80) throw new Error('site_sem_conteudo');

    return { titulo, url: atual.toString(), texto };
  }

  throw new Error('site_indisponivel');
}

async function validarDestino(url: URL): Promise<void> {
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal' ||
    ehIpPrivado(host)
  ) {
    throw new Error('site_nao_permitido');
  }

  /* DNS também é conferido: bloquear só o texto do hostname deixaria um domínio
     do usuário apontar para 127.0.0.1 ou para o metadata service. */
  const respostas = await Promise.allSettled([
    Deno.resolveDns(host, 'A'),
    Deno.resolveDns(host, 'AAAA'),
  ]);
  const ips = respostas.flatMap((resultado) =>
    resultado.status === 'fulfilled' ? resultado.value : [],
  );
  if (!ips.length || ips.some(ehIpPrivado)) throw new Error('site_nao_permitido');
}

function ehIpPrivado(ip: string): boolean {
  const valor = ip.toLowerCase();
  if (valor.includes(':')) {
    return (
      valor === '::1' ||
      valor === '::' ||
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
  if (partes.some((parte) => parte > 255)) return true;
  return (
    partes[0] === 0 ||
    partes[0] === 10 ||
    partes[0] === 127 ||
    (partes[0] === 169 && partes[1] === 254) ||
    (partes[0] === 172 && partes[1] >= 16 && partes[1] <= 31) ||
    (partes[0] === 192 && partes[1] === 168) ||
    partes[0] >= 224
  );
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
