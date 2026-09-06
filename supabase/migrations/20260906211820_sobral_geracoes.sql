-- Uma geração por pergunta, com recibo persistente. Somente o servidor escreve.
create table public.sobral_geracoes (
  mensagem_id uuid primary key references public.consultor_mensagens(id) on delete cascade,
  thread_id uuid not null references public.consultor_threads(id) on delete cascade,
  dono uuid not null references auth.users(id) on delete cascade,
  tentativa uuid not null,
  estado text not null check (estado in ('gerando','concluida','interrompida','falhou')),
  texto text not null default '' check (char_length(texto) <= 3000),
  erro text check (char_length(erro) <= 500),
  resposta_id uuid references public.consultor_mensagens(id) on delete set null,
  parar_em timestamptz,
  iniciado_em timestamptz not null default now(),
  expira_em timestamptz not null default now() + interval '4 minutes',
  tokens bigint check (tokens >= 0)
);
create index sobral_geracoes_dono_idx on public.sobral_geracoes(dono);
create index sobral_geracoes_thread_idx on public.sobral_geracoes(thread_id);
alter table public.sobral_geracoes enable row level security;
create policy sobral_geracoes_ler on public.sobral_geracoes for select to authenticated
  using (dono = (select auth.uid()));
revoke all on public.sobral_geracoes from anon, authenticated;
grant select on public.sobral_geracoes to authenticated;
grant all on public.sobral_geracoes to service_role;

create function public.sobral_iniciar_geracao(
  p_dono uuid, p_thread uuid, p_mensagem uuid, p_tentativa uuid, p_repetir boolean
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v public.sobral_geracoes; v_ultima uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_thread::text, 0));
  if p_tentativa is null or not exists (
    select 1 from public.consultor_mensagens m join public.consultor_threads t on t.id=m.thread_id
    where m.id=p_mensagem and t.id=p_thread and t.dono=p_dono and m.papel='usuario'
  ) then raise exception 'Pergunta indisponível'; end if;
  select * into v from public.sobral_geracoes where mensagem_id=p_mensagem for update;
  if found then
    if v.estado='gerando' and v.expira_em < now() then
      update public.sobral_geracoes set estado='interrompida', erro='A resposta foi interrompida.'
        where mensagem_id=p_mensagem returning * into v;
    end if;
    if v.estado in ('gerando','concluida') or v.tentativa=p_tentativa or not p_repetir then
      return jsonb_build_object('executar',false,'geracao',to_jsonb(v));
    end if;
  end if;
  select id into v_ultima from public.consultor_mensagens where thread_id=p_thread
    order by criado_em desc, id desc limit 1;
  if v_ultima is distinct from p_mensagem then raise exception 'A conversa já avançou'; end if;
  if exists (select 1 from public.sobral_geracoes where thread_id=p_thread
    and mensagem_id<>p_mensagem and estado='gerando' and expira_em>now()) then
    raise exception 'Já existe uma resposta em andamento';
  end if;
  insert into public.sobral_geracoes(mensagem_id,thread_id,dono,tentativa,estado)
    values(p_mensagem,p_thread,p_dono,p_tentativa,'gerando')
    on conflict(mensagem_id) do update set tentativa=excluded.tentativa,estado='gerando',
      texto='',erro=null,parar_em=null,tokens=null,iniciado_em=now(),expira_em=now()+interval '4 minutes'
    returning * into v;
  return jsonb_build_object('executar',true,'geracao',to_jsonb(v));
end; $$;

-- Resposta, contador de uso e recibo final fazem parte da mesma transação.
create function public.sobral_finalizar_geracao(
  p_dono uuid,p_mensagem uuid,p_tentativa uuid,p_estado text,p_dados jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v public.sobral_geracoes; v_resposta uuid; v_estado text; v_texto text; v_tokens bigint;
begin
  select * into v from public.sobral_geracoes where mensagem_id=p_mensagem and dono=p_dono for update;
  if not found or v.tentativa<>p_tentativa then raise exception 'Tentativa indisponível'; end if;
  if v.estado<>'gerando' then return to_jsonb(v); end if;
  if p_estado not in ('concluida','interrompida','falhou') then raise exception 'Estado inválido'; end if;
  v_estado := case when v.parar_em is not null then 'interrompida' else p_estado end;
  v_texto := left(coalesce(p_dados->>'texto',v.texto),3000);
  v_tokens := (p_dados->>'tokens')::bigint;
  if v_estado='concluida' then
    if char_length(v_texto)<20 then raise exception 'Resposta incompleta'; end if;
    insert into public.consultor_mensagens(thread_id,papel,conteudo,cartoes,direcao,modelo)
      values(v.thread_id,'consultor',v_texto,p_dados->'cartoes',p_dados->'direcao',p_dados->>'modelo')
      returning id into v_resposta;
    if nullif(p_dados->>'contexto_anexos','') is not null then
      update public.consultor_mensagens set contexto_anexos=p_dados->>'contexto_anexos' where id=p_mensagem;
    end if;
  end if;
  if v_tokens>0 then
    perform public.registrar_uso_sobral(p_dono,date_trunc('month',v.iniciado_em at time zone 'UTC')::date,v_tokens);
  end if;
  update public.sobral_geracoes set estado=v_estado,texto=v_texto,
    erro=left(p_dados->>'erro',500),resposta_id=v_resposta,tokens=v_tokens
    where mensagem_id=p_mensagem returning * into v;
  update public.consultor_threads set atualizado_em=now() where id=v.thread_id and dono=p_dono;
  return to_jsonb(v);
end; $$;
revoke all on function public.sobral_iniciar_geracao(uuid,uuid,uuid,uuid,boolean) from public,anon,authenticated;
revoke all on function public.sobral_finalizar_geracao(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.sobral_iniciar_geracao(uuid,uuid,uuid,uuid,boolean) to service_role;
grant execute on function public.sobral_finalizar_geracao(uuid,uuid,uuid,text,jsonb) to service_role;
