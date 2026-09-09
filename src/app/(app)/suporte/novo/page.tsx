import { NovoAtendimento } from '@/components/suporte/NovoAtendimento';
import { paginaSegura } from '@/lib/suporte/contrato';
export const metadata = { title: 'Pedir ajuda' };
export default async function NovoSuportePage({ searchParams }: PageProps<'/suporte/novo'>) {
  const p = await searchParams;
  return <NovoAtendimento pagina={paginaSegura(p.origem)} />;
}
