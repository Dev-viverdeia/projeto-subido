-- =============================================================================
-- OPERACOES DURAVEIS · JORNADA DE OURO
--
-- Prospecção e pós-call não podem depender da vida de uma única Function. Cada
-- trabalho passa a existir no Postgres antes de começar, com trava, tentativas,
-- retomada e trilha de erro. O enriquecimento continua rodando na Edge Function,
-- mas entra na mesma visão operacional e recebe um watchdog que encerra e
-- estorna execuções abandonadas.
-- =============================================================================

begin;

create type public.operacao_tipo as enum (
  'prospeccao',
  'enriquecimento',
  'pos_call'
);

create type public.operacao_status as enum (
  'pendente',
  'processando',
  'concluida',
  'falhou',
  'cancelada'
);

create table public.operacoes_jobs (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  tipo public.operacao_tipo not null,
  chave_idempotencia text not null,
  referencia_tipo text not null,
  referencia_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status public.operacao_status not null default 'pendente',
  prioridade smallint not null default 0,
  tentativas integer not null default 0,
  max_tentativas integer not null default 3,
  disponivel_em timestamptz not null default now(),
  bloqueado_ate timestamptz,
  bloqueio_id uuid,
  bloqueado_por text,
  iniciado_em timestamptz,
  concluido_em timestamptz,
  erro_codigo text,
  erro_mensagem text,
  resultado jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint operacoes_jobs_chave_tamanho
    check (char_length(chave_idempotencia) between 3 and 300),
  constraint operacoes_jobs_referencia_tamanho
    check (char_length(referencia_tipo) between 2 and 80),
  constraint operacoes_jobs_payload_objeto
    check (jsonb_typeof(payload) = 'object'),
  constraint operacoes_jobs_resultado_objeto
    check (resultado is null or jsonb_typeof(resultado) = 'object'),
  constraint operacoes_jobs_tentativas_validas
    check (tentativas >= 0 and max_tentativas between 1 and 10),
  constraint operacoes_jobs_erro_codigo_tamanho
    check (erro_codigo is null or char_length(erro_codigo) <= 120),
  constraint operacoes_jobs_erro_mensagem_tamanho
    check (erro_mensagem is null or char_length(erro_mensagem) <= 2000),
  unique (dono, tipo, chave_idempotencia)
);

comment on table public.operacoes_jobs is
  'Fila durável e trilha operacional de prospecções, enriquecimentos e análises pós-call.';
comment on column public.operacoes_jobs.chave_idempotencia is
  'Identidade estável do trabalho; impede cobrança ou processamento duplicado.';
comment on column public.operacoes_jobs.bloqueio_id is
  'Token efêmero que prova qual worker pode concluir ou falhar a tentativa atual.';

create index operacoes_jobs_fila_idx
  on public.operacoes_jobs (status, disponivel_em, prioridade desc, criado_em)
  where status in ('pendente', 'processando');
create index operacoes_jobs_dono_tempo_idx
  on public.operacoes_jobs (dono, criado_em desc);
create index operacoes_jobs_referencia_idx
  on public.operacoes_jobs (tipo, referencia_id);
create index operacoes_jobs_falhas_idx
  on public.operacoes_jobs (atualizado_em desc)
  where status = 'falhou';

create trigger operacoes_jobs_atualizado_em
  before update on public.operacoes_jobs
  for each row execute function private.tocar_atualizado_em();

alter table public.operacoes_jobs enable row level security;

create policy operacoes_jobs_select on public.operacoes_jobs
  for select to authenticated
  using (dono = (select auth.uid()));

revoke all on public.operacoes_jobs from public, anon, authenticated;
grant select on public.operacoes_jobs to authenticated;
grant select, insert, update, delete on public.operacoes_jobs to service_role;

-- Reivindica trabalhos vencidos sem permitir dois workers na mesma tentativa.
-- A trava expira para que uma Function interrompida não deixe o trabalho órfão.
create function public.operacoes_sistema_reivindicar(
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

  return query
  with candidatas as (
    select job.id
    from public.operacoes_jobs job
    where job.tipo = any(p_tipos)
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
    for update skip locked
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

create function public.operacoes_sistema_concluir(
  p_job uuid,
  p_bloqueio uuid,
  p_resultado jsonb default '{}'::jsonb
)
returns public.operacoes_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.operacoes_jobs;
begin
  if jsonb_typeof(coalesce(p_resultado, '{}'::jsonb)) <> 'object' then
    raise exception 'resultado_invalido' using errcode = '22023';
  end if;

  update public.operacoes_jobs
  set status = 'concluida',
      resultado = coalesce(p_resultado, '{}'::jsonb),
      concluido_em = now(),
      bloqueado_ate = null,
      bloqueio_id = null,
      bloqueado_por = null,
      erro_codigo = null,
      erro_mensagem = null
  where id = p_job
    and status = 'processando'
    and bloqueio_id = p_bloqueio
  returning * into v_job;

  if v_job.id is null then
    raise exception 'operacao_sem_trava' using errcode = '55000';
  end if;

  return v_job;
end;
$$;

revoke all on function public.operacoes_sistema_concluir(uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.operacoes_sistema_concluir(uuid, uuid, jsonb)
  to service_role;

-- Falhas transitórias voltam à fila com espera crescente. Somente a última
-- tentativa termina como falha, momento em que a camada de negócio compensa
-- créditos ou apresenta uma ação de recuperação.
create function public.operacoes_sistema_falhar(
  p_job uuid,
  p_bloqueio uuid,
  p_codigo text,
  p_mensagem text
)
returns public.operacoes_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.operacoes_jobs;
begin
  update public.operacoes_jobs
  set status = case
        when tentativas >= max_tentativas then 'falhou'::public.operacao_status
        else 'pendente'::public.operacao_status
      end,
      disponivel_em = case
        when tentativas >= max_tentativas then disponivel_em
        else now() + make_interval(secs => least(300, 15 * (2 ^ greatest(tentativas - 1, 0))::integer))
      end,
      concluido_em = case when tentativas >= max_tentativas then now() else null end,
      bloqueado_ate = null,
      bloqueio_id = null,
      bloqueado_por = null,
      erro_codigo = left(coalesce(nullif(btrim(p_codigo), ''), 'erro_operacional'), 120),
      erro_mensagem = left(coalesce(nullif(btrim(p_mensagem), ''), 'Não foi possível concluir esta operação.'), 2000)
  where id = p_job
    and status = 'processando'
    and bloqueio_id = p_bloqueio
  returning * into v_job;

  if v_job.id is null then
    raise exception 'operacao_sem_trava' using errcode = '55000';
  end if;

  return v_job;
end;
$$;

revoke all on function public.operacoes_sistema_falhar(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.operacoes_sistema_falhar(uuid, uuid, text, text)
  to service_role;

create function public.operacoes_sistema_reagendar(p_job uuid)
returns public.operacoes_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.operacoes_jobs;
begin
  update public.operacoes_jobs
  set status = 'pendente',
      tentativas = 0,
      disponivel_em = now(),
      bloqueado_ate = null,
      bloqueio_id = null,
      bloqueado_por = null,
      iniciado_em = null,
      concluido_em = null,
      erro_codigo = null,
      erro_mensagem = null
  where id = p_job
    and tipo = 'pos_call'
    and status = 'falhou'
  returning * into v_job;

  if v_job.id is null then
    raise exception 'operacao_nao_reagendavel' using errcode = '55000';
  end if;

  return v_job;
end;
$$;

revoke all on function public.operacoes_sistema_reagendar(uuid)
  from public, anon, authenticated;
grant execute on function public.operacoes_sistema_reagendar(uuid)
  to service_role;

-- O enriquecimento é criado pela RPC já existente. Este trigger o espelha na
-- central operacional sem alterar seu fluxo de autorização ou de cobrança.
create function private.operacoes_acompanhar_enriquecimento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.operacao_status;
begin
  v_status := case new.status
    when 'na_fila' then 'pendente'::public.operacao_status
    when 'processando' then 'processando'::public.operacao_status
    when 'concluido' then 'concluida'::public.operacao_status
    else 'falhou'::public.operacao_status
  end;

  insert into public.operacoes_jobs (
    dono,
    tipo,
    chave_idempotencia,
    referencia_tipo,
    referencia_id,
    payload,
    status,
    prioridade,
    max_tentativas,
    iniciado_em,
    concluido_em,
    erro_codigo,
    erro_mensagem
  ) values (
    new.dono,
    'enriquecimento',
    'enriquecimento:' || new.id::text,
    'crm_enriquecimento',
    new.id,
    jsonb_build_object(
      'oportunidadeId', new.oportunidade_id,
      'empresaId', new.empresa_id
    ),
    v_status,
    5,
    1,
    new.iniciado_em,
    new.concluido_em,
    case when new.status = 'falhou' then 'enriquecimento_falhou' else null end,
    case when new.status = 'falhou' then new.erro else null end
  )
  on conflict (dono, tipo, chave_idempotencia)
  do update set
    status = excluded.status,
    payload = excluded.payload,
    iniciado_em = excluded.iniciado_em,
    concluido_em = excluded.concluido_em,
    erro_codigo = excluded.erro_codigo,
    erro_mensagem = excluded.erro_mensagem;

  return new;
end;
$$;

revoke all on function private.operacoes_acompanhar_enriquecimento()
  from public, anon, authenticated;

create trigger crm_enriquecimento_operacao
  after insert or update of status, iniciado_em, concluido_em, erro
  on public.crm_enriquecimentos
  for each row execute function private.operacoes_acompanhar_enriquecimento();

-- Se a Edge Function morrer antes de gravar o resultado, o status muda para
-- falhou e o trigger já existente devolve os créditos exatamente uma vez.
create function public.operacoes_sistema_recuperar_enriquecimentos()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer := 0;
begin
  update public.crm_enriquecimentos
  set status = 'falhou',
      erro = 'O processamento foi interrompido. Seus créditos foram devolvidos; você pode tentar novamente.',
      concluido_em = now()
  where (
      status = 'na_fila'
      and solicitado_em < now() - interval '10 minutes'
    ) or (
      status = 'processando'
      and atualizado_em < now() - interval '15 minutes'
    );

  get diagnostics v_total = row_count;
  return v_total;
end;
$$;

revoke all on function public.operacoes_sistema_recuperar_enriquecimentos()
  from public, anon, authenticated;
grant execute on function public.operacoes_sistema_recuperar_enriquecimentos()
  to service_role;

-- Traz o histórico existente para a nova central sem reabrir trabalhos antigos.
insert into public.operacoes_jobs (
  dono,
  tipo,
  chave_idempotencia,
  referencia_tipo,
  referencia_id,
  payload,
  status,
  prioridade,
  max_tentativas,
  iniciado_em,
  concluido_em,
  erro_codigo,
  erro_mensagem,
  criado_em,
  atualizado_em
)
select
  enriquecimento.dono,
  'enriquecimento',
  'enriquecimento:' || enriquecimento.id::text,
  'crm_enriquecimento',
  enriquecimento.id,
  jsonb_build_object(
    'oportunidadeId', enriquecimento.oportunidade_id,
    'empresaId', enriquecimento.empresa_id
  ),
  case enriquecimento.status
    when 'na_fila' then 'pendente'::public.operacao_status
    when 'processando' then 'processando'::public.operacao_status
    when 'concluido' then 'concluida'::public.operacao_status
    else 'falhou'::public.operacao_status
  end,
  5,
  1,
  enriquecimento.iniciado_em,
  enriquecimento.concluido_em,
  case when enriquecimento.status = 'falhou' then 'enriquecimento_falhou' else null end,
  case when enriquecimento.status = 'falhou' then enriquecimento.erro else null end,
  enriquecimento.solicitado_em,
  enriquecimento.atualizado_em
from public.crm_enriquecimentos enriquecimento
on conflict (dono, tipo, chave_idempotencia) do nothing;

commit;
