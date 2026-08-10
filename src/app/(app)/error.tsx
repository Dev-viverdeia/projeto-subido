'use client';

import { useEffect } from 'react';
import { CloudOff } from 'lucide-react';
import Link from 'next/link';
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
  useEffect(() => {
    /* O log de servidor tem o cru; este espelho de cliente ajuda quando o erro
       nasce no browser (hidratação, chunk). */
    console.error('[app:boundary]', error.digest ?? error.message);
  }, [error]);

  return (
    <EstadoSistema
      urgente
      icone={<CloudOff size={30} strokeWidth={1.6} />}
      etiqueta="Conexão interrompida"
      titulo="Esta tela não conseguiu chegar até você."
      descricao="Seu trabalho continua salvo. Refaça a tentativa agora ou volte ao início para seguir por outra área."
      acoes={
        <>
          <Button variant="primary" onClick={reset}>
            Tentar novamente
          </Button>
          <Link href="/inicio">Voltar ao início</Link>
        </>
      }
      passos={[
        { rotulo: 'Primeiro', valor: 'Tente carregar a tela mais uma vez.' },
        { rotulo: 'Se persistir', valor: 'Volte ao início e retome a jornada por lá.' },
      ]}
    />
  );
}
