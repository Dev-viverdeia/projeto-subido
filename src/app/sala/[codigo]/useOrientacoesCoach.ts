'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { VALIDADE_ORIENTACAO_MS } from '@/lib/calls/coach-orientacao';
import type { SugestaoLive } from './CabineLiveCoach';

type Estado = { atual: SugestaoLive | null; historico: SugestaoLive[]; ocultas: string[] };
type Evento =
  | { tipo: 'receber'; sugestao: SugestaoLive | null; historico: SugestaoLive[]; agora: number }
  | { tipo: 'ocultar'; id: string };
export const ESTADO_INICIAL_COACH: Estado = { atual: null, historico: [], ocultas: [] };

export function reduzirOrientacoes(estado: Estado, evento: Evento): Estado {
  if (evento.tipo === 'ocultar') {
    return {
      ...estado,
      atual: estado.atual?.id === evento.id ? null : estado.atual,
      ocultas: [...new Set([...estado.ocultas, evento.id])],
    };
  }
  const porId = new Map(estado.historico.map((item) => [item.id, item]));
  for (const item of [...evento.historico].reverse()) porId.set(item.id, item);
  const sugestao = evento.sugestao;
  const atual = sugestao
    ? {
        ...sugestao,
        criada_em:
          sugestao.criada_em ??
          porId.get(sugestao.id)?.criada_em ??
          new Date(evento.agora).toISOString(),
      }
    : null;
  if (atual) porId.set(atual.id, atual);
  const vigente = atual && evento.agora - Date.parse(atual.criada_em) < VALIDADE_ORIENTACAO_MS;
  return {
    ...estado,
    atual: vigente && !estado.ocultas.includes(atual.id) ? atual : null,
    historico: [...porId.values()]
      .sort((a, b) => (b.criada_em ?? '').localeCompare(a.criada_em ?? ''))
      .slice(0, 8),
  };
}

export function useOrientacoesCoach() {
  const [estado, dispatch] = useReducer(reduzirOrientacoes, ESTADO_INICIAL_COACH);
  const receber = useCallback((sugestao: SugestaoLive | null, historico: SugestaoLive[] = []) => {
    dispatch({ tipo: 'receber', sugestao, historico, agora: Date.now() });
  }, []);
  const ocultar = useCallback(() => {
    if (estado.atual) dispatch({ tipo: 'ocultar', id: estado.atual.id });
  }, [estado.atual]);
  const id = estado.atual?.id;
  const criadaEm = estado.atual?.criada_em;
  useEffect(() => {
    if (!id || !criadaEm) return;
    const tempo = Math.max(0, VALIDADE_ORIENTACAO_MS - (Date.now() - Date.parse(criadaEm)));
    const timer = setTimeout(() => dispatch({ tipo: 'ocultar', id }), tempo);
    return () => clearTimeout(timer);
  }, [id, criadaEm]);
  return { ...estado, receber, ocultar };
}
