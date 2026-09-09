begin;

-- Três recibos técnicos, sem conteúdo de conversas ou dados de clientes.
create table public.operacoes_pulsos (
  fase text primary key check (fase in ('recebimento','envio','limpeza')),
  iniciado_em timestamptz not null,
  conferido_em timestamptz not null default now(),
  falhou boolean not null,
  falhas_seguidas integer not null default 0 check (falhas_seguidas >= 0)
);
alter table public.operacoes_pulsos enable row level security;
revoke all on public.operacoes_pulsos from anon,authenticated;
grant all on public.operacoes_pulsos to service_role;

create function public.operacoes_registrar_pulso(p_fase text,p_inicio timestamptz,p_falhou boolean)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_inicio > now()+interval '1 minute' or p_inicio < now()-interval '10 minutes' then
    raise exception 'Ciclo inválido';
  end if;
  insert into public.operacoes_pulsos(fase,iniciado_em,conferido_em,falhou,falhas_seguidas)
  values(p_fase,p_inicio,now(),p_falhou,case when p_falhou then 1 else 0 end)
  on conflict(fase) do update set iniciado_em=excluded.iniciado_em,conferido_em=now(),
    falhou=excluded.falhou,
    falhas_seguidas=case when excluded.falhou then least(1000000,operacoes_pulsos.falhas_seguidas+1) else 0 end
  -- Um ciclo atrasado/repetido nunca apaga a confirmação mais nova.
  where excluded.iniciado_em > operacoes_pulsos.iniciado_em;
end; $$;
revoke all on function public.operacoes_registrar_pulso(text,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.operacoes_registrar_pulso(text,timestamptz,boolean) to service_role;

create index sobral_geracoes_periodo on public.sobral_geracoes(iniciado_em);
create index suporte_email_periodo on public.suporte_email_recebidos(criado_em);
create index suporte_envio_periodo on public.suporte_notificacoes(criado_em);

create function public.operacoes_atendimento_resumo() returns jsonb
language sql stable security invoker set search_path='' as $$
  select jsonb_build_object(
    'verificado_em',now(),
    'ia',(select jsonb_build_object(
      'ativas',count(*) filter(where estado='gerando' and expira_em>now()),
      'expiradas',count(*) filter(where estado='gerando' and expira_em<=now()),
      'concluidas',count(*) filter(where iniciado_em>=now()-interval '24 hours' and estado='concluida'),
      'falhas',count(*) filter(where iniciado_em>=now()-interval '24 hours' and estado='falhou'),
      'interrompidas',count(*) filter(where iniciado_em>=now()-interval '24 hours' and estado='interrompida' and parar_em is null)
    ) from public.sobral_geracoes where iniciado_em>=now()-interval '24 hours' or estado='gerando'),
    'entrada',(select jsonb_build_object(
      'aguardando',count(*) filter(where estado in ('pendente','processando','falhou')),
      'atrasadas',count(*) filter(where estado in ('pendente','processando','falhou') and criado_em<now()-interval '5 minutes'),
      'revisao',count(*) filter(where estado='revisao'),
      'falhas',count(*) filter(where estado='falhou'),
      'concluidas',count(*) filter(where estado='processado' and criado_em>=now()-interval '24 hours')
    ) from public.suporte_email_recebidos where criado_em>=now()-interval '24 hours' or estado in ('pendente','processando','falhou','revisao')),
    'saida',(select jsonb_build_object(
      'aguardando',count(*) filter(where estado in ('pendente','enviando','falhou')),
      'atrasadas',count(*) filter(where estado in ('pendente','enviando','falhou') and criado_em<now()-interval '5 minutes'),
      'falhas',count(*) filter(where estado='falhou'),
      'sem_confirmacao',count(*) filter(where estado='expirado'),
      'devolvidas',count(*) filter(where estado='devolvido'),
      'aceitas',count(*) filter(where estado='enviado'),
      'entregues',count(*) filter(where estado='entregue')
    ) from public.suporte_notificacoes where criado_em>=now()-interval '24 hours' or estado in ('pendente','enviando','falhou')),
    'pulsos',coalesce((select jsonb_agg(jsonb_build_object(
      'fase',fase,'conferido_em',conferido_em,'falhou',falhou,'falhas_seguidas',falhas_seguidas
    ) order by fase) from public.operacoes_pulsos),'[]'::jsonb)
  );
$$;
revoke all on function public.operacoes_atendimento_resumo() from public,anon,authenticated;
grant execute on function public.operacoes_atendimento_resumo() to service_role;
commit;
