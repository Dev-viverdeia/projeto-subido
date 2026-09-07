'use client';

import { useEffect, useSyncExternalStore, useTransition } from 'react';
import { useRouter } from 'next/navigation';

function escutarConexao(atualizar: () => void) {
  window.addEventListener('online', atualizar);
  window.addEventListener('offline', atualizar);
  return () => {
    window.removeEventListener('online', atualizar);
    window.removeEventListener('offline', atualizar);
  };
}

const conectado = () => navigator.onLine;
const conectadoNoServidor = () => true;

/** Acompanha apenas a leitura. Reconectar nunca repete a operação paga. */
export function useAcompanhamentoOperacao(ativo: boolean) {
  const router = useRouter();
  const online = useSyncExternalStore(escutarConexao, conectado, conectadoNoServidor);
  const [atualizando, atualizar] = useTransition();

  useEffect(() => {
    if (!ativo || atualizando) return;
    const consultar = () => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        atualizar(() => router.refresh());
      }
    };
    const timer = window.setInterval(consultar, 4000);
    window.addEventListener('online', consultar);
    document.addEventListener('visibilitychange', consultar);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', consultar);
      document.removeEventListener('visibilitychange', consultar);
    };
  }, [ativo, atualizando, router]);

  return online;
}
