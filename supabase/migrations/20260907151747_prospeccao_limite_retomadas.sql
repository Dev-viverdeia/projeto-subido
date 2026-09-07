-- Interrupção da Function também conta como tentativa; não repetir provedores sem limite.
begin;
create or replace function public.operacoes_sistema_reivindicar(
  p_limite integer default 4,
  p_worker text default 'worker',
  p_tipos public.operacao_tipo[] default array['prospeccao','pos_call']::public.operacao_tipo[],
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

  -- O trigger de falha final encerra a lista e estorna dentro desta transação.
  update public.operacoes_jobs
  set status='falhou', concluido_em=now(), bloqueado_ate=null,
      bloqueio_id=null, bloqueado_por=null,
      erro_codigo='limite_retomadas', erro_mensagem='A busca foi interrompida e atingiu o limite de tentativas.'
  where tipo='prospeccao' and tipo=any(p_tipos)
    and (p_job_id is null or id=p_job_id)
    and status='processando' and bloqueado_ate <= now()
    and tentativas >= max_tentativas;

  return query
  with configuracao as (
    select * from public.operacoes_configuracao where id = true
  ), capacidades (tipo, limite) as (
    select 'prospeccao'::public.operacao_tipo, prospeccoes_globais_processando from configuracao
    union all
    select 'encerramento_sala'::public.operacao_tipo, 12 from configuracao
    union all
    select 'pos_call'::public.operacao_tipo, pos_calls_globais_processando from configuracao
  ), ativos as (
    select job.tipo, count(*)::integer as total from public.operacoes_jobs job
    where job.status='processando' and job.bloqueado_ate > now() group by job.tipo
  ), candidatas as (
    select escolhida.id, escolhida.prioridade, escolhida.disponivel_em, escolhida.criado_em
    from capacidades capacidade left join ativos on ativos.tipo=capacidade.tipo
    cross join lateral (
      select job.id, job.prioridade, job.disponivel_em, job.criado_em
      from public.operacoes_jobs job
      where job.tipo=capacidade.tipo and job.tipo=any(p_tipos)
        and (p_job_id is null or job.id=p_job_id)
        and (
          (job.status='pendente' and job.disponivel_em<=now() and job.tentativas<job.max_tentativas)
          or (job.status='processando' and job.bloqueado_ate is not null and job.bloqueado_ate<=now())
        )
      order by job.prioridade desc, job.disponivel_em, job.criado_em
      for update of job skip locked
      limit greatest(capacidade.limite-coalesce(ativos.total,0),0)
    ) escolhida
    order by escolhida.prioridade desc, escolhida.disponivel_em, escolhida.criado_em
    limit p_limite
  )
  update public.operacoes_jobs job
  set status='processando', tentativas=least(job.tentativas+1,job.max_tentativas),
      bloqueio_id=gen_random_uuid(), bloqueado_ate=now()+interval '6 minutes',
      bloqueado_por=left(coalesce(nullif(btrim(p_worker),''),'worker'),160),
      iniciado_em=coalesce(job.iniciado_em,now()), erro_codigo=null, erro_mensagem=null
  from candidatas where job.id=candidatas.id returning job.*;
end;
$$;
revoke all on function public.operacoes_sistema_reivindicar(integer,text,public.operacao_tipo[],uuid)
  from public, anon, authenticated;
grant execute on function public.operacoes_sistema_reivindicar(integer,text,public.operacao_tipo[],uuid)
  to service_role;
commit;
