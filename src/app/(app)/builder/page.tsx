import type { Metadata } from 'next';
import { Blocks } from 'lucide-react';
import { EmptyState } from '@/design-system/via';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';

export const metadata: Metadata = { title: 'Builder' };

/**
 * Pilar 03. Descreve a ideia → viabilidade → base de conhecimento, framework,
 * arquitetura, stack, plano de ação e estimativa de economia.
 *
 * É o único pilar que depende de um modelo de linguagem, e por isso o único cuja
 * arquitetura ainda não dá para fechar sem uma decisão de produto: onde o job roda,
 * quanto tempo pode levar e o que acontece quando ele falha no meio.
 */
export default function BuilderPage() {
  return (
    <>
      <CabecalhoPagina titulo="Builder" oculto />

      <EmptyState
        icon={<Blocks size={20} strokeWidth={1.8} />}
        title="O Builder ainda não está ligado"
        description="Falta decidir onde a geração roda e como ela se comporta quando demora ou falha no meio. A tela entra depois dessa decisão."
      />
    </>
  );
}
