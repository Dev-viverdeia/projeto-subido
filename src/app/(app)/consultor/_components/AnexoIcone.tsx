import { FileText, Image as ImageIcon, Mic } from 'lucide-react';
import type { CategoriaAnexoSobral } from '@/lib/consultor/anexos-contrato';

export function AnexoIcone({ categoria }: { categoria: CategoriaAnexoSobral | null }) {
  if (categoria === 'imagem') return <ImageIcon size={15} strokeWidth={1.9} aria-hidden="true" />;
  if (categoria === 'audio') return <Mic size={15} strokeWidth={1.9} aria-hidden="true" />;
  return <FileText size={15} strokeWidth={1.9} aria-hidden="true" />;
}
