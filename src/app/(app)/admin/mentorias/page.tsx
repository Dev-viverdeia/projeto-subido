import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarPlus2, PencilLine } from 'lucide-react';
import { Button, EmptyState, Pill } from '@/design-system/via';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../../_components/CabecalhoPagina';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Mentorias · Administração' };

const FORMATADOR = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const STATUS = {
  publicado: { rotulo: 'publicada', variant: 'success' },
  rascunho: { rotulo: 'rascunho', variant: 'attn' },
  arquivado: { rotulo: 'arquivada', variant: 'default' },
} as const;

export default async function AdminMentoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('mentorias')
    .select(
      'id, titulo, inicio, fim, vagas, custo_creditos, status, mentor:mentores!mentorias_mentor_id_fkey(nome)',
    )
    .order('inicio', { ascending: false });

  const ids = (data ?? []).map((sessao) => sessao.id);
  const { data: ocupacao } = ids.length
    ? await supabase.rpc('mentoria_ocupacao', { _ids: ids })
    : { data: [] };
  const inscritos = new Map((ocupacao ?? []).map((linha) => [linha.mentoria_id, linha.inscritos]));
  const agora = new Date().getTime();
  const proximas = (data ?? []).filter((sessao) => new Date(sessao.fim).getTime() >= agora);
  const anteriores = (data ?? []).filter((sessao) => new Date(sessao.fim).getTime() < agora);

  return (
    <>
      <CabecalhoPagina titulo="Mentorias" oculto />

      <header className={styles.cabecalho}>
        <div>
          <p className={styles.sobretitulo}>Agenda administrável</p>
          <h1>Mentorias</h1>
          <p>Publique as próximas sessões, defina o custo e abra a sala quando estiver pronta.</p>
        </div>
        <Link href="/admin/mentorias/nova">
          <Button variant="primary" iconLeft={<CalendarPlus2 size={16} aria-hidden="true" />}>
            Nova sessão
          </Button>
        </Link>
      </header>

      {(data ?? []).length === 0 ? (
        <EmptyState
          icon={<CalendarPlus2 size={20} strokeWidth={1.8} />}
          title="Nenhuma mentoria cadastrada"
          description="Crie a primeira sessão com data, mentor, vagas e custo em créditos."
          action={
            <Link href="/admin/mentorias/nova">
              <Button variant="primary">Criar sessão</Button>
            </Link>
          }
        />
      ) : (
        <div className={styles.grupos}>
          <ListaSessoes titulo="Próximas sessões" sessoes={proximas} inscritos={inscritos} />
          {anteriores.length > 0 ? (
            <ListaSessoes titulo="Histórico" sessoes={anteriores} inscritos={inscritos} discreta />
          ) : null}
        </div>
      )}
    </>
  );
}

function ListaSessoes({
  titulo,
  sessoes,
  inscritos,
  discreta = false,
}: {
  titulo: string;
  sessoes: Array<{
    id: string;
    titulo: string;
    inicio: string;
    fim: string;
    vagas: number;
    custo_creditos: number;
    status: 'rascunho' | 'publicado' | 'arquivado';
    mentor: { nome: string } | null;
  }>;
  inscritos: Map<string, number>;
  discreta?: boolean;
}) {
  if (sessoes.length === 0) return null;

  return (
    <section className={styles.grupo} data-discreto={discreta ? '' : undefined}>
      <div className={styles.grupoCabecalho}>
        <h2>{titulo}</h2>
        <span>{sessoes.length}</span>
      </div>
      <ul className={styles.lista}>
        {sessoes.map((sessao) => {
          const estado = STATUS[sessao.status];
          return (
            <li key={sessao.id}>
              <Link href={`/admin/mentorias/${sessao.id}`} className={styles.linha}>
                <time dateTime={sessao.inicio} className={styles.data}>
                  {FORMATADOR.format(new Date(sessao.inicio))}
                </time>
                <span className={styles.principal}>
                  <strong>{sessao.titulo}</strong>
                  <span>{sessao.mentor?.nome ?? 'Mentor não encontrado'}</span>
                </span>
                <span className={styles.indicadores}>
                  <span>
                    {inscritos.get(sessao.id) ?? 0}/{sessao.vagas} check-ins
                  </span>
                  <span>
                    {sessao.custo_creditos} {sessao.custo_creditos === 1 ? 'crédito' : 'créditos'}
                  </span>
                </span>
                <Pill variant={estado.variant} size="sm">
                  {estado.rotulo}
                </Pill>
                <PencilLine size={15} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
