import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button, EmptyState } from '@/design-system/via';

/**
 * 404 da área logada — dispara pelo `notFound()` das rotas dinâmicas (slug de
 * solução/formação inexistente ou em rascunho). Rascunho responde 404 e não
 * "sem acesso": confirmar que o conteúdo existe já é vazar informação.
 */
export default function NaoEncontrado() {
  return (
    <EmptyState
      icon={<Compass size={20} strokeWidth={1.8} />}
      title="Isso não está mais aqui"
      description="O conteúdo pode ter sido despublicado ou o endereço mudou. O catálogo continua no lugar."
      action={
        <Link href="/solucoes">
          <Button variant="primary">Ver soluções</Button>
        </Link>
      }
      secondary={
        <Link href="/inicio">
          <Button variant="ghost">Ir para o início</Button>
        </Link>
      }
    />
  );
}
