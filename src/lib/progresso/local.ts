'use client';

import { useSyncExternalStore } from 'react';

/**
 * Progresso de aulas NO DISPOSITIVO — `localStorage`, até o backend existir.
 *
 * TODO(backend): trocar por tabela + Server Action quando o schema de progresso
 * entrar. A API daqui foi desenhada para essa troca: quem consome recebe um
 * `Set<string>` de aulas concluídas e não sabe de onde ele veio. As query keys
 * (`keys.formacoes.*`) já existem para o dia da migração.
 *
 * POR QUE `useSyncExternalStore` E NÃO `useEffect` + `setState`
 * O localStorage é um store EXTERNO ao React (regra registrada no CLAUDE.md).
 * O snapshot de SERVIDOR devolve o estado vazio: o HTML chega com 0% e o cliente
 * corrige após a hidratação — sem mismatch. A janela de "0% por um frame" é o
 * custo honesto de progresso local; some quando o backend assumir.
 *
 * LIMITAÇÃO DITA, NÃO ESCONDIDA: este progresso não acompanha o usuário entre
 * dispositivos. É progresso do navegador, não da conta.
 */

const CHAVE = 'subido_progresso_v1';

type Estado = {
  /** aulaId → ISO da conclusão. */
  aulas: Record<string, string>;
  /** slug da formação → ISO do último toque (alimenta o "continue de onde parou"). */
  formacoes: Record<string, string>;
};

const VAZIO: Estado = { aulas: {}, formacoes: {} };

/* Cache do snapshot: `useSyncExternalStore` exige que `getSnapshot` devolva a
   MESMA referência enquanto nada mudou — parsear o JSON a cada chamada criaria um
   objeto novo por render e um loop infinito de re-render. */
let cache: Estado | null = null;
const ouvintes = new Set<() => void>();

function ler(): Estado {
  if (cache) return cache;
  try {
    const cru = localStorage.getItem(CHAVE);
    cache = cru ? (JSON.parse(cru) as Estado) : VAZIO;
  } catch {
    cache = VAZIO;
  }
  return cache;
}

function gravar(proximo: Estado) {
  cache = proximo;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(proximo));
  } catch {
    /* Aba anônima com quota zerada: o estado vive só em memória nesta sessão. */
  }
  for (const avisar of ouvintes) avisar();
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  /* Outra aba concluiu uma aula → o evento `storage` invalida o cache desta. */
  const aoMudarStorage = (e: StorageEvent) => {
    if (e.key === CHAVE) {
      cache = null;
      avisar();
    }
  };
  window.addEventListener('storage', aoMudarStorage);
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener('storage', aoMudarStorage);
  };
}

const snapshotServidor = () => VAZIO;

/** Estado bruto do progresso. Re-renderiza quando qualquer aula é concluída. */
export function useProgresso(): Estado {
  return useSyncExternalStore(assinar, ler, snapshotServidor);
}

export function concluirAula(aulaId: string, formacaoSlug: string) {
  const atual = ler();
  if (atual.aulas[aulaId]) return;
  const agora = new Date().toISOString();
  gravar({
    aulas: { ...atual.aulas, [aulaId]: agora },
    formacoes: { ...atual.formacoes, [formacaoSlug]: agora },
  });
}

/** Registra "estive aqui" sem concluir — mantém a retomada apontando certo. */
export function tocarFormacao(formacaoSlug: string) {
  const atual = ler();
  gravar({
    aulas: atual.aulas,
    formacoes: { ...atual.formacoes, [formacaoSlug]: new Date().toISOString() },
  });
}

/* ── Derivações puras (recebem o estado, não o leem) ─────────────────────────── */

export function contarConcluidas(estado: Estado, aulaIds: string[]): number {
  return aulaIds.reduce((n, id) => (estado.aulas[id] ? n + 1 : n), 0);
}

export function percentual(feitas: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((feitas / total) * 100);
}

/** O slug da formação tocada mais recentemente — ou null se nunca houve toque. */
export function formacaoMaisRecente(estado: Estado): string | null {
  let melhor: string | null = null;
  let quando = '';
  for (const [slug, iso] of Object.entries(estado.formacoes)) {
    if (iso > quando) {
      quando = iso;
      melhor = slug;
    }
  }
  return melhor;
}
