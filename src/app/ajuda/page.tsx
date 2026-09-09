import { CentralAjuda } from '@/components/suporte/CentralAjuda';
import { artigosSuporte, usuarioSuporte, equipeSuporte } from '@/lib/suporte/servidor';
export default async function AjudaPage() {
  const [artigos, user, equipe] = await Promise.all([
    artigosSuporte(),
    usuarioSuporte(),
    equipeSuporte(),
  ]);
  return <CentralAjuda artigos={artigos} autenticado={!!user} equipe={equipe} />;
}
