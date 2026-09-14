-- Aviso preventivo; não é uma reserva transacional de horário.
create or replace function public.calls_conferir_horario(
  p_inicio timestamptz,
  p_duracao_minutos integer,
  p_ignorar uuid default null
)
returns table (
  id uuid,
  titulo text,
  agendada_para timestamptz,
  duracao_minutos integer,
  total bigint,
  versao text
)
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão necessária' using errcode = '42501';
  end if;
  if p_inicio is null or not pg_catalog.isfinite(p_inicio)
    or p_duracao_minutos is null or p_duracao_minutos not between 15 and 240 then
    raise exception 'Horário inválido' using errcode = '22023';
  end if;
  return query
  with conflitos as materialized (
    select r.id, r.titulo, r.agendada_para, r.duracao_minutos::integer as duracao_minutos
    from public.calls_reunioes r
    where r.dono = (select auth.uid())
      and r.status in ('agendada', 'aguardando', 'ao_vivo')
      and (p_ignorar is null or r.id <> p_ignorar)
      -- calls_reunioes_duracao_intervalo limita toda reunião a 240 minutos.
      -- O índice (dono, agendada_para, id) limita a leitura à janela relevante.
      and r.agendada_para > p_inicio - interval '240 minutes'
      and r.agendada_para < p_inicio + pg_catalog.make_interval(mins => p_duracao_minutos)
      and r.agendada_para + pg_catalog.make_interval(mins => r.duracao_minutos) > p_inicio
  ), resumo as (
    select pg_catalog.count(*) as total,
      pg_catalog.md5(pg_catalog.string_agg(
        c.id::text || c.agendada_para::text || c.duracao_minutos::text || c.titulo,
        '|' order by c.id
      )) as versao
    from conflitos c
  )
  select c.id, c.titulo, c.agendada_para, c.duracao_minutos, s.total, s.versao
  from conflitos c cross join resumo s
  order by c.agendada_para, c.id
  limit 5;
end;
$$;
revoke all on function public.calls_conferir_horario(timestamptz, integer, uuid) from public, anon;
grant execute on function public.calls_conferir_horario(timestamptz, integer, uuid) to authenticated;
