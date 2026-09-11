begin;

-- Débito preventivo por chamada, independente do recibo da conversa. Cancelar,
-- excluir a mensagem ou retomar com outra tentativa não apaga consumo incerto.
create table public.sobral_uso_reservas (
  id uuid primary key,
  dono uuid not null references auth.users(id) on delete cascade,
  mes date not null,
  reservado bigint not null check(reservado between 1 and 500000),
  realizado bigint check(realizado >= 0),
  criado_em timestamptz not null default now(),
  liquidado_em timestamptz
);
create index sobral_uso_reservas_dono_mes on public.sobral_uso_reservas(dono,mes);
alter table public.sobral_uso_reservas enable row level security;
revoke all on public.sobral_uso_reservas from anon,authenticated;
grant all on public.sobral_uso_reservas to service_role;

create function public.sobral_reservar_uso(p_id uuid,p_dono uuid,p_tokens bigint)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_mes date := date_trunc('month',now() at time zone 'UTC')::date; v_uso bigint;
begin
  if p_tokens is null or p_tokens not between 1 and 500000 then
    raise exception 'limite_sobral_mensal';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sobral:orcamento:'||p_dono::text,0));
  -- ACK perdido nunca admite uma segunda chamada com a mesma reserva.
  if exists(select 1 from public.sobral_uso_reservas where id=p_id) then return false; end if;
  insert into public.consultor_uso(dono,mes,tokens,atualizado_em)
    values(p_dono,v_mes,0,now()) on conflict(dono,mes) do nothing;
  select tokens into v_uso from public.consultor_uso where dono=p_dono and mes=v_mes for update;
  if v_uso+p_tokens > 500000 then raise exception 'limite_sobral_mensal'; end if;
  insert into public.sobral_uso_reservas(id,dono,mes,reservado) values(p_id,p_dono,v_mes,p_tokens);
  update public.consultor_uso set tokens=tokens+p_tokens,atualizado_em=now()
    where dono=p_dono and mes=v_mes;
  return true;
end; $$;

create function public.sobral_liquidar_uso(p_id uuid,p_dono uuid,p_tokens bigint)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v public.sobral_uso_reservas;
begin
  if p_tokens is null or p_tokens<0 then raise exception 'uso_invalido'; end if;
  select * into v from public.sobral_uso_reservas where id=p_id and dono=p_dono for update;
  if not found then raise exception 'reserva_indisponivel'; end if;
  if v.liquidado_em is not null then return false; end if;
  update public.consultor_uso set tokens=greatest(0,tokens-v.reservado+p_tokens),atualizado_em=now()
    where dono=p_dono and mes=v.mes;
  update public.sobral_uso_reservas set realizado=p_tokens,liquidado_em=now() where id=p_id;
  return true;
end; $$;
revoke all on function public.sobral_reservar_uso(uuid,uuid,bigint) from public,anon,authenticated;
revoke all on function public.sobral_liquidar_uso(uuid,uuid,bigint) from public,anon,authenticated;
grant execute on function public.sobral_reservar_uso(uuid,uuid,bigint) to service_role;
grant execute on function public.sobral_liquidar_uso(uuid,uuid,bigint) to service_role;

-- Compatibilidade de rollout: workers antigos ainda contabilizam aqui; os novos
-- já liquidaram o uso no retorno do provedor, mesmo se persistir a resposta falhar.
do $$
declare v_def text;
begin
  select pg_get_functiondef('public.sobral_finalizar_geracao(uuid,uuid,uuid,text,jsonb)'::regprocedure) into v_def;
  if position('if v_tokens>0 then' in v_def)=0 then raise exception 'contrato_finalizacao_alterado'; end if;
  execute replace(v_def,'if v_tokens>0 then',
    'if v_tokens>0 and not coalesce((p_dados->>''uso_reservado'')::boolean,false) then');
end; $$;
commit;
