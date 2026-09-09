begin;

alter table public.operacoes_configuracao
  add column sobral_geracoes_ativas_por_usuario smallint not null default 2
  check (sobral_geracoes_ativas_por_usuario between 1 and 10);
create index sobral_geracoes_ativas_dono on public.sobral_geracoes(dono,expira_em)
  where estado='gerando';

-- O limite é por conta, mesmo abrindo várias conversas/abas. Replays continuam
-- retornando o mesmo recibo; só uma geração realmente nova ocupa outra vaga.
create or replace function public.sobral_iniciar_geracao(
  p_dono uuid, p_thread uuid, p_mensagem uuid, p_tentativa uuid, p_repetir boolean
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v public.sobral_geracoes; v_ultima uuid; v_limite integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('sobral:' || p_dono::text,0));
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
  select sobral_geracoes_ativas_por_usuario into v_limite
    from public.operacoes_configuracao where id=true;
  if (select count(*) from public.sobral_geracoes
      where dono=p_dono and estado='gerando' and expira_em>now()) >= coalesce(v_limite,2) then
    raise exception 'limite_sobral_simultaneo' using errcode='P0001';
  end if;
  insert into public.sobral_geracoes(mensagem_id,thread_id,dono,tentativa,estado)
    values(p_mensagem,p_thread,p_dono,p_tentativa,'gerando')
    on conflict(mensagem_id) do update set tentativa=excluded.tentativa,estado='gerando',
      texto='',erro=null,parar_em=null,tokens=null,iniciado_em=now(),expira_em=now()+interval '4 minutes'
    returning * into v;
  return jsonb_build_object('executar',true,'geracao',to_jsonb(v));
end; $$;
revoke all on function public.sobral_iniciar_geracao(uuid,uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.sobral_iniciar_geracao(uuid,uuid,uuid,uuid,boolean) to service_role;

-- Reserva curta, um envio por vez. Um cron sobreposto não multiplica envios;
-- uma interrupção deixa somente o item em execução aguardando retomada.
create index suporte_notificacoes_ritmo on public.suporte_notificacoes(estado,atualizado_em);
create or replace function public.suporte_notificacoes_reservar() returns setof public.suporte_notificacoes
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('suporte:envio-global',0));
  update public.suporte_notificacoes set estado='expirado',erro='Confira o recebimento antes de reenviar.'
    where estado in ('pendente','falhou','enviando') and criado_em < now()-interval '23 hours';
  if exists(select 1 from public.suporte_notificacoes
    where estado='enviando' and atualizado_em>=now()-interval '5 minutes') then return; end if;
  -- Inclui o último envio concluído para respeitar o ritmo entre invocações.
  if exists(select 1 from public.suporte_notificacoes
    where estado in ('enviando','enviado','entregue','falhou')
      and atualizado_em>now()-interval '600 milliseconds') then return; end if;
  return query
  update public.suporte_notificacoes set estado='enviando',tentativas=tentativas+1,atualizado_em=now()
  where id in (select id from public.suporte_notificacoes where
    ((estado in ('pendente','falhou') and atualizado_em < now()-interval '30 seconds') or
    (estado='enviando' and atualizado_em < now()-interval '5 minutes')) and tentativas<5
    order by criado_em for update skip locked limit 1) returning *;
end; $$;
revoke all on function public.suporte_notificacoes_reservar() from public,anon,authenticated;
grant execute on function public.suporte_notificacoes_reservar() to service_role;

commit;
