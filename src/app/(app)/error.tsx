'use client';

import { useEffect } from 'react';
import { CloudOff } from 'lucide-react';
import { Button, EmptyState } from '@/design-system/via';

/**
 * Error boundary da área logada.
 *
 * ERRO NÃO É VAZIO. Uma falha de rede renderizada como "catálogo vazio" ensina o
 * usuário de que não há conteúdo — incidente documentado na plataforma de
 * referência. Aqui a falha tem cara de falha e um caminho de volta (`reset()`
 * re-renderiza a árvore do servidor).
 *
 * A mensagem é genérica de propósito: em produção o Next redige o erro de servidor
 * antes de ele chegar aqui (digest), e o texto cru já foi logado com contexto pelo
 * `handleError`. Este componente não decide mensagem — decide postura.
 */
export default function ErroApp({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* O log de servidor tem o cru; este espelho de cliente ajuda quando o erro
       nasce no browser (hidratação, chunk). */
    console.error('[app:boundary]', error.digest ?? error.message);
  }, [error]);

  return (
    <EmptyState
      icon={<CloudOff size={20} strokeWidth={1.8} />}
      title="Algo falhou ao carregar esta tela"
      description="Não foi nada que você fez. Tente de novo — se insistir, saia e entre outra vez."
      action={
        <Button variant="primary" onClick={reset}>
          Tentar de novo
        </Button>
      }
    />
  );
}
