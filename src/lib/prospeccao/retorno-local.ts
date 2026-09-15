'use client';

import { origemProspeccao, type OrigemProspeccao } from './retorno';

const CHAVE = 'subido:retorno-prospeccao:v1';
export const VALIDADE_RETORNO = 8 * 60 * 60 * 1000;
type Posicao = OrigemProspeccao & { topo: number; largura: number; em: number };
let memoria: string | null = null;

export function interpretarPosicao(raw: string | null, agora = Date.now()): Posicao | null {
  try {
    const p = JSON.parse(raw ?? 'null') as Partial<Posicao> | null;
    if (
      !p ||
      !origemProspeccao(p.lista, p.empresa) ||
      typeof p.topo !== 'number' ||
      !Number.isFinite(p.topo) ||
      Math.abs(p.topo) > 100000 ||
      typeof p.largura !== 'number' ||
      !Number.isFinite(p.largura) ||
      p.largura < 1 ||
      p.largura > 10000 ||
      typeof p.em !== 'number' ||
      !Number.isFinite(p.em) ||
      p.em > agora ||
      agora - p.em > VALIDADE_RETORNO
    )
      return null;
    return p as Posicao;
  } catch {
    return null;
  }
}

export function guardarRetornoProspeccao(origem: OrigemProspeccao) {
  const card = document.getElementById(`empresa-${origem.empresa}`)?.closest('article');
  if (!card) return;
  const valor = JSON.stringify({
    ...origem,
    topo: card.getBoundingClientRect().top,
    largura: innerWidth,
    em: Date.now(),
  });
  memoria = valor;
  try {
    sessionStorage.setItem(CHAVE, valor);
  } catch {
    /* A navegação funciona sem armazenamento. */
  }

  // Congela a lista efetivamente aberta, inclusive quando /prospeccao escolheu a mais recente.
  // replaceState não acrescenta uma etapa ao botão Voltar do navegador nem rola a tela.
  const url = new URL(window.location.href);
  url.searchParams.set('lista', origem.lista);
  url.searchParams.set('empresa', origem.empresa);
  url.searchParams.delete('busca');
  url.searchParams.delete('crm');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

export function consumirRetornoProspeccao() {
  let raw = memoria;
  try {
    raw ??= sessionStorage.getItem(CHAVE);
    sessionStorage.removeItem(CHAVE);
  } catch {
    /* Fallback restrito à aba. */
  }
  memoria = null;
  return interpretarPosicao(raw);
}
