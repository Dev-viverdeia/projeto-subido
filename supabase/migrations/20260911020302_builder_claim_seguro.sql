begin;
create table private.builder_worker_credencial (
  id boolean primary key default true check(id),
  hash bytea not null check(octet_length(hash)=32)
);
create table private.builder_geracoes (
  projeto uuid primary key,
  dono uuid not null references auth.users(id) on delete cascade,
  tentativa uuid not null,
  expira_em timestamptz not null,
  finalizada_em timestamptz
);
create index builder_geracoes_dono on private.builder_geracoes(dono,expira_em);
revoke all on private.builder_worker_credencial,private.builder_geracoes from public,anon,authenticated;

create function private.builder_validar_worker(p_chave text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_chave is null or length(p_chave)<64 or not exists(
    select 1 from private.builder_worker_credencial where hash=extensions.digest(p_chave,'sha256')
  ) then raise exception 'worker_nao_autorizado' using errcode='42501'; end if;
end; $$;
revoke all on function private.builder_validar_worker(text) from public,anon,authenticated;

create function public.builder_iniciar_geracao(p_id uuid,p_respostas jsonb,p_chave text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.builder_solucoes; v_tentativa uuid := gen_random_uuid(); v_dono uuid := auth.uid();
begin
  perform private.builder_validar_worker(p_chave);
  if public.plano_subido_atual() not in ('pro','enterprise') then
    raise exception 'plano_indisponivel' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('builder:'||v_dono::text,0));
  select * into v from public.builder_solucoes where id=p_id and dono=v_dono for update;
  if not found then raise exception 'projeto_indisponivel'; end if;
  if exists(select 1 from private.builder_geracoes where projeto=p_id
    and finalizada_em is null and expira_em>now()) then
    return jsonb_build_object('executar',false);
  end if;
  if (select count(*) from private.builder_geracoes where dono=v_dono
      and finalizada_em is null and expira_em>now()) >= 2 then
    raise exception 'limite_builder_simultaneo';
  end if;
  if p_respostas is null or jsonb_typeof(p_respostas)<>'array' or octet_length(p_respostas::text)>100000 then
    raise exception 'respostas_invalidas'; end if;
  -- 7 min excedem o wall clock máximo de 400s do isolate. Apagar o projeto não
  -- apaga esta reserva, evitando multiplicar workers com exclusões/recriações.
  insert into private.builder_geracoes(projeto,dono,tentativa,expira_em)
    values(p_id,v_dono,v_tentativa,now()+interval '7 minutes')
    on conflict(projeto) do update set dono=excluded.dono,tentativa=excluded.tentativa,
      expira_em=excluded.expira_em,finalizada_em=null;
  update public.builder_solucoes set status='gerando',respostas=p_respostas,erro=null where id=p_id;
  return jsonb_build_object('executar',true,'tentativa',v_tentativa,'ideia',v.ideia_original);
end; $$;

create function public.builder_finalizar_geracao(
  p_id uuid,p_tentativa uuid,p_chave text,p_documento jsonb default null,
  p_modelo text default null,p_erro text default null
) returns boolean language plpgsql security definer set search_path = '' as $$
declare v private.builder_geracoes;
begin
  perform private.builder_validar_worker(p_chave);
  select * into v from private.builder_geracoes where projeto=p_id and dono=auth.uid() for update;
  if not found or v.tentativa<>p_tentativa or v.finalizada_em is not null or v.expira_em<=now() then return false; end if;
  if p_documento is not null and jsonb_typeof(p_documento)<>'object' then raise exception 'documento_invalido'; end if;
  update public.builder_solucoes set
    status=case when p_documento is null then 'falhou'::public.status_builder else 'pronta'::public.status_builder end,
    documento=coalesce(p_documento,documento),
    titulo=case when p_documento is null then titulo else coalesce(p_documento->>'titulo',titulo) end,
    modelo=coalesce(p_modelo,modelo),
    erro=case when p_documento is null then left(coalesce(p_erro,'Não foi possível concluir o projeto.'),2000) else null end
  where id=p_id and dono=v.dono and status='gerando';
  update private.builder_geracoes set finalizada_em=now() where projeto=p_id;
  return true;
end; $$;

create function public.builder_recuperar_geracao(p_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v private.builder_geracoes;
begin
  perform pg_advisory_xact_lock(hashtextextended('builder:'||auth.uid()::text,0));
  select * into v from private.builder_geracoes where projeto=p_id and dono=auth.uid() for update;
  if found and v.finalizada_em is null and v.expira_em>now() then return false; end if;
  update public.builder_solucoes set status='rascunho',erro=null
    where id=p_id and dono=auth.uid() and status='gerando';
  if not found then return false; end if;
  update private.builder_geracoes set finalizada_em=now() where projeto=p_id and dono=auth.uid();
  return true;
end; $$;

revoke all on function public.builder_iniciar_geracao(uuid,jsonb,text) from public,anon;
revoke all on function public.builder_finalizar_geracao(uuid,uuid,text,jsonb,text,text) from public,anon;
revoke all on function public.builder_recuperar_geracao(uuid) from public,anon;
grant execute on function public.builder_iniciar_geracao(uuid,jsonb,text) to authenticated;
grant execute on function public.builder_finalizar_geracao(uuid,uuid,text,jsonb,text,text) to authenticated;
grant execute on function public.builder_recuperar_geracao(uuid) to authenticated;
commit;
