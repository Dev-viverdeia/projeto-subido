-- A conversa determina leitura; o estado determina de quem é a próxima ação.
alter table public.suporte_atendimentos
  add column ultima_resposta_equipe_em timestamptz,
  add column ultima_mensagem_cliente_em timestamptz,
  add column ultima_mensagem_resumo text,
  add column aguardando_equipe_desde timestamptz;
alter table public.suporte_mensagens
  add column nome_autor text,
  add column canal text not null default 'plataforma' check (canal in ('plataforma','email')),
  add column resultado text check (resultado in ('em_atendimento','aguardando_voce','resolvido'));

update public.suporte_atendimentos a set
  ultima_resposta_equipe_em=(select max(criado_em) from public.suporte_mensagens m where m.atendimento=a.id and m.papel='equipe' and not m.interna),
  ultima_mensagem_cliente_em=(select max(criado_em) from public.suporte_mensagens m where m.atendimento=a.id and m.papel='usuario' and not m.interna),
  ultima_mensagem_resumo=(select left(texto,180) from public.suporte_mensagens m where m.atendimento=a.id and m.papel<>'sistema' and not m.interna order by criado_em desc,id desc limit 1),
  aguardando_equipe_desde=case when status in ('recebido','em_atendimento') then atualizado_em end;
create index suporte_espera on public.suporte_atendimentos(verificado,status,prioridade,aguardando_equipe_desde);

create function private.suporte_resumo_mensagem() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.papel='equipe' then
    select nome into new.nome_autor from public.suporte_agentes where usuario=new.autor;
  end if;
  if not new.interna and new.papel<>'sistema' then
    update public.suporte_atendimentos set
      ultima_resposta_equipe_em=case when new.papel='equipe' then new.criado_em else ultima_resposta_equipe_em end,
      ultima_mensagem_cliente_em=case when new.papel='usuario' then new.criado_em else ultima_mensagem_cliente_em end,
      ultima_mensagem_resumo=left(new.texto,180),
      aguardando_equipe_desde=case when new.papel='usuario' then coalesce(aguardando_equipe_desde,new.criado_em) else aguardando_equipe_desde end
    where id=new.atendimento;
  end if;
  return new;
end; $$;
revoke all on function private.suporte_resumo_mensagem() from public;
create trigger suporte_resumo before insert on public.suporte_mensagens for each row execute function private.suporte_resumo_mensagem();

create table public.suporte_transicoes (
  id bigint generated always as identity primary key,
  atendimento uuid not null references public.suporte_atendimentos(id) on delete cascade,
  anterior text not null,
  atual text not null,
  criado_em timestamptz not null default now()
);
create index suporte_transicoes_caso on public.suporte_transicoes(atendimento,criado_em);
alter table public.suporte_transicoes enable row level security;
revoke all on public.suporte_transicoes from anon,authenticated;
grant select on public.suporte_transicoes to authenticated;
grant all on public.suporte_transicoes to service_role;
create policy suporte_transicoes_equipe on public.suporte_transicoes for select to authenticated using ((select private.suporte_equipe()));
create function private.suporte_estado_transicao() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status is distinct from old.status then
    insert into public.suporte_transicoes(atendimento,anterior,atual) values(new.id,old.status,new.status);
    if new.status in ('aguardando_voce','resolvido') then new.aguardando_equipe_desde=null;
    elsif old.status in ('aguardando_voce','resolvido') then new.aguardando_equipe_desde=now(); end if;
  end if;
  return new;
end; $$;
revoke all on function private.suporte_estado_transicao() from public;
create trigger suporte_transicao before update of status on public.suporte_atendimentos for each row execute function private.suporte_estado_transicao();

-- Novo contrato; o anterior permanece disponível durante o deploy gradual.
create function public.suporte_responder_v2(p_id uuid,p_atendimento uuid,p_texto text,p_interna boolean default false,p_anexos uuid[] default '{}',p_resultado text default 'em_atendimento')
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.suporte_atendimentos; m public.suporte_mensagens; uid uuid:=(select auth.uid()); agente boolean; mid uuid;
begin
  select * into a from public.suporte_atendimentos where id=p_atendimento for update;
  if not found or uid is null or not a.verificado or (a.dono is distinct from uid and not private.suporte_equipe()) or (p_interna and not private.suporte_equipe()) then raise exception 'acesso_negado'; end if;
  agente:=private.suporte_equipe() and a.dono is distinct from uid;
  if p_resultado not in ('em_atendimento','aguardando_voce','resolvido') or (not agente and p_resultado<>'em_atendimento') then raise exception 'estado_invalido'; end if;
  select * into m from public.suporte_mensagens where id=p_id;
  if found then
    if m.atendimento=p_atendimento and m.autor=uid and m.texto=trim(p_texto) and m.interna=p_interna and (m.resultado is not distinct from (case when agente and not p_interna then p_resultado end))
      and coalesce((select array_agg(id order by id) from public.suporte_arquivos where mensagem=p_id),'{}'::uuid[])=coalesce((select array_agg(x order by x) from unnest(p_anexos) x),'{}'::uuid[]) then return m.id; end if;
    raise exception 'conflito';
  end if;
  if (select count(*) from public.suporte_mensagens where atendimento=a.id and autor=uid and criado_em>now()-interval '1 minute')>=12 then raise exception 'limite'; end if;
  insert into public.suporte_mensagens(id,atendimento,autor,papel,interna,texto,resultado)
  values(p_id,a.id,uid,case when agente or p_interna then 'equipe' else 'usuario' end,p_interna,trim(p_texto),case when agente and not p_interna then p_resultado end);
  perform private.suporte_vincular_arquivos(p_id,uid,p_anexos);
  if not p_interna then
    update public.suporte_atendimentos set status=case when agente then p_resultado else 'em_atendimento' end,
      atualizado_em=now(),
      primeira_resposta_em=case when agente then coalesce(primeira_resposta_em,now()) else primeira_resposta_em end,
      reaberturas=reaberturas+case when a.status='resolvido' and (not agente or p_resultado<>'resolvido') then 1 else 0 end,
      resolvido_em=case when agente and p_resultado='resolvido' then coalesce(resolvido_em,now()) end
    where id=a.id;
    perform private.suporte_notificar(a.id,p_id::text,case when agente then 'usuario' else 'equipe' end);
  end if;
  return p_id;
end; $$;
create function public.suporte_marcar_visto(p_id uuid,p_mensagem uuid) returns void language plpgsql security definer set search_path='' as $$
declare a public.suporte_atendimentos; m public.suporte_mensagens; uid uuid:=(select auth.uid());
begin
  select * into a from public.suporte_atendimentos where id=p_id;
  if uid is null or not found or (a.dono is distinct from uid and not private.suporte_equipe()) then raise exception 'acesso_negado'; end if;
  select * into m from public.suporte_mensagens where id=p_mensagem and atendimento=p_id and not interna;
  if not found then return; end if;
  if a.dono=uid and m.papel='equipe' then update public.suporte_atendimentos set lido_usuario_em=greatest(lido_usuario_em,m.criado_em) where id=p_id;
  elsif a.dono is distinct from uid and m.papel='usuario' then update public.suporte_atendimentos set lido_equipe_em=greatest(lido_equipe_em,m.criado_em) where id=p_id; end if;
end; $$;
create function public.suporte_assumir(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare a public.suporte_atendimentos; uid uuid:=(select auth.uid());
begin
  if uid is null or not exists(select 1 from public.suporte_agentes where usuario=uid) then raise exception 'acesso_negado'; end if;
  select * into a from public.suporte_atendimentos where id=p_id and verificado for update;
  if not found then raise exception 'acesso_negado'; end if;
  if a.responsavel is not null and a.responsavel<>uid then raise exception 'ja_atribuido'; end if;
  update public.suporte_atendimentos set responsavel=uid,status=case when status='recebido' then 'em_atendimento' else status end where id=p_id;
end; $$;
revoke all on function public.suporte_responder_v2(uuid,uuid,text,boolean,uuid[],text),public.suporte_marcar_visto(uuid,uuid),public.suporte_assumir(uuid) from public,anon;
grant execute on function public.suporte_responder_v2(uuid,uuid,text,boolean,uuid[],text),public.suporte_marcar_visto(uuid,uuid),public.suporte_assumir(uuid) to authenticated;

create table public.suporte_configuracao (
  id boolean primary key default true check(id),
  horario text not null default '' check(length(horario)<=180),
  aviso text not null default '' check(length(aviso)<=300),
  meta_horas integer not null default 24 check(meta_horas between 1 and 168),
  atualizado_em timestamptz not null default now()
);
insert into public.suporte_configuracao(id) values(true);
alter table public.suporte_configuracao enable row level security;
revoke all on public.suporte_configuracao from anon,authenticated;
grant select on public.suporte_configuracao to anon,authenticated;
grant update on public.suporte_configuracao to authenticated;
grant all on public.suporte_configuracao to service_role;
create policy suporte_config_ler on public.suporte_configuracao for select to anon,authenticated using(true);
create policy suporte_config_admin on public.suporte_configuracao for update to authenticated using((select private.eh_admin())) with check((select private.eh_admin()));

create function public.suporte_indicadores() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.suporte_equipe() then raise exception 'acesso_negado'; end if;
  return (select jsonb_build_object(
    'pedidos',count(*),
    'respondidos',count(primeira_resposta_em),
    'primeira_resposta_horas',round((percentile_cont(0.5) within group (order by extract(epoch from (primeira_resposta_em-criado_em))/3600) filter(where primeira_resposta_em is not null))::numeric,1),
    'resolvidos',count(*) filter(where status='resolvido'),
    'resolucao_horas',round((percentile_cont(0.5) within group (order by extract(epoch from(resolvido_em-criado_em))/3600) filter(where status='resolvido'))::numeric,1),
    'reabertos',count(*) filter(where reaberturas>0),
    'avaliados',count(avaliacao),
    'satisfacao',round(avg(avaliacao),1)
  ) from public.suporte_atendimentos where verificado and criado_em>=now()-interval '30 days');
end; $$;
revoke all on function public.suporte_indicadores() from public,anon;
grant execute on function public.suporte_indicadores() to authenticated;
