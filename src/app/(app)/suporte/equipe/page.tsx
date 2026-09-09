import { LinkAcao } from '@/components/suporte/LinkAcao';
import Link from 'next/link';
import { listarAtendimentos, equipeSuporte } from '@/lib/suporte/servidor';
import { ehAdmin } from '@/lib/auth/papeis';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ESTADOS, StatusSchema } from '@/lib/suporte/contrato';
import { resumoFilaSuporte } from '@/lib/suporte/fila';
import { ListaAtendimentos } from '@/components/suporte/ListaAtendimentos';
import { EquipeSuporte } from '@/components/suporte/EquipeSuporte';
import { ConfiguracaoSuporte } from '@/components/suporte/ConfiguracaoSuporte';
import { EmailsSuporte } from '@/components/suporte/EmailsSuporte';
import s from '@/components/suporte/suporte.module.css';
export const metadata = { title: 'Painel de suporte' };
export default async function FilaSuportePage({ searchParams }: PageProps<'/suporte/equipe'>) {
  if (!(await equipeSuporte())) notFound();
  const p = await searchParams;
  const pagina = Math.min(1000, Math.max(0, Math.floor(Number(p.pagina) || 0)));
  const status =
    p.status === undefined || p.status === 'pendentes'
      ? 'pendentes'
      : (StatusSchema.safeParse(p.status).data ?? '');
  const busca = typeof p.busca === 'string' ? p.busca.trim().slice(0, 120) : '';
  const responsavel = p.responsavel === 'meus' || p.responsavel === 'sem' ? p.responsavel : '';
  const db = await createClient();
  const admin = await ehAdmin();
  const { data: emails } = await db
    .from('suporte_email_recebidos')
    .select('id,atendimento,estado,motivo')
    .in('estado', ['revisao', 'falhou'])
    .order('criado_em')
    .limit(30);
  const [{ data: configuracao }, { data: indicadores }] = await Promise.all([
    db.from('suporte_configuracao').select('*').single(),
    db.rpc('suporte_indicadores'),
  ]);
  const metricas =
    indicadores && typeof indicadores === 'object' && !Array.isArray(indicadores)
      ? indicadores
      : {};
  const horas = (v: unknown) =>
    typeof v === 'number' ? `${v.toLocaleString('pt-BR')} h` : 'Sem base';
  const { foraMeta, emailsAtrasados, temas } = await resumoFilaSuporte(
    configuracao?.meta_horas ?? 24,
    admin,
  );
  const [{ casos, total }, { data: agentes }, { data: avisos }, contagens] = await Promise.all([
    listarAtendimentos({ equipe: true, pagina, status, busca, responsavel }),
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
      {admin && configuracao && <ConfiguracaoSuporte {...configuracao} />}
      {!!foraMeta && (
        <Link className={s.avisoResposta} href="/suporte/equipe?status=pendentes">
          <strong>
            {foraMeta} {foraMeta === 1 ? 'pedido precisa' : 'pedidos precisam'} de atenção
          </strong>
          <span>
            A espera passou da meta interna de {configuracao?.meta_horas ?? 24} horas. Ver fila →
          </span>
        </Link>
      )}
      {!!emails?.length && <EmailsSuporte itens={emails} />}
      {!!emailsAtrasados && (
        <p className={s.erro} role="status">
          {emailsAtrasados} e-mail(s) aguardam processamento há mais de 3 minutos. Verifique o
          processamento da fila.
        </p>
      )}
      <ListaAtendimentos
        casos={casos}
        equipe
        total={total}
        pagina={pagina}
        status={status}
        busca={busca}
        responsavel={responsavel}
      />
      <details className={s.pergunta}>
        <summary>Qualidade do atendimento · últimos 30 dias</summary>
        <div className={s.gestao}>
          <div>
            <strong>{horas(metricas.primeira_resposta_horas)}</strong>
            <span>Primeira resposta · mediana</span>
          </div>
          <div>
            <strong>{horas(metricas.resolucao_horas)}</strong>
            <span>Resolução · mediana</span>
          </div>
          <div>
            <strong>
              {typeof metricas.satisfacao === 'number'
                ? `${metricas.satisfacao.toLocaleString('pt-BR')} / 5`
                : 'Sem avaliações'}
            </strong>
            <span>Satisfação do cliente</span>
          </div>
        </div>
        <p className={s.meta}>
          {Number(metricas.pedidos ?? 0)} pedidos · {Number(metricas.respondidos ?? 0)} com resposta
          · {Number(metricas.resolvidos ?? 0)} resolvidos · {Number(metricas.reabertos ?? 0)}{' '}
          reabertos · {Number(metricas.avaliados ?? 0)} avaliações. Tempos corridos dos pedidos
          criados no período.
        </p>
      </details>
      {temas.some((t) => t.total >= 3) && (
        <details className={s.pergunta}>
          <summary>Temas para revisar nos guias</summary>
          <p className={s.meta}>
            Assuntos com mais pedidos nos últimos 30 dias. Revise os guias existentes antes de criar
            outro. Nenhum dado de cliente é levado ao editor.
          </p>
          <div className={s.lista}>
            {temas
              .filter((t) => t.total >= 3)
              .sort((a, b) => b.total - a.total)
              .map((t) => (
                <Link className={s.atalho} key={t.id} href={`/suporte/equipe/guias?tema=${t.id}`}>
                  {t.nome} · {t.total} pedidos · Preparar guia →
                </Link>
              ))}
          </div>
        </details>
      )}
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
