'use client';

import { useEffect, useRef, useState } from 'react';
import {
  novaTentativaTexto,
  registrarEnvio,
  type TentativaTexto,
} from '@/lib/consultor/registrar-envio';

export function useEnvioTexto(guardar?: (tentativa: TentativaTexto) => boolean, dono?: string) {
  const tentativa = useRef<TentativaTexto | null>(null);
  const guardado = useRef(false);
  const [guardadoUI, setGuardadoUI] = useState(false);
  const [pendente, setPendente] = useState<'conferir' | 'retomar' | null>(null);
  useEffect(() => {
    const avisar = (evento: BeforeUnloadEvent) => {
      if (tentativa.current?.solicitado && !guardado.current) evento.preventDefault();
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, []);
  async function enviar(mensagem: string, threadId?: string) {
    tentativa.current ??= novaTentativaTexto(mensagem, threadId);
    tentativa.current.dono ??= dono;
    const resultado = await registrarEnvio(tentativa.current, pendente === 'conferir', (t) => {
      guardado.current = guardar?.(t) ?? false;
      setGuardadoUI(guardado.current);
    });
    if (resultado.falha && resultado.pendente) {
      setPendente(resultado.ausente ? 'retomar' : 'conferir');
    } else {
      tentativa.current = null;
      guardado.current = false;
      setGuardadoUI(false);
      setPendente(null);
    }
    return resultado;
  }
  return {
    enviar,
    pendente,
    guardado: guardadoUI,
    restaurar: (salva: TentativaTexto) => {
      tentativa.current = { ...salva };
      guardado.current = true;
      setGuardadoUI(true);
      setPendente('conferir');
    },
  };
}
