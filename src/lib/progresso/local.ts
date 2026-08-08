'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import { PROGRESSO_VAZIO, type EstadoProgressoConta } from './estado';

/**
 * Compatibilidade do progresso antigo.
 *
 * Na plataforma autenticada, `ProgressoProvider` injeta o estado da conta. Este
 * store local continua existindo por dois motivos controlados: migrar usuários
 * antigos sem perda e proteger uma marcação enquanto a rede estiver indisponível.
 * Fora do provider (testes unitários), ele também é um fallback determinístico.
 */

export const CHAVE_PROGRESSO_LEGADO = 'subido_progresso_v1';

export type AcoesProgresso = {
  concluirAula: (aulaId: string, formacaoSlug: string) => void;
  tocarFormacao: (formacaoSlug: string) => void;
  alternarEtapa: (etapaId: string, solucaoSlug: string) => void;
};

export type ValorContextoProgresso = {
  estado: EstadoProgressoConta;
  acoes: AcoesProgresso;
};

export const ContextoProgresso = createContext<ValorContextoProgresso | null>(null);

let cache: EstadoProgressoConta | null = null;
const ouvintes = new Set<() => void>();

function registro(valor: unknown): Record<string, string> {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return {};
  return Object.fromEntries(
    Object.entries(valor).filter(
      ([chave, iso]) =>
        chave.length > 0 &&
        chave.length <= 240 &&
        typeof iso === 'string' &&
        Number.isFinite(Date.parse(iso)),
    ),
  );
}

function normalizar(valor: unknown): EstadoProgressoConta {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return PROGRESSO_VAZIO;
  const bruto = valor as Record<string, unknown>;
  return {
    aulas: registro(bruto.aulas),
    formacoes: registro(bruto.formacoes),
    etapas: registro(bruto.etapas),
    solucoes: registro(bruto.solucoes),
  };
}

export function lerProgressoLegado(): EstadoProgressoConta {
  if (typeof window === 'undefined') return PROGRESSO_VAZIO;
  if (cache) return cache;
  try {
    const cru = localStorage.getItem(CHAVE_PROGRESSO_LEGADO);
    cache = cru ? normalizar(JSON.parse(cru) as unknown) : PROGRESSO_VAZIO;
  } catch {
    cache = PROGRESSO_VAZIO;
  }
  return cache;
}

export function guardarProgressoLegado(estado: EstadoProgressoConta) {
  cache = estado;
  try {
    localStorage.setItem(CHAVE_PROGRESSO_LEGADO, JSON.stringify(estado));
  } catch {
    /* Sem quota: o estado ainda fica na memória desta aba. */
  }
  for (const avisar of ouvintes) avisar();
}

export function limparProgressoLegado() {
  cache = PROGRESSO_VAZIO;
  try {
    localStorage.removeItem(CHAVE_PROGRESSO_LEGADO);
  } catch {
    /* Storage bloqueado não impede a conta de continuar como fonte de verdade. */
  }
  for (const avisar of ouvintes) avisar();
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  const aoMudarStorage = (evento: StorageEvent) => {
    if (evento.key === CHAVE_PROGRESSO_LEGADO) {
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

const snapshotServidor = () => PROGRESSO_VAZIO;

function concluirAulaLocal(aulaId: string, formacaoSlug: string) {
  const atual = lerProgressoLegado();
  if (atual.aulas[aulaId]) return;
  const agora = new Date().toISOString();
  guardarProgressoLegado({
    ...atual,
    aulas: { ...atual.aulas, [aulaId]: agora },
    formacoes: { ...atual.formacoes, [formacaoSlug]: agora },
  });
}

function tocarFormacaoLocal(formacaoSlug: string) {
  const atual = lerProgressoLegado();
  guardarProgressoLegado({
    ...atual,
    formacoes: { ...atual.formacoes, [formacaoSlug]: new Date().toISOString() },
  });
}

function alternarEtapaLocal(etapaId: string, solucaoSlug: string) {
  const atual = lerProgressoLegado();
  const etapas = { ...atual.etapas };
  if (etapas[etapaId]) delete etapas[etapaId];
  else etapas[etapaId] = new Date().toISOString();
  guardarProgressoLegado({
    ...atual,
    etapas,
    solucoes: { ...atual.solucoes, [solucaoSlug]: new Date().toISOString() },
  });
}

const ACOES_LOCAIS: AcoesProgresso = {
  concluirAula: concluirAulaLocal,
  tocarFormacao: tocarFormacaoLocal,
  alternarEtapa: alternarEtapaLocal,
};

/** Na app retorna a conta; sem provider, retorna o fallback local dos testes. */
export function useProgresso(): EstadoProgressoConta {
  const contexto = useContext(ContextoProgresso);
  const legado = useSyncExternalStore(assinar, lerProgressoLegado, snapshotServidor);
  return contexto?.estado ?? legado;
}

export function useAcoesProgresso(): AcoesProgresso {
  return useContext(ContextoProgresso)?.acoes ?? ACOES_LOCAIS;
}

/* API antiga mantida para consumidores externos e testes isolados. Na árvore da
   aplicação, componentes interativos usam `useAcoesProgresso`. */
export const concluirAula = concluirAulaLocal;
export const tocarFormacao = tocarFormacaoLocal;
export const alternarEtapa = alternarEtapaLocal;

export {
  contarConcluidas,
  contarEtapasFeitas,
  estadoDoProgresso,
  formacaoMaisRecente,
  mesclarProgresso,
  percentual,
  solucaoMaisRecente,
  temProgresso,
  type EstadoProgresso,
  type EstadoProgressoConta,
} from './estado';
