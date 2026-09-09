import { LinkAcao } from '@/components/suporte/LinkAcao';
import Link from 'next/link';
import { listarAtendimentos } from '@/lib/suporte/servidor';
import { StatusSchema } from '@/lib/suporte/contrato';
import { ListaAtendimentos } from '@/components/suporte/ListaAtendimentos';
import s from '@/components/suporte/suporte.module.css';
export const metadata = { title: 'Meus atendimentos' };
export default async function MeusAtendimentosPage({
  searchParams,
}: PageProps<'/suporte/atendimentos'>) {
  const p = await searchParams;
  const pagina = Math.min(1000, Math.max(0, Math.floor(Number(p.pagina) || 0)));
  const status = StatusSchema.safeParse(p.status).data ?? '';
  const busca = typeof p.busca === 'string' ? p.busca.trim().slice(0, 120) : '';
  const { casos, total } = await listarAtendimentos({ pagina, status, busca });
  return (
    <div className={s.pagina}>
      <header className={s.cabecalho}>
        <div>
          <Link href="/suporte" className={s.atalho}>
            Central de ajuda
          </Link>
          <h1 className={s.titulo}>Meus atendimentos</h1>
        </div>
        <LinkAcao href="/suporte/novo">Pedir ajuda</LinkAcao>
      </header>
      <ListaAtendimentos
        casos={casos}
        total={total}
        pagina={pagina}
        status={status}
        busca={busca}
      />
    </div>
  );
}
