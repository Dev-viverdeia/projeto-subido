-- =============================================================================
-- ESCALA OPERACIONAL
--
-- A fila duravel ja impedia duplicidade por trabalho. Esta camada impede que
-- uma unica conta ou uma rajada global ocupe todos os provedores externos e
-- entrega um resumo barato para a central administrativa.
-- =============================================================================

begin;

create table public.operacoes_configuracao (
  id boolean primary key default true check (id),
  prospeccoes_ativas_por_usuario smallint not null default 2
    check (prospeccoes_ativas_por_usuario between 1 and 10),
  enriquecimentos_ativos_por_usuario smallint not null default 2
    check (enriquecimentos_ativos_por_usuario between 1 and 10),
  prospeccoes_globais_processando smallint not null default 8
    check (prospeccoes_globais_processando between 1 and 100),
  pos_calls_globais_processando smallint not null default 12
    check (pos_calls_globais_processando between 1 and 100),
  alerta_fila_segundos integer not null default 300
    check (alerta_fila_segundos between 60 and 3600),
  alerta_taxa_falha numeric(5, 4) not null default 0.1000
    check (alerta_taxa_falha between 0 and 1),
  alerta_custo_diario_usd_micros bigint not null default 50000000
    check (alerta_custo_diario_usd_micros > 0),
  atualizado_em timestamptz not null default now()
);

insert into public.operacoes_configuracao (id) values (true);

comment on table public.operacoes_configuracao is
  'Limites operacionais ajustaveis sem novo deploy. A tabela e exclusiva do sistema.';

revoke all on public.operacoes_configuracao from public, anon, authenticated;
grant select, update on public.operacoes_configuracao to service_role;

create function private.prospeccao_limitar_execucoes_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limite integer;
  v_ativas integer;
begin
  if new.status <> 'processando' then
    return new;
  end if;

  -- Serializa somente as reservas da mesma conta. Contas diferentes continuam
  -- livres para entrar na fila em paralelo.
  perform pg_advisory_xact_lock(hashtextextended('prospeccao:' || new.dono::text, 0));

  select prospeccoes_ativas_por_usuario into v_limite
  from public.operacoes_configuracao where id = true;

  select count(*) into v_ativas
  from public.prospeccao_listas
  where dono = new.dono and status = 'processando';

  if v_ativas >= v_limite then
    raise exception 'limite_prospeccoes_simultaneas' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.prospeccao_limitar_execucoes_usuario()
  from public, anon, authenticated;

create trigger prospeccao_limite_execucoes_usuario
  before insert on public.prospeccao_listas
  for each row execute function private.prospeccao_limitar_execucoes_usuario();

create function private.crm_limitar_enriquecimentos_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limite integer;
  v_ativos integer;
begin
  if new.status not in ('na_fila', 'processando') then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('enriquecimento:' || new.dono::text, 0));

  select enriquecimentos_ativos_por_usuario into v_limite
  from public.operacoes_configuracao where id = true;

  select count(*) into v_ativos
  from public.crm_enriquecimentos
  where dono = new.dono and status in ('na_fila', 'processando');

  if v_ativos >= v_limite then
    raise exception 'limite_enriquecimentos_simultaneos' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.crm_limitar_enriquecimentos_usuario()
  from public, anon, authenticated;

create trigger crm_limite_enriquecimentos_usuario
  before insert on public.crm_enriquecimentos
  for each row execute function private.crm_limitar_enriquecimentos_usuario();

-- A reivindicacao usa uma trava transacional curta para reservar slots globais
-- sem corrida entre Functions. O trabalho que nao encontra slot continua
-- pendente e o cron o recolhe quando houver capacidade.
create or replace function public.operacoes_sistema_reivindicar(
  p_limite integer default 4,
  p_worker text default 'worker',
  p_tipos public.operacao_tipo[] default array['prospeccao', 'pos_call']::public.operacao_tipo[],
  p_job_id uuid default null
)
returns setof public.operacoes_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limite < 1 or p_limite > 20 then
    raise exception 'limite_invalido' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('operacoes:capacidade-global', 0));

  return query
  with configuracao as (
    select * from public.operacoes_configuracao where id = true
  ),
  capacidades (tipo, limite) as (
    select 'prospeccao'::public.operacao_tipo, prospeccoes_globais_processando
    from configuracao
    union all
    select 'pos_call'::public.operacao_tipo, pos_calls_globais_processando
    from configuracao
  ),
  ativos as (
    select job.tipo, count(*)::integer as total
    from public.operacoes_jobs job
    where job.status = 'processando'
      and job.bloqueado_ate > now()
    group by job.tipo
  ),
  candidatas as (
    select escolhida.id, escolhida.prioridade, escolhida.disponivel_em, escolhida.criado_em
    from capacidades capacidade
    left join ativos on ativos.tipo = capacidade.tipo
    cross join lateral (
      select job.id, job.prioridade, job.disponivel_em, job.criado_em
      from public.operacoes_jobs job
      where job.tipo = capacidade.tipo
        and job.tipo = any(p_tipos)
        and (p_job_id is null or job.id = p_job_id)
        and (
          (
            job.status = 'pendente'
            and job.disponivel_em <= now()
            and job.tentativas < job.max_tentativas
          )
          or (
            job.status = 'processando'
            and job.bloqueado_ate is not null
            and job.bloqueado_ate <= now()
          )
        )
      order by job.prioridade desc, job.disponivel_em, job.criado_em
      for update of job skip locked
      limit greatest(capacidade.limite - coalesce(ativos.total, 0), 0)
    ) escolhida
    order by escolhida.prioridade desc, escolhida.disponivel_em, escolhida.criado_em
    limit p_limite
  )
  update public.operacoes_jobs job
  set status = 'processando',
      tentativas = least(job.tentativas + 1, job.max_tentativas),
      bloqueio_id = gen_random_uuid(),
      bloqueado_ate = now() + interval '6 minutes',
      bloqueado_por = left(coalesce(nullif(btrim(p_worker), ''), 'worker'), 160),
      iniciado_em = coalesce(job.iniciado_em, now()),
      erro_codigo = null,
      erro_mensagem = null
  from candidatas
  where job.id = candidatas.id
  returning job.*;
end;
$$;

revoke all on function public.operacoes_sistema_reivindicar(integer, text, public.operacao_tipo[], uuid)
  from public, anon, authenticated;
grant execute on function public.operacoes_sistema_reivindicar(integer, text, public.operacao_tipo[], uuid)
  to service_role;

create function public.operacoes_sistema_resumo(p_janela_horas integer default 24)
returns table (
  pendentes bigint,
  processando bigint,
  concluidas bigint,
  falhas bigint,
  retomadas bigint,
  espera_maxima_segundos bigint,
  latencia_p95_segundos numeric,
  taxa_sucesso numeric,
  chamadas_provedores bigint,
  falhas_provedores bigint,
  latencia_p95_provedor_ms numeric,
  custo_usd_micros bigint,
  limite_fila_segundos integer,
  limite_taxa_falha numeric,
  limite_custo_usd_micros bigint,
  capacidade_prospeccao integer,
  capacidade_pos_call integer
)
language sql
security definer
set search_path = ''
as $$
  with cfg as (
    select * from public.operacoes_configuracao where id = true
  ),
  janela_jobs as (
    select * from public.operacoes_jobs
    where criado_em >= now() - make_interval(hours => greatest(1, least(p_janela_horas, 168)))
  ),
  janela_custos as (
    select * from public.prospeccao_custos_provedores
    where criado_em >= now() - make_interval(hours => greatest(1, least(p_janela_horas, 168)))
  )
  select
    (select count(*) from public.operacoes_jobs where status = 'pendente')::bigint,
    (select count(*) from public.operacoes_jobs where status = 'processando')::bigint,
    count(*) filter (where janela_jobs.status = 'concluida')::bigint,
    count(*) filter (where janela_jobs.status = 'falhou')::bigint,
    count(*) filter (where janela_jobs.tentativas > 1)::bigint,
    coalesce((
      select extract(epoch from now() - min(criado_em))::bigint
      from public.operacoes_jobs where status = 'pendente'
    ), 0),
    coalesce(percentile_cont(0.95) within group (
      order by extract(epoch from janela_jobs.concluido_em - janela_jobs.criado_em)
    ) filter (where janela_jobs.concluido_em is not null), 0)::numeric,
    coalesce(
      count(*) filter (where janela_jobs.status = 'concluida')::numeric
      / nullif(count(*) filter (where janela_jobs.status in ('concluida', 'falhou')), 0),
      1
    )::numeric,
    (select count(*) from janela_custos)::bigint,
    (select count(*) from janela_custos where status = 'falhou')::bigint,
    coalesce((select percentile_cont(0.95) within group (order by latencia_ms)
      from janela_custos where latencia_ms is not null), 0)::numeric,
    coalesce((select sum(custo_usd_micros) from janela_custos), 0)::bigint,
    cfg.alerta_fila_segundos,
    cfg.alerta_taxa_falha,
    cfg.alerta_custo_diario_usd_micros,
    cfg.prospeccoes_globais_processando::integer,
    cfg.pos_calls_globais_processando::integer
  from cfg left join janela_jobs on true
  group by cfg.id, cfg.alerta_fila_segundos, cfg.alerta_taxa_falha,
    cfg.alerta_custo_diario_usd_micros, cfg.prospeccoes_globais_processando,
    cfg.pos_calls_globais_processando;
$$;

revoke all on function public.operacoes_sistema_resumo(integer)
  from public, anon, authenticated;
grant execute on function public.operacoes_sistema_resumo(integer) to service_role;

commit;
