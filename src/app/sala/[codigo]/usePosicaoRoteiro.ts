'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import type { PlanoCall } from '@/lib/calls/plano';
import type { TipoCall } from '@/lib/calls/tipos';
import {
  assinaturaRoteiro,
  lerPosicaoRoteiro,
  POSICAO_INICIAL,
  type PosicaoRoteiro,
} from '@/lib/calls/posicao-roteiro';
import {
  lerPosicaoLocal,
  observarPosicaoLocal,
  salvarPosicaoLocal,
} from '@/lib/calls/posicao-roteiro-local';

const snapshotServidor = () => '';

export function usePosicaoRoteiro(
  reuniaoId: string | undefined,
  plano: PlanoCall | null,
  tipo: TipoCall,
) {
  const assinatura = useMemo(() => assinaturaRoteiro(plano, tipo), [plano, tipo]);
  const [local, setLocal] = useState('');
  const snapshot = useCallback(() => (reuniaoId ? lerPosicaoLocal(reuniaoId) : ''), [reuniaoId]);
  const salvo = useSyncExternalStore(observarPosicaoLocal, snapshot, snapshotServidor);
  const total = plano?.perguntas.length ?? 0;
  const posicao = lerPosicaoRoteiro(reuniaoId ? salvo : local, assinatura, total);

  function atualizar(mudanca: Partial<PosicaoRoteiro>) {
    // Ler o estado mais recente evita perder uma mudança rápida de pergunta/aba.
    const atual = lerPosicaoRoteiro(
      reuniaoId ? lerPosicaoLocal(reuniaoId) : local,
      assinatura,
      total,
    );
    const valor = JSON.stringify({
      ...POSICAO_INICIAL,
      ...atual,
      ...mudanca,
      versao: 1,
      assinatura,
    });
    if (reuniaoId) salvarPosicaoLocal(reuniaoId, valor);
    else setLocal(valor);
  }

  return { posicao, atualizar };
}
