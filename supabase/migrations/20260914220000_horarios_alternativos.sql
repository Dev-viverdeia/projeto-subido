-- Alternativas de conveniência, não reserva de horário nem disponibilidade do Google.
create or replace function public.calls_sugerir_horarios(
  p_inicio timestamptz,
  p_duracao_minutos integer,
  p_fuso text,
  p_ignorar uuid default null
)
returns table (inicio timestamptz)
language plpgsql stable security invoker set search_path = ''
as $$
declare
  dia_base date;
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão necessária' using errcode = '42501';
  end if;
  if p_inicio is null or not pg_catalog.isfinite(p_inicio)
    or p_duracao_minutos is null or p_duracao_minutos not between 15 and 240
    or p_fuso is null or pg_catalog.length(p_fuso) > 100
    or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_fuso) then
    raise exception 'Horário inválido' using errcode = '22023';
  end if;
  dia_base := (greatest(p_inicio, pg_catalog.now()) at time zone p_fuso)::date;
  return query
  with ocupados as materialized (
    select r.agendada_para as comeco,
      r.agendada_para + pg_catalog.make_interval(mins => r.duracao_minutos) as fim
    from public.calls_reunioes r
    where r.dono = (select auth.uid())
      and r.status in ('agendada', 'aguardando', 'ao_vivo')
      and (p_ignorar is null or r.id <> p_ignorar)
      -- Usa a janela do índice de agenda e o limite existente de 240 minutos.
      and r.agendada_para > (dia_base::timestamp at time zone p_fuso) - interval '240 minutes'
      and r.agendada_para < ((dia_base + 7)::timestamp at time zone p_fuso)
  ), locais as (
    select (dia_base + d.n)::timestamp + interval '9 hours'
      + pg_catalog.make_interval(mins => h.n * 30) as horario
    from pg_catalog.generate_series(0, 6) d(n)
    cross join pg_catalog.generate_series(0, 17) h(n)
    where extract(isodow from dia_base + d.n) between 1 and 5
  ), candidatos as (
    select l.horario, l.horario at time zone p_fuso as comeco,
      (l.horario at time zone p_fuso) + pg_catalog.make_interval(mins => p_duracao_minutos) as fim
    from locais l
  )
  select c.comeco
  from candidatos c
  where c.comeco > p_inicio and c.comeco > pg_catalog.now()
    and (c.comeco at time zone p_fuso) = c.horario
    and (c.fim at time zone p_fuso)::date = c.horario::date
    and (c.fim at time zone p_fuso)::time <= time '18:00'
    and not exists (
      select 1 from ocupados o where o.comeco < c.fim and o.fim > c.comeco
    )
  order by c.comeco
  limit 3;
end;
$$;
revoke all on function public.calls_sugerir_horarios(timestamptz, integer, text, uuid) from public, anon;
grant execute on function public.calls_sugerir_horarios(timestamptz, integer, text, uuid) to authenticated;
