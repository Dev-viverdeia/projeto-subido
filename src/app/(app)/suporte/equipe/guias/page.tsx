import { notFound } from 'next/navigation';
import { ehAdmin } from '@/lib/auth/papeis';
import { artigosSuporte } from '@/lib/suporte/servidor';
import { EditorGuias } from '@/components/suporte/EditorGuias';
export const metadata = { title: 'Editar guias de ajuda' };
export default async function GuiasEquipePage() {
  if (!(await ehAdmin())) notFound();
  return <EditorGuias artigos={await artigosSuporte(true)} />;
}
