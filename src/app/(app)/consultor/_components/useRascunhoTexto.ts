'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import {
  epocaRascunhos,
  gravarRascunho,
  listarRascunhos,
  observarRascunhos,
  removerRascunho,
  type RascunhoSobral,
} from '@/lib/consultor/rascunhos';
import type { TentativaTexto } from '@/lib/consultor/registrar-envio';

const servidor = () => null;
export function useRascunhoTexto(dono?: string, conversa = 'nova') {
  const ativo = useRef<RascunhoSobral | null>(null);
  const [epoca, setEpoca] = useState<string | null>(null);
  const [idAtivo, setIdAtivo] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [recuperado, setRecuperado] = useState(false);
  const ler = useCallback(
    () => JSON.stringify({ epoca: epocaRascunhos(), lista: listarRascunhos(dono) }),
    [dono],
  );
  const raw = useSyncExternalStore(observarRascunhos, ler, servidor);
  const snapshot = raw ? (JSON.parse(raw) as { epoca: string; lista: RascunhoSobral[] }) : null;
  // A época capturada impede que um POST atrasado recrie rascunhos depois do logout.
  if (snapshot && epoca === null) setEpoca(snapshot.epoca);
  const bloqueado = snapshot !== null && epoca !== null && snapshot.epoca !== epoca;
  const disponivel = snapshot?.lista.find(
    (r) => r.id !== idAtivo && (r.conversa === conversa || r.tentativa?.threadId === conversa),
  );

  function salvar(texto: string, anexos = false, tentativa?: TentativaTexto) {
    if (!dono || epoca === null || epoca !== epocaRascunhos()) return false;
    if (!texto && !anexos) {
      limpar();
      return true;
    }
    const registro: RascunhoSobral = {
      id: ativo.current?.id ?? crypto.randomUUID(),
      dono,
      conversa,
      texto,
      anexos,
      salvoEm: Date.now(),
      ...(tentativa ? { tentativa: { ...tentativa } } : {}),
    };
    ativo.current = registro;
    setIdAtivo(registro.id);
    const salvo = gravarRascunho(registro, epoca);
    setFalhou(!salvo);
    return salvo;
  }
  function limpar() {
    if (ativo.current) removerRascunho(ativo.current);
    ativo.current = null;
    setIdAtivo(null);
    setRecuperado(false);
    setFalhou(false);
  }
  function retomar(r: RascunhoSobral) {
    if (bloqueado || epoca !== epocaRascunhos()) return false;
    // Texto em edição ganha uma cópia própria: duas abas nunca disputam o mesmo rascunho.
    ativo.current = r.tentativa ? r : null;
    const salvo = salvar(r.texto, r.anexos, r.tentativa);
    if (!r.tentativa && salvo) removerRascunho(r);
    setRecuperado(true);
    return true;
  }
  return {
    salvar,
    limpar,
    retomar,
    disponivel,
    recuperado,
    falhou,
    guardado: idAtivo !== null && !falhou,
    bloqueado,
    pronto: !dono || (snapshot !== null && epoca !== null),
    descartar: () => {
      if (disponivel && !disponivel.tentativa) removerRascunho(disponivel);
    },
    guardarTentativa: (t: TentativaTexto) => salvar(t.mensagem, false, t),
  };
}
