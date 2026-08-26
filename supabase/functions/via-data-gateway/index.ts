const cabecalhosJson = { 'Content-Type': 'application/json; charset=utf-8' };

function resposta(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhosJson });
}

function registro(valor: unknown): Record<string, unknown> | null {
  return valor && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null;
}

function urlPublica(valor: unknown) {
  if (typeof valor !== 'string' || valor.length > 2_048) return null;
  try {
    const url = new URL(valor);
    const host = url.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

async function jsonDoProvedor(respostaProvedor: Response) {
  const corpo: unknown = await respostaProvedor.json().catch(() => null);
  if (!respostaProvedor.ok) {
    console.error('[via-data-gateway] provedor respondeu', respostaProvedor.status);
    const erro = registro(corpo);
    const detalhe =
      typeof erro?.detail === 'string'
        ? erro.detail.slice(0, 180)
        : typeof erro?.message === 'string'
          ? erro.message.slice(0, 180)
          : null;
    return resposta(502, {
      erro: 'provedor_indisponivel',
      provedor_status: respostaProvedor.status,
      detalhe,
    });
  }
  return resposta(200, { data: corpo });
}

Deno.serve(async (requisicao) => {
  if (requisicao.method !== 'POST') return resposta(405, { erro: 'metodo_nao_permitido' });

  const segredo = Deno.env.get('VIA_DATA_GATEWAY_SECRET');
  if (!segredo || requisicao.headers.get('x-via-data-secret') !== segredo) {
    return resposta(401, { erro: 'nao_autorizado' });
  }

  const corpo = registro(await requisicao.json().catch(() => null));
  const payload = registro(corpo?.payload);
  const acao = corpo?.acao;

  if (acao === 'firecrawl_scrape') {
    const url = urlPublica(payload?.url);
    const chave = Deno.env.get('FIRECRAWL_API_KEY');
    if (!url || !chave) return resposta(503, { erro: 'firecrawl_indisponivel' });
    const retorno = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links'],
        onlyMainContent: false,
        maxAge: 172_800_000,
        timeout: 9_000,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    return jsonDoProvedor(retorno);
  }

  if (acao === 'perplexity_search') {
    const chave = Deno.env.get('PERPLEXITY_API_KEY');
    const consultas = Array.isArray(payload?.query)
      ? payload.query.filter((item) => typeof item === 'string' && item.length <= 500).slice(0, 5)
      : [];
    if (!chave || !consultas.length) return resposta(503, { erro: 'perplexity_indisponivel' });
    const retorno = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: consultas,
        max_results: 10,
        country: 'BR',
        search_language_filter: ['pt'],
      }),
      signal: AbortSignal.timeout(18_000),
    });
    return jsonDoProvedor(retorno);
  }

  return resposta(400, { erro: 'acao_invalida' });
});
