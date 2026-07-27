import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import { EmptyState, Pill } from '@/design-system/via';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';

export const metadata: Metadata = { title: 'HUB' };

/**
 * O destino: diretório onde empresas procuram implementadores certificados.
 *
 * A landing anuncia o HUB como "em construção", com data prevista ainda em aberto.
 * Esta tela repete exatamente essa promessa — nem mais, nem menos. Prometer aqui o
 * que a landing não prometeu é como uma plataforma perde a confiança que a página
 * de vendas construiu.
 */
export default function HubPage() {
  return (
    <>
      <CabecalhoPagina
        titulo="HUB"
        descricao="Formar é metade. A outra metade é ser encontrado — o HUB é onde empresas procuram implementadores certificados pela plataforma."
        acao={<Pill variant="attn">em construção</Pill>}
      />

      <EmptyState
        icon={<Building2 size={20} strokeWidth={1.8} />}
        title="O HUB ainda não abriu"
        description="Formação e certificação já funcionam. O diretório entra depois, e os critérios de entrada serão anunciados antes da abertura."
      />
    </>
  );
}
