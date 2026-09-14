'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type EstadoEnvio = 'pronto' | 'enviando' | 'enviado' | 'erro' | 'incerto';

function useDadosRascunho() {
  const [texto, setTexto] = useState('');
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState<EstadoEnvio>('pronto');
  const emCurso = useRef(false);
  const versaoEnvio = useRef(0);
  const interromper = useCallback(() => {
    versaoEnvio.current += 1;
    if (emCurso.current) setEstado('incerto');
    emCurso.current = false;
  }, []);
  const limpar = useCallback(() => {
    versaoEnvio.current += 1;
    emCurso.current = false;
    setTexto('');
    setEstado('pronto');
    setAberto(false);
  }, []);
  return {
    texto,
    setTexto,
    aberto,
    setAberto,
    estado,
    setEstado,
    emCurso,
    versaoEnvio,
    interromper,
    limpar,
  };
}

const Contexto = createContext<ReturnType<typeof useDadosRascunho> | null>(null);

/** Só na memória desta participação. Nenhum texto é gravado em storage ou banco. */
export function RascunhoReuniao({ children }: { children: ReactNode }) {
  const dados = useDadosRascunho();
  return <Contexto.Provider value={dados}>{children}</Contexto.Provider>;
}

export function useRascunhoReuniao() {
  const contexto = useContext(Contexto);
  const local = useDadosRascunho();
  return contexto ?? local;
}
