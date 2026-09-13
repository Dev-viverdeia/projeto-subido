'use client';

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const INTERVALO = 15_000;
const LIMITE = 3 * 60_000;
const lerConexao = () => navigator.onLine;
const conexaoServidor = () => true;
function observarConexao(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/** Apenas consulta. Não chama a API de finalização, a IA ou qualquer mutação. */
export function useAcompanharResumo(acompanhar: boolean) {
  const router = useRouter();
  const online = useSyncExternalStore(observarConexao, lerConexao, conexaoServidor);
  const [pausado, setPausado] = useState(false);
  const [verificando, iniciar] = useTransition();
  const inicio = useRef<number | null>(null);
  const ocupado = useRef(false);

  useEffect(() => {
    ocupado.current = verificando;
  }, [verificando]);

  useEffect(() => {
    if (!acompanhar || pausado) return;
    inicio.current ??= Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - inicio.current! >= LIMITE) {
        setPausado(true);
        window.clearInterval(timer);
        return;
      }
      if (document.visibilityState !== 'visible' || !navigator.onLine || ocupado.current) return;
      ocupado.current = true;
      iniciar(() => router.refresh());
    }, INTERVALO);
    return () => window.clearInterval(timer);
  }, [acompanhar, pausado, router]);

  function verificar() {
    if (!navigator.onLine || ocupado.current) return;
    ocupado.current = true;
    iniciar(() => router.refresh());
  }
  return { online, pausado, verificando, verificar };
}
