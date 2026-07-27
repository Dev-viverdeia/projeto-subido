import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { EmptyState } from '@/design-system/via';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';

export const metadata: Metadata = { title: 'Formações' };

/** Pilar 02. Trilha → módulos → aulas, com progresso salvo e certificado. */
export default function FormacoesPage() {
  return (
    <>
      <CabecalhoPagina
        titulo="Formações"
        descricao="Do primeiro conceito à entrega para cliente. Trilhas completas em vídeo, com progresso salvo e retomada de onde você parou."
      />

      <EmptyState
        icon={<GraduationCap size={20} strokeWidth={1.8} />}
        title="As trilhas ainda não estão conectadas"
        description="Curso, módulos, aulas e progresso vêm do banco. A tela está pronta para recebê-los."
      />
    </>
  );
}
