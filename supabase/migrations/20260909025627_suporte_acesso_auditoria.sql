create function public.suporte_publico_renovar(p_id uuid,p_email text,p_hash text,p_url text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.suporte_atendimentos set acesso_hash=p_hash,acesso_expira_em=now()+interval '14 days'
  where id=p_id and dono is null and email=p_email;
  if found then
    insert into public.suporte_notificacoes(atendimento,evento,destinatario,tipo,acesso_url)
    values(p_id,gen_random_uuid()::text,p_email,'verificar',p_url);
  end if;
end; $$;
revoke all on function public.suporte_publico_renovar(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.suporte_publico_renovar(uuid,text,text,text) to service_role;

create table public.suporte_eventos (
  id bigint generated always as identity primary key,
  atendimento uuid not null references public.suporte_atendimentos(id) on delete cascade,
  autor uuid references auth.users(id) on delete set null,
  tipo text not null,
  antes jsonb,
  depois jsonb,
  criado_em timestamptz not null default now()
);
create index suporte_eventos_atendimento on public.suporte_eventos(atendimento,criado_em);
alter table public.suporte_eventos enable row level security;
revoke all on public.suporte_eventos from anon,authenticated;
grant select on public.suporte_eventos to authenticated;
grant all on public.suporte_eventos to service_role;
create policy suporte_eventos_equipe on public.suporte_eventos for select to authenticated using ((select private.suporte_equipe()));
create function private.suporte_auditar() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (old.status,old.responsavel,old.prioridade) is distinct from (new.status,new.responsavel,new.prioridade) then
    insert into public.suporte_eventos(atendimento,autor,tipo,antes,depois) values(new.id,(select auth.uid()),'atendimento_atualizado',
      jsonb_build_object('status',old.status,'responsavel',old.responsavel,'prioridade',old.prioridade),
      jsonb_build_object('status',new.status,'responsavel',new.responsavel,'prioridade',new.prioridade));
  end if;
  return new;
end; $$;
revoke all on function private.suporte_auditar() from public,anon,authenticated;
create trigger suporte_auditoria after update on public.suporte_atendimentos for each row execute function private.suporte_auditar();

create table public.suporte_ia_uso (
  id uuid primary key default gen_random_uuid(),
  tokens integer not null check (tokens>=0),
  modelo text not null,
  criado_em timestamptz not null default now()
);
alter table public.suporte_ia_uso enable row level security;
revoke all on public.suporte_ia_uso from anon,authenticated;
grant select on public.suporte_ia_uso to authenticated;
grant all on public.suporte_ia_uso to service_role;
create policy suporte_ia_custos on public.suporte_ia_uso for select to authenticated using ((select private.eh_admin()));
-- Contagem operacional sem armazenar perguntas, documentos ou histórico do visitante.

-- Duplicação só retorna o recibo quando o conteúdo original é equivalente.
create or replace function public.suporte_criar(p_id uuid,p_assunto text,p_categoria text,p_texto text,p_pagina text,p_anexos uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); mid uuid; email_usuario text; existente public.suporte_atendimentos;
begin
  if uid is null then raise exception 'acesso_negado'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  select * into existente from public.suporte_atendimentos where id=p_id;
  if found then
    if existente.dono=uid and existente.assunto=trim(p_assunto) and existente.categoria=p_categoria
       and existente.pagina is not distinct from p_pagina and exists(select 1 from public.suporte_mensagens where atendimento=p_id and autor=uid and texto=trim(p_texto))
    then return existente.id; end if;
    raise exception 'conflito';
  end if;
  if (select count(*) from public.suporte_atendimentos where dono=uid and criado_em>now()-interval '1 day')>=10 then raise exception 'limite'; end if;
  select email into email_usuario from auth.users where id=uid and email_confirmed_at is not null;
  if email_usuario is null then raise exception 'confirme_email'; end if;
  insert into public.suporte_atendimentos(id,dono,email,assunto,categoria,pagina) values(p_id,uid,email_usuario,trim(p_assunto),p_categoria,p_pagina);
  insert into public.suporte_mensagens(atendimento,autor,papel,texto) values(p_id,uid,'usuario',trim(p_texto)) returning id into mid;
  perform private.suporte_vincular_arquivos(mid,uid,p_anexos);
  perform private.suporte_notificar(p_id,mid::text,'equipe');
  perform private.suporte_notificar(p_id,mid::text,'usuario');
  return p_id;
end; $$;
