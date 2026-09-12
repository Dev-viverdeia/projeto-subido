'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ConteudoEdicao, EdicaoProposta } from '@/lib/propostas/edicao';
import {
  epocaPropostas,
  guardarRascunhoProposta,
  listarRascunhosProposta,
  observarRascunhosProposta,
  removerRascunhoProposta,
  type RascunhoProposta,
} from '@/lib/propostas/rascunho-local';

const servidor = () => null;
export function useRascunhoProposta(
  dono: string | undefined,
  base: EdicaoProposta,
  local: ConteudoEdicao & { valor: string },
  sujo: boolean,
) {
  const [epoca, setEpoca] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [ativoId, setAtivoId] = useState<string | null>(null);
  const ativo = useRef<RascunhoProposta | null>(null);
  const persistido = useRef<RascunhoProposta | null>(null);
  const atual = useRef({ base, local, sujo });
  const ler = useCallback(
    () =>
      JSON.stringify({
        epoca: epocaPropostas(),
        lista: listarRascunhosProposta(dono, base.id),
      }),
    [dono, base.id],
  );
  const raw = useSyncExternalStore(observarRascunhosProposta, ler, servidor);
  const snapshot = raw ? (JSON.parse(raw) as { epoca: string; lista: RascunhoProposta[] }) : null;
  if (snapshot && epoca === null) setEpoca(snapshot.epoca);
  const bloqueado = epoca !== null && snapshot !== null && snapshot.epoca !== epoca;

  const guardar = useCallback(() => {
    if (!dono || epoca === null || epoca !== epocaPropostas()) return false;
    const { base, local, sujo } = atual.current;
    if (!sujo) {
      if (persistido.current) removerRascunhoProposta(persistido.current);
      ativo.current = null;
      persistido.current = null;
      return true;
    }
    const registro: RascunhoProposta = {
      ...local,
      base,
      dono,
      id: ativo.current?.id ?? crypto.randomUUID(),
      salvoEm: Date.now(),
    };
    ativo.current = registro;
    const ok = guardarRascunhoProposta(registro, epoca);
    if (ok) persistido.current = registro;
    return ok;
  }, [dono, epoca]);
  const tentar = useCallback(() => {
    const ok = guardar();
    setFalhou(!ok);
    setAtivoId(ativo.current?.id ?? null);
    return ok;
  }, [guardar]);

  useLayoutEffect(() => {
    atual.current = { base, local, sujo };
  }, [base, local, sujo]);
  useEffect(() => {
    if (!dono || epoca === null || bloqueado) return;
    const timer = setTimeout(tentar, 300);
    return () => clearTimeout(timer);
  }, [dono, epoca, bloqueado, base, local.titulo, local.documento, local.valor, sujo, tentar]);
  useEffect(() => {
    if (!dono || epoca === null) return;
    const ocultar = () => {
      if (document.visibilityState === 'hidden') guardar();
    };
    const sair = (e: BeforeUnloadEvent) => {
      if (atual.current.sujo && !guardar()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('pagehide', guardar);
    window.addEventListener('beforeunload', sair);
    document.addEventListener('visibilitychange', ocultar);
    return () => {
      guardar();
      window.removeEventListener('pagehide', guardar);
      window.removeEventListener('beforeunload', sair);
      document.removeEventListener('visibilitychange', ocultar);
    };
  }, [dono, epoca, guardar]);

  function retomar(r: RascunhoProposta) {
    if (
      bloqueado ||
      epoca === null ||
      epoca !== epocaPropostas() ||
      r.dono !== dono ||
      r.base.id !== base.id
    )
      return false;
    // Uma revisão escolhida não pode apagar a última tecla dos campos atuais.
    if (atual.current.sujo && !guardar()) {
      setFalhou(true);
      return false;
    }
    // Cada montagem mantém sua própria cópia: duas abas não editam a mesma chave.
    const copia = { ...r, id: crypto.randomUUID(), salvoEm: Date.now() };
    const ok = guardarRascunhoProposta(copia, epoca);
    ativo.current = copia;
    persistido.current = ok ? copia : null;
    setAtivoId(copia.id);
    setFalhou(!ok);
    if (ok) removerRascunhoProposta(r);
    return true;
  }
  return {
    disponiveis: snapshot?.lista.filter((r) => r.id !== ativoId) ?? [],
    falhou: Boolean(dono && falhou && sujo && !bloqueado),
    bloqueado,
    tentar,
    retomar,
    descartar: removerRascunhoProposta,
  };
}
