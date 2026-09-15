'use client';

import type { FiltroPipeline } from './acao-pipeline';

export const PREFIXO_QUADRO = 'subido-quadro-vendas:';
const EVENTO = 'subido:quadro-vendas';
export const VALIDADE_QUADRO = 8 * 60 * 60 * 1000;
export type FaseQuadro = 'entrada' | 'conversa' | 'proposta' | 'ganho';
export type RetornoQuadro = { id: string; href: string; topo: number };
export type EstadoQuadro = {
  busca: string;
  filtro: FiltroPipeline;
  fase: FaseQuadro;
  historico: boolean;
  retorno: RetornoQuadro | null;
};
export const QUADRO_VAZIO: EstadoQuadro = {
  busca: '',
  filtro: 'todas',
  fase: 'entrada',
  historico: false,
  retorno: null,
};
// Fallback limitado à aba quando o navegador bloqueia sessionStorage.
const memoria = new Map<string, string>();

function registro(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

export function interpretarQuadro(raw: string, agora = Date.now()): EstadoQuadro {
  try {
    const item = registro(JSON.parse(raw) as unknown);
    if (
      item.v !== 1 ||
      typeof item.em !== 'number' ||
      !Number.isFinite(item.em) ||
      agora - item.em > VALIDADE_QUADRO ||
      item.em > agora
    )
      return QUADRO_VAZIO;
    const retorno = registro(item.retorno);
    return {
      busca: typeof item.busca === 'string' ? item.busca.slice(0, 160) : '',
      filtro:
        typeof item.filtro === 'string' &&
        ['todas', 'atencao', 'sem_acao', 'proposta'].includes(item.filtro)
          ? (item.filtro as FiltroPipeline)
          : 'todas',
      fase:
        typeof item.fase === 'string' &&
        ['entrada', 'conversa', 'proposta', 'ganho'].includes(item.fase)
          ? (item.fase as FaseQuadro)
          : 'entrada',
      historico: item.historico === true,
      retorno:
        typeof retorno.id === 'string' &&
        /^[a-zA-Z0-9-]{1,80}$/.test(retorno.id) &&
        typeof retorno.href === 'string' &&
        /^\/(vendas|propostas|entregas)\/[a-zA-Z0-9-]+(?:\?[^#]*)?$/.test(retorno.href) &&
        retorno.href.length <= 400 &&
        typeof retorno.topo === 'number' &&
        Number.isFinite(retorno.topo) &&
        Math.abs(retorno.topo) <= 10000
          ? { id: retorno.id, href: retorno.href, topo: retorno.topo }
          : null,
    };
  } catch {
    return QUADRO_VAZIO;
  }
}

export function lerQuadro(conta: string): string {
  if (typeof window === 'undefined') return '';
  const chave = PREFIXO_QUADRO + conta;
  if (memoria.has(chave)) return memoria.get(chave)!;
  try {
    return sessionStorage.getItem(chave) ?? '';
  } catch {
    return '';
  }
}

export function salvarQuadro(conta: string, estado: EstadoQuadro) {
  const chave = PREFIXO_QUADRO + conta;
  const valor = JSON.stringify({
    ...estado,
    busca: estado.busca.slice(0, 160),
    v: 1,
    em: Date.now(),
  });
  try {
    sessionStorage.setItem(chave, valor);
    memoria.delete(chave);
  } catch {
    memoria.set(chave, valor);
    if (memoria.size > 8) memoria.delete(memoria.keys().next().value!);
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function observarQuadro(avisar: () => void) {
  window.addEventListener(EVENTO, avisar);
  return () => window.removeEventListener(EVENTO, avisar);
}

export function limparQuadrosVendas() {
  memoria.clear();
  try {
    for (const chave of Object.keys(sessionStorage)) {
      if (chave.startsWith(PREFIXO_QUADRO)) sessionStorage.removeItem(chave);
    }
  } catch {
    /* Logout não depende de storage disponível. */
  }
  window.dispatchEvent(new Event(EVENTO));
}
