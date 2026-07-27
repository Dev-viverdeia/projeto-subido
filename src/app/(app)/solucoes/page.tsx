import type { Metadata } from 'next';
import { Boxes } from 'lucide-react';
import { EmptyState } from '@/design-system/via';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';

export const metadata: Metadata = { title: 'Soluções' };

/** Pilar 01. Cada solução: vídeo, checklist, ferramentas, prompts e certificado. */
export default function SolucoesPage() {
  return (
    <>
      <CabecalhoPagina
        titulo="Soluções"
        descricao="O que implementar, com o passo a passo de quem já implementou. Você escolhe uma, segue as etapas e termina com algo rodando."
      />

      <EmptyState
        icon={<Boxes size={20} strokeWidth={1.8} />}
        title="O catálogo ainda não está conectado"
        description="As soluções vêm do banco assim que o schema estiver de pé. Nada aqui é conteúdo de exemplo."
      />
    </>
  );
}
