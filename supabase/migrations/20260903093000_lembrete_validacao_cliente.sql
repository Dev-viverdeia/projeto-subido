-- Um unico lembrete por solicitacao de validacao, 48 horas depois do convite.
-- A reserva acontece no banco para duas execucoes do cron nunca criarem dois e-mails.

begin;

alter table public.projeto_portal_eventos
  add column email_origem_evento_id uuid
    references public.projeto_portal_eventos(id) on delete cascade,
  add constraint projeto_portal_eventos_email_origem_unica unique (email_origem_evento_id);

alter table public.projeto_portal_eventos
  drop constraint projeto_portal_eventos_tipo_valido,
  add constraint projeto_portal_eventos_tipo_valido
    check (tipo in (
      'portal_ativado',
      'portal_desativado',
      'link_rotacionado',
      'aprovacao_solicitada',
      'lembrete_aprovacao',
      'entrega_aprovada',
      'ajustes_solicitados',
      'arquivo_liberado',
      'arquivo_retirado',
      'pendencia_concluida',
      'mudanca_escopo_solicitada',
      'mudanca_escopo_incluida',
      'mudanca_escopo_proposta',
      'mudanca_escopo_aprovada',
      'mudanca_escopo_recusada',
      'encerramento_enviado',
      'projeto_encerrado',
      'revisao_resultado_registrada'
    )),
  add constraint projeto_portal_eventos_lembrete_origem_valida
    check (email_origem_evento_id is null or tipo = 'lembrete_aprovacao');

comment on column public.projeto_portal_eventos.email_origem_evento_id is
  'Solicitacao de aprovacao que originou o lembrete; garante no maximo um lembrete por convite.';

create function public.projeto_sistema_reservar_lembretes_aprovacao(
  p_limite integer default 25
)
returns table (
  evento_id uuid,
  destinatario text,
  empresa text,
  projeto text,
  tarefa text,
  portal_codigo uuid
)
language sql
security definer
set search_path = ''
as $$
  with ultimas_solicitacoes as (
    select distinct on (evento.tarefa_id)
      evento.id as origem_id,
      evento.dono,
      evento.projeto_execucao_id,
      evento.tarefa_id,
      evento.email_destinatario,
      evento.email_status,
      evento.criado_em,
      projeto.titulo as projeto,
      projeto.portal_codigo,
      coalesce(nullif(projeto.documento #>> '{cliente,empresa}', ''), 'Cliente') as empresa,
      tarefa.titulo as tarefa
    from public.projeto_portal_eventos evento
    join public.projetos_execucao projeto
      on projeto.id = evento.projeto_execucao_id
    join public.projeto_tarefas tarefa
      on tarefa.id = evento.tarefa_id
    where evento.tipo = 'aprovacao_solicitada'
      and evento.tarefa_id is not null
      and evento.email_destinatario is not null
      and evento.email_status in ('enviado', 'entregue', 'atrasado')
      and projeto.portal_ativo = true
      and tarefa.cliente_status = 'aguardando'
    order by evento.tarefa_id, evento.criado_em desc, evento.id desc
  ),
  elegiveis as (
    select
      solicitacao.*,
      lembrete.id as lembrete_id,
      lembrete.email_status as lembrete_status,
      lembrete.email_tentativas as lembrete_tentativas,
      lembrete.email_atualizado_em as lembrete_atualizado_em,
      lembrete.criado_em as lembrete_criado_em
    from ultimas_solicitacoes solicitacao
    left join public.projeto_portal_eventos lembrete
      on lembrete.email_origem_evento_id = solicitacao.origem_id
    where solicitacao.criado_em <= now() - interval '48 hours'
      and (
        lembrete.id is null
        or (
          lembrete.email_status in ('nao_solicitado', 'falhou')
          and lembrete.email_tentativas < 3
          and coalesce(lembrete.email_atualizado_em, lembrete.criado_em)
            <= now() - interval '12 hours'
        )
      )
    order by solicitacao.criado_em
    limit least(greatest(coalesce(p_limite, 25), 1), 100)
  ),
  novos as (
    insert into public.projeto_portal_eventos (
      dono,
      projeto_execucao_id,
      tarefa_id,
      tipo,
      autor,
      comentario,
      email_destinatario,
      email_origem_evento_id
    )
    select
      elegivel.dono,
      elegivel.projeto_execucao_id,
      elegivel.tarefa_id,
      'lembrete_aprovacao',
      'prestador',
      'Lembrete automatico apos 48 horas sem resposta.',
      elegivel.email_destinatario,
      elegivel.origem_id
    from elegiveis elegivel
    where elegivel.lembrete_id is null
    on conflict (email_origem_evento_id) do nothing
    returning id, email_destinatario, email_origem_evento_id
  ),
  para_envio as (
    select
      lembrete.id as evento_id,
      elegivel.email_destinatario as destinatario,
      elegivel.empresa,
      elegivel.projeto,
      elegivel.tarefa,
      elegivel.portal_codigo
    from elegiveis elegivel
    join public.projeto_portal_eventos lembrete
      on lembrete.id = elegivel.lembrete_id
    where elegivel.lembrete_id is not null

    union all

    select
      lembrete.id as evento_id,
      elegivel.email_destinatario as destinatario,
      elegivel.empresa,
      elegivel.projeto,
      elegivel.tarefa,
      elegivel.portal_codigo
    from novos lembrete
    join elegiveis elegivel
      on elegivel.origem_id = lembrete.email_origem_evento_id
  )
  select
    evento_id,
    destinatario,
    empresa,
    projeto,
    tarefa,
    portal_codigo
  from para_envio;
$$;

revoke all on function public.projeto_sistema_reservar_lembretes_aprovacao(integer)
  from public, anon, authenticated;
grant execute on function public.projeto_sistema_reservar_lembretes_aprovacao(integer)
  to service_role;

comment on function public.projeto_sistema_reservar_lembretes_aprovacao(integer) is
  'Reserva de forma idempotente lembretes de validacao ainda sem resposta e devolve o lote ao worker.';

commit;
