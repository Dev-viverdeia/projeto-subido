'use client';

import { useEffect, useState } from 'react';

/** Blob URLs pertencem ao efeito, não ao render. StrictMode e renders descartados
 * não podem deixar uma URL revogada em uso nem um arquivo preso na memória. */
export function useArquivoLocal(arquivo?: File) {
  const [preview, setPreview] = useState<{ arquivo: File; url: string } | null>(null);
  useEffect(() => {
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    // A URL é um recurso externo criado e revogado junto deste efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview({ arquivo, url });
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);
  return preview?.arquivo === arquivo ? preview?.url : undefined;
}
