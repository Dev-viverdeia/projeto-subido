import { NovoAtendimento } from '@/components/suporte/NovoAtendimento';
import { paginaSegura } from '@/lib/suporte/contrato';
import { usuarioSuporte, artigosSuporte } from '@/lib/suporte/servidor';
export const metadata = { title: 'Pedir ajuda' };
export default async function NovoSuportePage({ searchParams }: PageProps<'/suporte/novo'>) {
  const p = await searchParams;
  const [user, artigos] = await Promise.all([usuarioSuporte(), artigosSuporte()]);
  return <NovoAtendimento pagina={paginaSegura(p.origem)} usuario={user?.id} artigos={artigos} />;
}
