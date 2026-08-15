'use client';

import { useEffect } from 'react';

export function RegistrarVisualizacao({ codigo }: { codigo: string }) {
  useEffect(() => {
    void fetch(`/api/proposta/${codigo}/visualizacao`, {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
    });
  }, [codigo]);

  return null;
}
