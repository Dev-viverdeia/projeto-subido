import { LinkAcao } from '@/components/suporte/LinkAcao';
import Link from 'next/link';
import { listarAtendimentos, equipeSuporte } from '@/lib/suporte/servidor';
import { ehAdmin } from '@/lib/auth/papeis';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ESTADOS, StatusSchema } from '@/lib/suporte/contrato';
import { ListaAtendimentos } from '@/components/suporte/ListaAtendimentos';
import { EquipeSuporte } from '@/components/suporte/EquipeSuporte';
import s from '@/components/suporte/suporte.module.css';
export const metadata = { title: 'Painel de suporte' };
export default async function FilaSuportePage({ searchParams }: PageProps<'/suporte/equipe'>) {
  if (!(await equipeSuporte())) notFound();
  const p = await searchParams;
  const pagina = Math.min(1000, Math.max(0, Math.floor(Number(p.pagina) || 0)));
  const status = StatusSchema.safeParse(p.status).data ?? '';
  const busca = typeof p.busca === 'string' ? p.busca.trim().slice(0, 120) : '';
  const responsavel = p.responsavel === 'meus' || p.responsavel === 'sem' ? p.responsavel : '';
  const db = await createClient();
  const [{ casos, total }, admin, { data: agentes }, { data: avisos }, contagens] =
    await Promise.all([
      listarAtendimentos({ equipe: true, pagina, status, busca, responsavel }),
      ehAdmin(),
      db.from('suporte_agentes').select('usuario,nome,notificar'),
      db
        .from('suporte_notificacoes')
        .select('id,atendimento,estado,erro')
        .in('estado', ['falhou', 'expirado', 'devolvido'])
        .limit(20),
      Promise.all(
        Object.keys(ESTADOS).map(async (e) => {
          const { count, error } = await db
            .from('suporte_atendimentos')
            .select('id', { count: 'exact', head: true })
            .eq('verificado', true)
            .eq('status', e);
          return { estado: e, quantidade: error ? null : count };
        }),
      ),
    ]);
  return (
    <div className={s.pagina}>
      <header className={s.cabecalho}>
        <div>
          <Link href="/suporte" className={s.atalho}>
            Central de ajuda
          </Link>
          <h1 className={s.titulo}>Painel de suporte</h1>
        </div>
        {admin && (
          <LinkAcao href="/suporte/equipe/guias" variant="secondary">
            Editar guias
          </LinkAcao>
        )}
      </header>
      <div className={s.numeros}>
        {contagens.map((c) => (
          <div className={s.numero} key={c.estado}>
            <strong>{c.quantidade ?? '—'}</strong>
            <span className={s.meta}>{ESTADOS[c.estado as keyof typeof ESTADOS]}</span>
          </div>
        ))}
      </div>
      {!agentes?.some((a) => a.notificar) && (
        <p className={s.erro}>
          Ninguém da equipe está recebendo avisos por e-mail. Configure os responsáveis abaixo e
          acompanhe a fila por aqui.
        </p>
      )}
      {admin && <EquipeSuporte agentes={agentes ?? []} />}
      <ListaAtendimentos
        casos={casos}
        equipe
        total={total}
        pagina={pagina}
        status={status}
        busca={busca}
        responsavel={responsavel}
      />
      {!!avisos?.length && (
        <details className={s.pergunta}>
          <summary>Notificações que precisam de atenção ({avisos.length})</summary>
          <p className={s.meta}>
            Os atendimentos continuam salvos. Confira a conversa; uma falha de e-mail não significa
            perda da mensagem.
          </p>
          {avisos.map((a) => (
            <Link className={s.atalho} key={a.id} href={`/suporte/equipe/${a.atendimento}`}>
              Ver atendimento ·{' '}
              {a.estado === 'devolvido'
                ? 'E-mail devolvido'
                : a.estado === 'expirado'
                  ? 'Envio sem confirmação'
                  : 'Falha de envio'}
            </Link>
          ))}
        </details>
      )}
    </div>
  );
}
