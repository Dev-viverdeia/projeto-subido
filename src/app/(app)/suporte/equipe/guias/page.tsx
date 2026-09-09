import { notFound } from 'next/navigation';
import { ehAdmin } from '@/lib/auth/papeis';
import { artigosSuporte } from '@/lib/suporte/servidor';
import { EditorGuias } from '@/components/suporte/EditorGuias';
import { CategoriaSchema } from '@/lib/suporte/contrato';
export const metadata = { title: 'Editar guias de ajuda' };
export default async function GuiasEquipePage({
  searchParams,
}: PageProps<'/suporte/equipe/guias'>) {
  if (!(await ehAdmin())) notFound();
  const p = await searchParams;
  return (
    <EditorGuias
      artigos={await artigosSuporte(true)}
      categoriaInicial={CategoriaSchema.safeParse(p.tema).data}
    />
  );
}
