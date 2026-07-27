import type { Metadata } from 'next';
import Link from 'next/link';
import { Boxes } from 'lucide-react';
import { Button, EmptyState } from '@/design-system/via';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';

export const metadata: Metadata = { title: 'Início' };

/**
 * Painel de entrada.
 *
 * Hoje é só a moldura: sem tabela no banco, qualquer "continue de onde parou" seria
 * dado inventado — e dado inventado numa tela de produto vira captura de tela, e
 * captura de tela vira expectativa. O estado vazio diz a verdade e ainda assim
 * empurra para a próxima ação.
 */
export default function InicioPage() {
  return (
    <>
      <CabecalhoPagina
        titulo="Início"
        descricao="Seu progresso, as próximas mentorias e o que você deixou pela metade."
      />

      <EmptyState
        icon={<Boxes size={20} strokeWidth={1.8} />}
        title="Você ainda não começou nenhuma implementação"
        description="Escolha uma solução, siga o passo a passo e termine com algo rodando. É por aí que a maioria começa."
        action={
          <Link href="/solucoes">
            <Button variant="primary">Ver soluções</Button>
          </Link>
        }
        secondary={
          <Link href="/formacoes">
            <Button variant="ghost">Começar uma formação</Button>
          </Link>
        }
      />
    </>
  );
}
