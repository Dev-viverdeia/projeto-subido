'use client';

import { useEffect, useRef, useState } from 'react';
import {
  novaTentativaTexto,
  registrarEnvio,
  type TentativaTexto,
} from '@/lib/consultor/registrar-envio';

export function useEnvioTexto() {
  const tentativa = useRef<TentativaTexto | null>(null);
  const [pendente, setPendente] = useState<'conferir' | 'retomar' | null>(null);
  useEffect(() => {
    const avisar = (evento: BeforeUnloadEvent) => {
      if (tentativa.current?.solicitado) evento.preventDefault();
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, []);
  async function enviar(mensagem: string, threadId?: string) {
    tentativa.current ??= novaTentativaTexto(mensagem, threadId);
    const resultado = await registrarEnvio(tentativa.current, pendente === 'conferir');
    if (resultado.falha && resultado.pendente) {
      setPendente(resultado.ausente ? 'retomar' : 'conferir');
    } else {
      tentativa.current = null;
      setPendente(null);
    }
    return resultado;
  }
  return { enviar, pendente };
}
