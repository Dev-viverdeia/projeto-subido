import { NovoAtendimento } from '@/components/suporte/NovoAtendimento';
import { paginaSegura } from '@/lib/suporte/contrato';
import { usuarioSuporte, artigosSuporte } from '@/lib/suporte/servidor';
import { contextoFalha, CONTEXTOS_FALHA } from '@/lib/suporte/recuperacao';
export const metadata = { title: 'Pedir ajuda' };
export default async function NovoSuportePage({ searchParams }: PageProps<'/suporte/novo'>) {
  const p = await searchParams;
  const [user, artigos] = await Promise.all([usuarioSuporte(), artigosSuporte()]);
  const contexto = contextoFalha(p.contexto);
  return (
    <NovoAtendimento
      pagina={paginaSegura(p.origem)}
      usuario={user?.id}
      artigos={artigos}
      assuntoInicial={contexto ? CONTEXTOS_FALHA[contexto].assunto : undefined}
    />
  );
}
