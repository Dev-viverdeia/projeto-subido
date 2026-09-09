'use client';

import { useEffect } from 'react';
import { CloudOff } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { linkAjudaNaFalha } from '@/lib/suporte/recuperacao';
import { Button } from '@/design-system/via';
import { EstadoSistema } from './_components/EstadoSistema';

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
  const pagina = usePathname();
  useEffect(() => {
    /* O log de servidor tem o cru; este espelho de cliente ajuda quando o erro
       nasce no browser (hidratação, chunk). */
    console.error('[app:boundary]', error.digest ?? error.message);
  }, [error]);

  return (
    <EstadoSistema
      urgente
      icone={<CloudOff size={30} strokeWidth={1.6} />}
      etiqueta="Não foi possível carregar"
      titulo="Esta página não abriu."
      descricao="Tente carregar novamente. Se o problema continuar, peça ajuda à equipe."
      acoes={
        <>
          <Button variant="primary" onClick={reset}>
            Tentar novamente
          </Button>
          <Link href="/inicio">Voltar ao início</Link>
          <a href={linkAjudaNaFalha('pagina', pagina)} target="_blank" rel="noopener noreferrer">
            Pedir ajuda
          </a>
        </>
      }
    />
  );
}
