import type { TentativaTexto } from './registrar-envio';

const PREFIXO = 'subido:sobral:rascunho:v1:';
const LIMPEZA = 'subido:sobral:limpeza';
const EVENTO = 'subido:sobral:rascunhos';
const PRAZO = 7 * 24 * 60 * 60 * 1000;
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
export type RascunhoSobral = {
  id: string;
  dono: string;
  conversa: string;
  texto: string;
  anexos: boolean;
  salvoEm: number;
  tentativa?: TentativaTexto;
};

/** Apenas texto e recibo, sem arquivos, tokens ou histórico. Nunca enviado à IA. */
export function lerRascunhoSobral(
  raw: string | null,
  dono: string,
  agora = Date.now(),
): RascunhoSobral | null {
  if (!raw || raw.length > 55_000) return null;
  try {
    const r = JSON.parse(raw) as RascunhoSobral;
    if (
      !r ||
      !uuid.test(r.id) ||
      r.dono !== dono ||
      !uuid.test(dono) ||
      typeof r.conversa !== 'string' ||
      r.conversa.length > 200 ||
      typeof r.texto !== 'string' ||
      r.texto.length > 8000 ||
      typeof r.anexos !== 'boolean' ||
      !Number.isFinite(r.salvoEm) ||
      r.salvoEm > agora ||
      agora - r.salvoEm > PRAZO
    )
      return null;
    const t = r.tentativa;
    if (
      t &&
      (!uuid.test(t.threadId) ||
        !uuid.test(t.mensagemId) ||
        t.dono !== dono ||
        t.mensagem !== r.texto ||
        !t.mensagem.trim() ||
        typeof t.nova !== 'boolean' ||
        t.solicitado !== true ||
        r.anexos)
    )
      return null;
    return {
      id: r.id,
      dono,
      conversa: r.conversa,
      texto: r.texto,
      anexos: r.anexos,
      salvoEm: r.salvoEm,
      ...(t
        ? {
            tentativa: {
              threadId: t.threadId,
              mensagemId: t.mensagemId,
              mensagem: t.mensagem,
              nova: t.nova,
              solicitado: true,
              dono,
            },
          }
        : {}),
    };
  } catch {
    return null;
  }
}

export function epocaRascunhos(): string {
  try {
    return localStorage.getItem(LIMPEZA) ?? '';
  } catch {
    return '';
  }
}

export function listarRascunhos(dono?: string): RascunhoSobral[] {
  if (!dono || !uuid.test(dono)) return [];
  try {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(`${PREFIXO}${dono}:`))
      .map((key) => lerRascunhoSobral(localStorage.getItem(key), dono))
      .filter((r): r is RascunhoSobral => r !== null)
      .sort((a, b) => b.salvoEm - a.salvoEm || a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}

export function gravarRascunho(r: RascunhoSobral, epoca: string): boolean {
  const validado = lerRascunhoSobral(JSON.stringify(r), r.dono);
  if (epoca !== epocaRascunhos() || !validado) return false;
  try {
    // A limpeza só remove registros expirados/inválidos desta conta; não expulsa texto ativo.
    for (const key of Object.keys(localStorage)) {
      if (
        key.startsWith(`${PREFIXO}${r.dono}:`) &&
        !lerRascunhoSobral(localStorage.getItem(key), r.dono)
      )
        localStorage.removeItem(key);
    }
    const key = `${PREFIXO}${r.dono}:${r.id}`;
    if (!localStorage.getItem(key) && listarRascunhos(r.dono).length >= 50) return false;
    localStorage.setItem(key, JSON.stringify(validado));
    window.dispatchEvent(new Event(EVENTO));
    return true;
  } catch {
    return false;
  }
}

export function removerRascunho(r: RascunhoSobral) {
  try {
    const key = `${PREFIXO}${r.dono}:${r.id}`;
    const atual = lerRascunhoSobral(localStorage.getItem(key), r.dono);
    // Uma confirmação antiga não apaga texto mais recente de outra aba.
    if (atual?.salvoEm === r.salvoEm && atual.texto === r.texto) localStorage.removeItem(key);
    window.dispatchEvent(new Event(EVENTO));
  } catch {
    /* Sem storage, o texto em memória permanece disponível. */
  }
}

export function limparRascunhosSobral() {
  try {
    for (const key of Object.keys(localStorage))
      if (key.startsWith(PREFIXO)) localStorage.removeItem(key);
    // Libera o espaço dos rascunhos antes de gravar a época, inclusive com quota cheia.
    localStorage.setItem(LIMPEZA, crypto.randomUUID());
  } catch {
    /* Encerrar sessão não depende do armazenamento. */
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function observarRascunhos(atualizar: () => void) {
  const storage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(PREFIXO) || e.key === LIMPEZA) atualizar();
  };
  window.addEventListener(EVENTO, atualizar);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(EVENTO, atualizar);
    window.removeEventListener('storage', storage);
  };
}
