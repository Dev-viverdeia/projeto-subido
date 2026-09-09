-- Caixa de entrada durável. Só o worker acessa o corpo; a equipe vê a situação.
create table public.suporte_email_recebidos (
  id uuid primary key,
  atendimento uuid references public.suporte_atendimentos(id) on delete cascade,
  mensagem uuid unique references public.suporte_mensagens(id) on delete set null,
  estado text not null default 'pendente' check(estado in ('pendente','processando','processado','revisao','ignorado','falhou')),
  motivo text,
  tentativas integer not null default 0,
  message_id text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index suporte_email_fila on public.suporte_email_recebidos(estado,atualizado_em);
alter table public.suporte_email_recebidos enable row level security;
revoke all on public.suporte_email_recebidos from anon,authenticated;
grant select(id,atendimento,estado,motivo,tentativas,criado_em,atualizado_em) on public.suporte_email_recebidos to authenticated;
grant all on public.suporte_email_recebidos to service_role;
create policy suporte_email_equipe on public.suporte_email_recebidos for select to authenticated using((select private.suporte_equipe()));

-- Recebimentos públicos também podem ter anexos; a permissão continua no atendimento.
alter table public.suporte_arquivos alter column dono drop not null;

create function public.suporte_email_reservar() returns setof public.suporte_email_recebidos language plpgsql security definer set search_path='' as $$
begin
  return query update public.suporte_email_recebidos set estado='processando',tentativas=tentativas+1,atualizado_em=now()
    where id in (select id from public.suporte_email_recebidos where
      (estado='pendente' or (estado in ('falhou','processando') and atualizado_em<now()-interval '3 minutes' and tentativas<5))
      order by criado_em for update skip locked limit 2) returning *;
end; $$;

create function public.suporte_email_incorporar(p_email uuid,p_atendimento uuid,p_remetente text,p_texto text,p_message_id text,p_anexos jsonb default '[]') returns uuid language plpgsql security definer set search_path='' as $$
declare e public.suporte_email_recebidos; a public.suporte_atendimentos; mid uuid; arquivo jsonb;
begin
  select * into e from public.suporte_email_recebidos where id=p_email for update;
  if not found then raise exception 'email_ausente'; end if;
  if e.estado='processado' then return e.mensagem; end if;
  if e.estado<>'processando' then raise exception 'estado_invalido'; end if;
  select * into a from public.suporte_atendimentos where id=p_atendimento and verificado for update;
  if not found or lower(trim(a.email))<>lower(trim(p_remetente)) then raise exception 'remetente_invalido'; end if;
  if jsonb_typeof(p_anexos)<>'array' or jsonb_array_length(p_anexos)>3 then raise exception 'anexos_invalidos'; end if;
  mid:=gen_random_uuid();
  insert into public.suporte_mensagens(id,atendimento,autor,papel,texto,canal) values(mid,a.id,a.dono,'usuario',trim(p_texto),'email');
  for arquivo in select * from jsonb_array_elements(p_anexos) loop
    if arquivo->>'caminho' not like 'email/'||p_email::text||'/%' then raise exception 'anexo_invalido'; end if;
    insert into public.suporte_arquivos(id,dono,mensagem,nome,caminho,mime,bytes)
      values((arquivo->>'id')::uuid,a.dono,mid,arquivo->>'nome',arquivo->>'caminho',arquivo->>'mime',(arquivo->>'bytes')::integer);
  end loop;
  update public.suporte_atendimentos set status='em_atendimento',atualizado_em=now(),resolvido_em=null,reaberturas=reaberturas+case when status='resolvido' then 1 else 0 end where id=a.id;
  update public.suporte_email_recebidos set estado='processado',mensagem=mid,atendimento=a.id,message_id=p_message_id,motivo=null,atualizado_em=now() where id=p_email;
  perform private.suporte_notificar(a.id,mid::text,'equipe');
  return mid;
end; $$;
revoke all on function public.suporte_email_reservar(),public.suporte_email_incorporar(uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.suporte_email_reservar(),public.suporte_email_incorporar(uuid,uuid,text,text,text,jsonb) to service_role;

create function public.suporte_email_novo(p_email uuid,p_remetente text,p_assunto text,p_texto text,p_hash text,p_url text,p_message_id text,p_anexos jsonb default '[]') returns uuid language plpgsql security definer set search_path='' as $$
declare e public.suporte_email_recebidos; mid uuid; arquivo jsonb;
begin
  select * into e from public.suporte_email_recebidos where id=p_email for update;
  if not found then raise exception 'email_ausente'; end if;
  if e.estado='processado' then return e.atendimento; end if;
  if e.estado<>'processando' then raise exception 'estado_invalido'; end if;
  if jsonb_typeof(p_anexos)<>'array' or jsonb_array_length(p_anexos)>3 then raise exception 'anexos_invalidos'; end if;
  perform public.suporte_publico_criar(p_email,p_remetente,p_assunto,p_texto,p_hash,p_url);
  update public.suporte_mensagens set canal='email' where atendimento=p_email returning id into mid;
  for arquivo in select * from jsonb_array_elements(p_anexos) loop
    if arquivo->>'caminho' not like 'email/'||p_email::text||'/%' then raise exception 'anexo_invalido'; end if;
    insert into public.suporte_arquivos(id,mensagem,nome,caminho,mime,bytes) values((arquivo->>'id')::uuid,mid,arquivo->>'nome',arquivo->>'caminho',arquivo->>'mime',(arquivo->>'bytes')::integer);
  end loop;
  update public.suporte_email_recebidos set estado='processado',atendimento=p_email,mensagem=mid,message_id=p_message_id,atualizado_em=now() where id=p_email;
  return p_email;
end; $$;
revoke all on function public.suporte_email_novo(uuid,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.suporte_email_novo(uuid,text,text,text,text,text,text,jsonb) to service_role;
