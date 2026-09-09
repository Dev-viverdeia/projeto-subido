-- Central de suporte: usuários isolados, equipe explícita e mensagens transacionais.
create table public.suporte_agentes (
  usuario uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (length(nome) between 1 and 100),
  notificar boolean not null default true,
  criado_em timestamptz not null default now()
);
create function private.suporte_equipe() returns boolean language sql stable security definer set search_path = '' as $$
  select private.eh_admin() or exists(select 1 from public.suporte_agentes where usuario = (select auth.uid()));
$$;
revoke all on function private.suporte_equipe() from public;
grant execute on function private.suporte_equipe() to authenticated;

create table public.suporte_atendimentos (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  dono uuid references auth.users(id) on delete cascade,
  email text not null check (length(email) between 3 and 254),
  assunto text not null check (length(assunto) between 3 and 120),
  categoria text not null check (categoria in ('conta','vendas','reunioes','projetos','ia','outros')),
  status text not null default 'recebido' check (status in ('recebido','em_atendimento','aguardando_voce','resolvido')),
  prioridade text not null default 'normal' check (prioridade in ('normal','alta')),
  responsavel uuid references public.suporte_agentes(usuario) on delete set null,
  pagina text check (pagina is null or (left(pagina,1) = '/' and length(pagina) <= 180 and pagina !~ '[?#]')),
  verificado boolean not null default true,
  acesso_hash text,
  acesso_expira_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primeira_resposta_em timestamptz,
  resolvido_em timestamptz,
  lido_usuario_em timestamptz,
  lido_equipe_em timestamptz,
  reaberturas integer not null default 0,
  avaliacao integer check (avaliacao between 1 and 5),
  check (dono is not null or (acesso_hash is not null and acesso_expira_em is not null))
);
create index suporte_atendimentos_dono on public.suporte_atendimentos(dono, atualizado_em desc);
create index suporte_atendimentos_fila on public.suporte_atendimentos(verificado, status, atualizado_em desc);
create index suporte_atendimentos_responsavel on public.suporte_atendimentos(responsavel);
create table public.suporte_mensagens (
  id uuid primary key default gen_random_uuid(),
  atendimento uuid not null references public.suporte_atendimentos(id) on delete cascade,
  autor uuid references auth.users(id) on delete set null,
  papel text not null check (papel in ('usuario','equipe','sistema')),
  interna boolean not null default false,
  texto text not null check (length(texto) between 1 and 6000),
  criado_em timestamptz not null default now()
);
create index suporte_mensagens_atendimento on public.suporte_mensagens(atendimento, criado_em);
create table public.suporte_arquivos (
  id uuid primary key,
  dono uuid not null references auth.users(id) on delete cascade,
  mensagem uuid references public.suporte_mensagens(id) on delete cascade,
  nome text not null check (length(nome) between 1 and 160),
  caminho text not null unique,
  mime text not null check (mime in ('image/png','image/jpeg','image/webp','application/pdf')),
  bytes integer not null check (bytes between 1 and 3145728),
  criado_em timestamptz not null default now()
);
create index suporte_arquivos_dono on public.suporte_arquivos(dono);
create index suporte_arquivos_mensagem on public.suporte_arquivos(mensagem);
create table public.suporte_artigos (
  slug text primary key check (slug ~ '^[a-z0-9-]{3,80}$'),
  titulo text not null check (length(titulo) between 3 and 120),
  resumo text not null check (length(resumo) between 3 and 800),
  categoria text not null check (categoria in ('conta','vendas','reunioes','projetos','ia','outros')),
  passos jsonb not null default '[]' check (jsonb_typeof(passos) = 'array' and jsonb_array_length(passos) <= 8),
  dica text not null default '' check (length(dica) <= 1200),
  destino text not null default '/inicio',
  tags text not null default '' check (length(tags) <= 500),
  publicado boolean not null default false,
  atualizado_em timestamptz not null default now()
);
create table public.suporte_avaliacoes_artigos (
  artigo text references public.suporte_artigos(slug) on delete cascade,
  dono uuid references auth.users(id) on delete cascade,
  util boolean not null,
  primary key(artigo,dono)
);
create table public.suporte_limites (
  chave text primary key,
  inicio timestamptz not null,
  quantidade integer not null
);
create table public.suporte_notificacoes (
  id uuid primary key default gen_random_uuid(),
  atendimento uuid not null references public.suporte_atendimentos(id) on delete cascade,
  evento text not null,
  destinatario text not null,
  tipo text not null check (tipo in ('usuario','equipe','verificar')),
  acesso_url text,
  estado text not null default 'pendente' check (estado in ('pendente','enviando','enviado','entregue','falhou','devolvido','expirado')),
  tentativas integer not null default 0,
  provider_id text,
  erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(evento,destinatario)
);
create index suporte_notificacoes_fila on public.suporte_notificacoes(estado, criado_em);
create index suporte_notificacoes_atendimento on public.suporte_notificacoes(atendimento);
create index suporte_notificacoes_provider on public.suporte_notificacoes(provider_id);
grant all on public.suporte_agentes,public.suporte_atendimentos,public.suporte_mensagens,public.suporte_arquivos,
  public.suporte_artigos,public.suporte_avaliacoes_artigos,public.suporte_limites,public.suporte_notificacoes to service_role;
grant usage on sequence public.suporte_atendimentos_numero_seq to service_role;

alter table public.suporte_agentes enable row level security;
alter table public.suporte_atendimentos enable row level security;
alter table public.suporte_mensagens enable row level security;
alter table public.suporte_arquivos enable row level security;
alter table public.suporte_artigos enable row level security;
alter table public.suporte_avaliacoes_artigos enable row level security;
alter table public.suporte_limites enable row level security;
alter table public.suporte_notificacoes enable row level security;
-- DML autenticado apenas pelas funções abaixo; service_role é usado nos workers e acesso público por token.
revoke all on public.suporte_agentes, public.suporte_atendimentos, public.suporte_mensagens,
  public.suporte_arquivos, public.suporte_artigos, public.suporte_avaliacoes_artigos,
  public.suporte_limites, public.suporte_notificacoes from anon, authenticated;
grant select on public.suporte_agentes, public.suporte_atendimentos, public.suporte_mensagens,
  public.suporte_arquivos, public.suporte_artigos, public.suporte_avaliacoes_artigos,
  public.suporte_notificacoes to authenticated;
grant select on public.suporte_artigos to anon;
create policy suporte_agentes_ler on public.suporte_agentes for select to authenticated using ((select private.suporte_equipe()));
create policy suporte_casos_ler on public.suporte_atendimentos for select to authenticated
  using (dono = (select auth.uid()) or ((select private.suporte_equipe()) and verificado));
create policy suporte_mensagens_ler on public.suporte_mensagens for select to authenticated
  using (exists(select 1 from public.suporte_atendimentos a where a.id = atendimento
    and (((select private.suporte_equipe()) and a.verificado) or (a.dono = (select auth.uid()) and not interna))));
create policy suporte_arquivos_ler on public.suporte_arquivos for select to authenticated
  using ((dono = (select auth.uid()) and mensagem is null) or exists(select 1 from public.suporte_mensagens m where m.id = mensagem));
create policy suporte_artigos_ler on public.suporte_artigos for select to anon, authenticated
  using (publicado or (select private.suporte_equipe()));
-- Anon precisa avaliar o predicado sem acesso a nenhum dado de equipe.
grant execute on function private.suporte_equipe() to anon;
create policy suporte_feedback_ler on public.suporte_avaliacoes_artigos for select to authenticated
  using (dono = (select auth.uid()) or (select private.suporte_equipe()));
create policy suporte_notificacoes_ler on public.suporte_notificacoes for select to authenticated
  using ((select private.suporte_equipe()));

create function public.suporte_limitar(p_chave text, p_limite integer, p_segundos integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into public.suporte_limites as l(chave,inicio,quantidade) values (p_chave,now(),1)
  on conflict(chave) do update set
    inicio = case when l.inicio < now() - make_interval(secs => p_segundos) then now() else l.inicio end,
    quantidade = case when l.inicio < now() - make_interval(secs => p_segundos) then 1 else l.quantidade + 1 end
  returning quantidade into n;
  return n <= p_limite;
end; $$;
revoke all on function public.suporte_limitar(text,integer,integer) from public,anon,authenticated;
grant execute on function public.suporte_limitar(text,integer,integer) to service_role;

create function private.suporte_notificar(p_caso uuid,p_evento text,p_tipo text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.suporte_atendimentos;
begin
  select * into a from public.suporte_atendimentos where id = p_caso;
  if not a.verificado then return; end if;
  if p_tipo = 'usuario' then
    insert into public.suporte_notificacoes(atendimento,evento,destinatario,tipo)
    values(a.id,p_evento,a.email,'usuario') on conflict do nothing;
  else
    insert into public.suporte_notificacoes(atendimento,evento,destinatario,tipo)
    select a.id,p_evento,u.email,'equipe' from public.suporte_agentes s join auth.users u on u.id = s.usuario
    where s.notificar and u.email_confirmed_at is not null and (a.responsavel is null or s.usuario = a.responsavel)
    on conflict do nothing;
  end if;
end; $$;
revoke all on function private.suporte_notificar(uuid,text,text) from public,anon,authenticated;

create function private.suporte_vincular_arquivos(p_mensagem uuid,p_dono uuid,p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if coalesce(cardinality(p_ids),0) > 3 then raise exception 'anexos_invalidos'; end if;
  update public.suporte_arquivos set mensagem = p_mensagem where id = any(p_ids) and dono = p_dono and mensagem is null;
  get diagnostics n = row_count;
  if n <> coalesce(cardinality(p_ids),0) then raise exception 'anexos_invalidos'; end if;
end; $$;
revoke all on function private.suporte_vincular_arquivos(uuid,uuid,uuid[]) from public,anon,authenticated;

create function public.suporte_criar(p_id uuid,p_assunto text,p_categoria text,p_texto text,p_pagina text,p_anexos uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); mid uuid; email_usuario text; existente public.suporte_atendimentos;
begin
  if uid is null then raise exception 'acesso_negado'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  select * into existente from public.suporte_atendimentos where id = p_id;
  if found then
    if existente.dono = uid and existente.assunto = trim(p_assunto) then return existente.id; end if;
    raise exception 'conflito';
  end if;
  if (select count(*) from public.suporte_atendimentos where dono = uid and criado_em > now()-interval '1 day') >= 10 then raise exception 'limite'; end if;
  select email into email_usuario from auth.users where id = uid and email_confirmed_at is not null;
  if email_usuario is null then raise exception 'confirme_email'; end if;
  insert into public.suporte_atendimentos(id,dono,email,assunto,categoria,pagina)
  values(p_id,uid,email_usuario,trim(p_assunto),p_categoria,p_pagina);
  insert into public.suporte_mensagens(atendimento,autor,papel,texto) values(p_id,uid,'usuario',trim(p_texto)) returning id into mid;
  perform private.suporte_vincular_arquivos(mid,uid,p_anexos);
  perform private.suporte_notificar(p_id,mid::text,'equipe');
  perform private.suporte_notificar(p_id,mid::text,'usuario');
  return p_id;
end; $$;

create function public.suporte_responder(p_id uuid,p_atendimento uuid,p_texto text,p_interna boolean default false,p_anexos uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); equipe boolean := private.suporte_equipe(); a public.suporte_atendimentos; m public.suporte_mensagens;
begin
  if uid is null then raise exception 'acesso_negado'; end if;
  select * into a from public.suporte_atendimentos where id = p_atendimento for update;
  if not found or not a.verificado or (a.dono is distinct from uid and not equipe) or (p_interna and not equipe) then raise exception 'acesso_negado'; end if;
  select * into m from public.suporte_mensagens where id = p_id;
  if found then
    if m.atendimento = a.id and m.autor = uid and m.texto = trim(p_texto) and m.interna = p_interna then return m.id; end if;
    raise exception 'conflito';
  end if;
  if (select count(*) from public.suporte_mensagens where atendimento = a.id and autor = uid and criado_em > now()-interval '1 minute') >= 12 then raise exception 'limite'; end if;
  insert into public.suporte_mensagens(id,atendimento,autor,papel,interna,texto)
  values(p_id,a.id,uid,case when equipe and (a.dono is distinct from uid or p_interna) then 'equipe' else 'usuario' end,p_interna,trim(p_texto));
  perform private.suporte_vincular_arquivos(p_id,uid,p_anexos);
  if not p_interna then
    update public.suporte_atendimentos set atualizado_em = now(),
      status = case when equipe and a.dono is distinct from uid then 'aguardando_voce' else 'em_atendimento' end,
      primeira_resposta_em = case when equipe and a.dono is distinct from uid then coalesce(primeira_resposta_em,now()) else primeira_resposta_em end,
      reaberturas = reaberturas + case when status = 'resolvido' then 1 else 0 end, resolvido_em = null
      where id = a.id;
    perform private.suporte_notificar(a.id,p_id::text,case when equipe and a.dono is distinct from uid then 'usuario' else 'equipe' end);
  end if;
  return p_id;
end; $$;

create function public.suporte_atualizar(p_id uuid,p_status text default null,p_responsavel uuid default null,p_atribuir boolean default false,p_prioridade text default null,p_avaliacao integer default null)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); equipe boolean := private.suporte_equipe(); a public.suporte_atendimentos; mid uuid;
begin
  if uid is null then raise exception 'acesso_negado'; end if;
  select * into a from public.suporte_atendimentos where id = p_id for update;
  if not found or not a.verificado or (a.dono is distinct from uid and not equipe) then raise exception 'acesso_negado'; end if;
  if not equipe and (p_atribuir or p_prioridade is not null or (p_status is not null and p_status not in ('resolvido','em_atendimento'))) then raise exception 'acesso_negado'; end if;
  if p_avaliacao is not null and (a.dono is distinct from uid or a.status <> 'resolvido') then raise exception 'acesso_negado'; end if;
  update public.suporte_atendimentos set status = coalesce(p_status,status),
    responsavel = case when p_atribuir then p_responsavel else responsavel end,
    prioridade = coalesce(p_prioridade,prioridade), avaliacao = coalesce(p_avaliacao,avaliacao),
    resolvido_em = case when p_status = 'resolvido' then coalesce(resolvido_em,now()) when p_status is not null then null else resolvido_em end,
    reaberturas = reaberturas + case when a.status = 'resolvido' and p_status = 'em_atendimento' then 1 else 0 end,
    atualizado_em = case when p_status is not null and p_status <> a.status then now() else atualizado_em end
    where id = a.id;
  if p_status is not null and p_status <> a.status then
    insert into public.suporte_mensagens(atendimento,autor,papel,texto)
    values(a.id,uid,'sistema',case p_status when 'resolvido' then 'Atendimento resolvido. Você pode reabrir se precisar.' when 'em_atendimento' then 'Atendimento em andamento.' when 'aguardando_voce' then 'A equipe aguarda sua resposta.' else 'Atendimento recebido.' end) returning id into mid;
    perform private.suporte_notificar(a.id,mid::text,case when equipe and a.dono is distinct from uid then 'usuario' else 'equipe' end);
  end if;
end; $$;

create function public.suporte_marcar_lido(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.suporte_atendimentos set
    lido_usuario_em = case when dono = (select auth.uid()) then now() else lido_usuario_em end,
    lido_equipe_em = case when private.suporte_equipe() and dono is distinct from (select auth.uid()) then now() else lido_equipe_em end
  where id = p_id and (dono = (select auth.uid()) or (private.suporte_equipe() and verificado));
end; $$;
create function public.suporte_avaliar_artigo(p_slug text,p_util boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists(select 1 from public.suporte_artigos where slug = p_slug and publicado) then raise exception 'acesso_negado'; end if;
  insert into public.suporte_avaliacoes_artigos(artigo,dono,util) values(p_slug,(select auth.uid()),p_util)
  on conflict(artigo,dono) do update set util = excluded.util;
end; $$;

revoke all on function public.suporte_criar(uuid,text,text,text,text,uuid[]), public.suporte_responder(uuid,uuid,text,boolean,uuid[]),
  public.suporte_atualizar(uuid,text,uuid,boolean,text,integer), public.suporte_marcar_lido(uuid), public.suporte_avaliar_artigo(text,boolean) from public,anon;
grant execute on function public.suporte_criar(uuid,text,text,text,text,uuid[]), public.suporte_responder(uuid,uuid,text,boolean,uuid[]),
  public.suporte_atualizar(uuid,text,uuid,boolean,text,integer), public.suporte_marcar_lido(uuid), public.suporte_avaliar_artigo(text,boolean) to authenticated;

-- Publicação e equipe: somente administradores, por RLS, sem service role no formulário.
grant insert,update,delete on public.suporte_artigos,public.suporte_agentes to authenticated;
create policy suporte_artigos_escrever on public.suporte_artigos for all to authenticated using ((select private.eh_admin())) with check ((select private.eh_admin()));
create policy suporte_agentes_escrever on public.suporte_agentes for all to authenticated using ((select private.eh_admin())) with check ((select private.eh_admin()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('suporte-privado','suporte-privado',false,3145728,array['image/png','image/jpeg','image/webp','application/pdf']);
-- Sem policies de storage para anon/authenticated: os endpoints validam a sessão e a linha do arquivo antes de ler/gravar.

create function public.suporte_publico_criar(p_id uuid,p_email text,p_assunto text,p_texto text,p_hash text,p_url text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.suporte_atendimentos(id,email,assunto,categoria,verificado,acesso_hash,acesso_expira_em)
  values(p_id,lower(trim(p_email)),p_assunto,'conta',false,p_hash,now()+interval '14 days');
  insert into public.suporte_mensagens(atendimento,papel,texto) values(p_id,'usuario',p_texto);
  insert into public.suporte_notificacoes(atendimento,evento,destinatario,tipo,acesso_url)
  values(p_id,p_id::text,lower(trim(p_email)),'verificar',p_url);
end; $$;
create function public.suporte_publico_confirmar(p_id uuid,p_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare a public.suporte_atendimentos;
begin
  select * into a from public.suporte_atendimentos where id=p_id and dono is null and acesso_hash=p_hash and acesso_expira_em>now() for update;
  if not found then return false; end if;
  if not a.verificado then
    update public.suporte_atendimentos set verificado=true where id=a.id;
    perform private.suporte_notificar(a.id,'confirmado:'||a.id::text,'equipe');
  end if;
  return true;
end; $$;
create function public.suporte_publico_responder(p_id uuid,p_hash text,p_mensagem uuid,p_texto text,p_status text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.suporte_atendimentos; m public.suporte_mensagens;
begin
  select * into a from public.suporte_atendimentos where id=p_id and dono is null and verificado and acesso_hash=p_hash and acesso_expira_em>now() for update;
  if not found then raise exception 'acesso_negado'; end if;
  select * into m from public.suporte_mensagens where id=p_mensagem;
  if found then
    if m.atendimento=a.id and m.papel='usuario' and m.texto=p_texto then return; end if;
    raise exception 'conflito';
  end if;
  if p_status is not null and p_status not in ('resolvido','em_atendimento') then raise exception 'estado_invalido'; end if;
  if (select count(*) from public.suporte_mensagens where atendimento=a.id and papel='usuario' and criado_em>now()-interval '1 minute') >= 10 then raise exception 'limite'; end if;
  insert into public.suporte_mensagens(id,atendimento,papel,texto) values(p_mensagem,a.id,'usuario',p_texto);
  update public.suporte_atendimentos set status=coalesce(p_status,'em_atendimento'),atualizado_em=now(),
    resolvido_em=case when p_status='resolvido' then now() else null end,
    reaberturas=reaberturas+case when a.status='resolvido' and p_status is distinct from 'resolvido' then 1 else 0 end where id=a.id;
  perform private.suporte_notificar(a.id,p_mensagem::text,'equipe');
end; $$;
create function public.suporte_notificacoes_reservar() returns setof public.suporte_notificacoes
language plpgsql security definer set search_path = '' as $$
begin
  -- Nunca repetir além da janela de idempotência do provedor.
  update public.suporte_notificacoes set estado='expirado',erro='Confira o recebimento antes de reenviar.'
  where estado in ('pendente','falhou','enviando') and criado_em < now()-interval '23 hours';
  return query
  update public.suporte_notificacoes set estado='enviando',tentativas=tentativas+1,atualizado_em=now()
  where id in (select id from public.suporte_notificacoes where
    ((estado in ('pendente','falhou') and atualizado_em < now()-interval '30 seconds') or
    (estado='enviando' and atualizado_em < now()-interval '5 minutes')) and tentativas<5
    order by criado_em for update skip locked limit 20) returning *;
end; $$;
revoke all on function public.suporte_publico_criar(uuid,text,text,text,text,text), public.suporte_publico_confirmar(uuid,text),
  public.suporte_publico_responder(uuid,text,uuid,text,text),public.suporte_notificacoes_reservar() from public,anon,authenticated;
grant execute on function public.suporte_publico_criar(uuid,text,text,text,text,text),public.suporte_publico_confirmar(uuid,text),
  public.suporte_publico_responder(uuid,text,uuid,text,text),public.suporte_notificacoes_reservar() to service_role;
