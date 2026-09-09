import { CentralAjuda } from '@/components/suporte/CentralAjuda';
import { artigosSuporte, equipeSuporte } from '@/lib/suporte/servidor';
export const metadata = { title: 'Central de ajuda' };
export default async function SuportePage() {
  const [artigos, equipe] = await Promise.all([artigosSuporte(), equipeSuporte()]);
  return <CentralAjuda artigos={artigos} autenticado equipe={equipe} />;
}
