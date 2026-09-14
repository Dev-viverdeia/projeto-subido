'use client';

import { useEffect, useReducer, useSyncExternalStore } from 'react';
import { atrasoDaReconexao } from '@/lib/calls/reconexao';

type Credenciais = { token: string; serverUrl: string };
type Estado = {
  credenciais: Credenciais | null;
  fase: 'fora' | 'conectando' | 'conectada' | 'recuperando' | 'falhou';
  tentativa: number;
  geracao: number;
};
type Acao =
  | { tipo: 'entrar'; credenciais: Credenciais }
  | { tipo: 'sair' | 'tentar' }
  | { tipo: 'conectou' | 'queda' | 'falha'; geracao: number }
  | { tipo: 'credenciais'; geracao: number; credenciais: Credenciais };

const INICIAL: Estado = { credenciais: null, fase: 'fora', tentativa: 0, geracao: 0 };
export const LIMITE_RETOMADAS = 3;

export function reduzirRetomada(estado: Estado, acao: Acao): Estado {
  if ('geracao' in acao && acao.geracao !== estado.geracao) return estado;
  switch (acao.tipo) {
    case 'entrar':
      return {
        ...INICIAL,
        fase: 'conectando',
        credenciais: acao.credenciais,
        geracao: estado.geracao + 1,
      };
    case 'sair':
      return { ...INICIAL, geracao: estado.geracao + 1 };
    case 'conectou':
      return estado.credenciais ? { ...estado, fase: 'conectada', tentativa: 0 } : estado;
    case 'tentar':
      return estado.fase === 'falhou'
        ? { ...estado, fase: 'recuperando', tentativa: 1, geracao: estado.geracao + 1 }
        : estado;
    case 'credenciais':
      return estado.fase === 'recuperando'
        ? { ...estado, fase: 'conectando', credenciais: acao.credenciais }
        : estado;
    case 'queda':
    case 'falha': {
      if (acao.tipo === 'queda' ? !estado.credenciais : estado.fase !== 'recuperando')
        return estado;
      const esgotou = estado.tentativa >= LIMITE_RETOMADAS;
      return {
        credenciais: null,
        fase: esgotou ? 'falhou' : 'recuperando',
        tentativa: esgotou ? estado.tentativa : estado.tentativa + 1,
        geracao: estado.geracao + 1,
      };
    }
  }
}

function observarInternet(avisar: () => void) {
  window.addEventListener('online', avisar);
  window.addEventListener('offline', avisar);
  return () => {
    window.removeEventListener('online', avisar);
    window.removeEventListener('offline', avisar);
  };
}

export function useRetomadaReuniao(
  obter: (signal: AbortSignal) => Promise<Credenciais>,
  pausada = false,
) {
  const [estado, dispatch] = useReducer(reduzirRetomada, INICIAL);
  const online = useSyncExternalStore(
    observarInternet,
    () => navigator.onLine,
    () => true,
  );

  useEffect(() => {
    if (estado.fase !== 'recuperando' || !online || pausada) return;
    const controller = new AbortController();
    let expiracao: ReturnType<typeof setTimeout> | undefined;
    let ativo = true;
    const timer = setTimeout(() => {
      // Credenciais que não respondem não podem deixar a pessoa presa no loading.
      expiracao = setTimeout(() => {
        controller.abort();
        if (ativo) dispatch({ tipo: 'falha', geracao: estado.geracao });
      }, 15_000);
      void obter(controller.signal)
        .then(
          (credenciais) => {
            if (ativo && !controller.signal.aborted)
              dispatch({ tipo: 'credenciais', credenciais, geracao: estado.geracao });
          },
          () => {
            if (ativo && !controller.signal.aborted)
              dispatch({ tipo: 'falha', geracao: estado.geracao });
          },
        )
        .finally(() => clearTimeout(expiracao));
    }, atrasoDaReconexao(estado.tentativa));
    return () => {
      ativo = false;
      clearTimeout(timer);
      clearTimeout(expiracao);
      controller.abort();
    };
  }, [estado.fase, estado.geracao, estado.tentativa, online, obter, pausada]);

  return { estado, dispatch, online };
}
