/**
 * Captura de atribuição.
 *
 * POR QUE É 100% CLIENT-SIDE
 * Ler `searchParams` no servidor tiraria a landing do shell estático e transformaria
 * um hit de CDN de ~40ms numa invocação de função Node — em cada clique pago. A
 * atribuição é lida do `window.location` depois da hidratação, e a página continua
 * pré-renderizada.
 *
 * O MODELO DE TOQUE — é aqui que quase toda implementação erra
 * Origem e clique NÃO seguem a mesma regra:
 *
 *   · utm_source / utm_medium / utm_campaign / src  →  PRIMEIRO toque vence.
 *     Descobrir quem apresentou a marca é a pergunta de atribuição.
 *
 *   · gclid / gbraid / wbraid / fbclid              →  ÚLTIMO toque sempre sobrescreve.
 *     O click ID PRECISA ser o da sessão que gerou a conversão, senão o import de
 *     conversão offline do Google/Meta não casa e a campanha fica sem retorno
 *     reportado — silenciosamente.
 *
 * Guardar os dois como objetos separados é o que permite responder "quem trouxe" e
 * "quem fechou" sem que um destrua o outro.
 */

export const CHAVES_PERMITIDAS = [
  'src',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'xcod',
  'sck',
] as const;

export type ChaveAtribuicao = (typeof CHAVES_PERMITIDAS)[number];

/** Click IDs: sempre último toque. O resto é primeiro toque. */
const CLICK_IDS = new Set<string>(['gclid', 'gbraid', 'wbraid', 'fbclid']);

export interface Atribuicao {
  first_touch: Partial<Record<ChaveAtribuicao, string>>;
  last_touch: Partial<Record<ChaveAtribuicao, string>>;
  landing_page: string;
  referrer: string;
  first_seen_at: string;
  /** Chave de junção para conversões server-side (CAPI, Enhanced Conversions). */
  anonymous_id: string;
}

const CHAVE_STORAGE = 'subido_attrib_v1';
const CHAVE_COOKIE = 'subido_attrib';
/** Formato que leitores legados esperam. Manter custa nada e evita deploy coordenado. */
const CHAVE_SESSION = 'utm_params';
const NOVENTA_DIAS = 90 * 24 * 60 * 60;
const TETO_BYTES = 1536;

/**
 * Estes valores viajam para a URL de checkout e, mais tarde, para o banco. Tratá-los
 * como confiáveis é vetor de injeção vivo — vêm da barra de endereço de qualquer um.
 */
function sanitizar(valor: string): string | null {
  const limpo = valor.slice(0, 200).replace(/[^A-Za-z0-9_\-.|:]/g, '');
  return limpo.length > 0 ? limpo : null;
}

export function lerDaUrl(search: string): Partial<Record<ChaveAtribuicao, string>> {
  const params = new URLSearchParams(search);
  const out: Partial<Record<ChaveAtribuicao, string>> = {};
  for (const chave of CHAVES_PERMITIDAS) {
    const bruto = params.get(chave);
    if (!bruto) continue;
    const valor = sanitizar(bruto);
    if (valor) out[chave] = valor;
  }
  return out;
}

function lerArmazenado(): Atribuicao | null {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return null;
    const dado = JSON.parse(bruto) as Atribuicao & { expira_em?: number };
    if (dado.expira_em && Date.now() > dado.expira_em) return null;
    return dado;
  } catch {
    return null;
  }
}

/**
 * Funde o que já existia com o que chegou nesta visita, respeitando o modelo de toque.
 * Retorna o estado final — nunca lança, porque falha de storage (aba anônima, cota
 * cheia) não pode derrubar a página.
 */
export function capturar(search: string, referrer: string, href: string): Atribuicao {
  const chegando = lerDaUrl(search);
  const anterior = lerArmazenado();

  const first_touch = { ...chegando, ...anterior?.first_touch };
  // Click IDs desta visita sobrescrevem: precisam ser os da sessão que converte.
  const last_touch = { ...anterior?.last_touch, ...chegando };
  for (const chave of CLICK_IDS) {
    const k = chave as ChaveAtribuicao;
    if (chegando[k]) {
      last_touch[k] = chegando[k];
      first_touch[k] = chegando[k];
    }
  }

  const atribuicao: Atribuicao = {
    first_touch,
    last_touch,
    landing_page: anterior?.landing_page ?? href.split('?')[0] ?? '',
    referrer: anterior?.referrer ?? referrer,
    first_seen_at: anterior?.first_seen_at ?? new Date().toISOString(),
    anonymous_id: anterior?.anonymous_id ?? crypto.randomUUID(),
  };

  persistir(atribuicao);
  return atribuicao;
}

function persistir(a: Atribuicao) {
  const payload = JSON.stringify({ ...a, expira_em: Date.now() + NOVENTA_DIAS * 1000 });
  if (payload.length > TETO_BYTES) return;

  try {
    localStorage.setItem(CHAVE_STORAGE, payload);
  } catch {
    /* aba anônima ou cota cheia — segue sem persistir */
  }

  try {
    // Cookie first-party para o servidor ler no checkout. Não é HttpOnly porque quem
    // escreve é o JS; `Lax` basta e evita envio em requisição cross-site.
    document.cookie = `${CHAVE_COOKIE}=${encodeURIComponent(
      JSON.stringify({ a: a.anonymous_id, f: a.first_touch, l: a.last_touch }),
    )}; path=/; max-age=${NOVENTA_DIAS}; SameSite=Lax; Secure`;
  } catch {
    /* ignora */
  }

  try {
    sessionStorage.setItem(CHAVE_SESSION, JSON.stringify(a.last_touch));
  } catch {
    /* ignora */
  }
}

export function recuperar(): Atribuicao | null {
  if (typeof window === 'undefined') return null;
  return lerArmazenado();
}

/** Anexa a atribuição a uma URL de checkout, sem duplicar parâmetro já presente. */
export function comAtribuicao(url: string): string {
  const a = recuperar();
  if (!a) return url;
  try {
    const alvo = new URL(url, window.location.origin);
    for (const [chave, valor] of Object.entries({ ...a.first_touch, ...a.last_touch })) {
      if (valor && !alvo.searchParams.has(chave)) alvo.searchParams.set(chave, valor);
    }
    alvo.searchParams.set('aid', a.anonymous_id);
    return alvo.toString();
  } catch {
    return url;
  }
}
