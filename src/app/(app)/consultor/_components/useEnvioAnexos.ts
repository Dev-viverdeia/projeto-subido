'use client';

import { useEffect, useRef, useState } from 'react';
import type { EnvioAnexos, ProgressoEnvio } from '@/lib/consultor/envio-anexos';

export function useEnvioAnexos() {
  const tentativa = useRef<EnvioAnexos | null>(null);
  const ativo = useRef(true);
  const [progresso, setProgresso] = useState<ProgressoEnvio | null>(null);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    ativo.current = true;
    return () => {
      ativo.current = false;
      void tentativa.current?.cancelar().catch(() => undefined);
    };
  }, []);
  useEffect(() => {
    if (!progresso) return;
    const avisar = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [progresso]);

  async function enviar(mensagem: string, arquivos: readonly File[], threadId?: string) {
    setPausado(false);
    try {
      if (!tentativa.current) {
        const { EnvioAnexos } = await import('@/lib/consultor/envio-anexos');
        if (!ativo.current) return { threadId: null, falha: 'Conversa fechada.' };
        tentativa.current = new EnvioAnexos(mensagem, arquivos, threadId, (estado) => {
          if (ativo.current) setProgresso(estado);
        });
      }
      const resultado = await tentativa.current.executar();
      if (resultado.falha) setPausado(true);
      else {
        tentativa.current = null;
        setProgresso(null);
      }
      return resultado;
    } catch {
      setPausado(true);
      return { threadId: null, falha: 'Não foi possível iniciar o envio. Tente novamente.' };
    }
  }

  async function cancelar() {
    const atual = tentativa.current;
    if (atual && !(await atual.cancelar())) return false;
    tentativa.current = null;
    setPausado(false);
    setProgresso(null);
    return true;
  }

  return { enviar, cancelar, progresso, pausado };
}
