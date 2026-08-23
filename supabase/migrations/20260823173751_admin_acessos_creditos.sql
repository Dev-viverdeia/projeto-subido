-- =============================================================================
-- ADMINISTRACAO DE ACESSOS E CREDITOS
--
-- A tabela abaixo e um indice administrativo pesquisavel. A fonte de verdade
-- do plano continua sendo auth.users.raw_app_meta_data; os gatilhos apenas
-- espelham email, nome, plano e ultimo acesso para que a administracao nao
-- precise varrer a API de Auth inteira a cada busca.
-- =============================================================================

begin;

create table public.admin_contas (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nome text,
  plano text not null default 'pro',
  ultimo_acesso_em timestamptz,
  criado_em timestamptz not null,
  atualizado_em timestamptz not null default now(),

  constraint admin_contas_plano_valido
    check (plano in ('starter', 'pro', 'enterprise')),
  constraint admin_contas_email_tamanho
    check (email is null or char_length(email) <= 320),
  constraint admin_contas_nome_tamanho
    check (nome is null or char_length(nome) <= 160)
);

comment on table public.admin_contas is
  'Indice privado para localizar contas e administrar plano e creditos. A fonte do plano permanece em auth.users.app_metadata.';

create index admin_contas_email_idx
  on public.admin_contas (lower(email) text_pattern_ops)
  where email is not null;
create index admin_contas_nome_idx
  on public.admin_contas (lower(nome) text_pattern_ops)
  where nome is not null;
create index admin_contas_criado_idx
  on public.admin_contas (criado_em desc);

create table public.admin_acessos_eventos (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id) on delete set null,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  plano_anterior text,
  plano_novo text,
  pacote_id text,
  creditos integer,
  saldo_apos integer,
  detalhes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),

  constraint admin_acessos_eventos_tipo_valido
    check (tipo in ('plano_alterado', 'pacote_concedido')),
  constraint admin_acessos_eventos_planos_validos
    check (
      (plano_anterior is null or plano_anterior in ('starter', 'pro', 'enterprise'))
      and (plano_novo is null or plano_novo in ('starter', 'pro', 'enterprise'))
    ),
  constraint admin_acessos_eventos_creditos_validos
    check (creditos is null or creditos between 1 and 100000),
  constraint admin_acessos_eventos_saldo_valido
    check (saldo_apos is null or saldo_apos >= 0)
);

comment on table public.admin_acessos_eventos is
  'Historico imutavel de mudancas de plano e pacotes concedidos pela administracao.';

create index admin_acessos_eventos_usuario_idx
  on public.admin_acessos_eventos (usuario_id, criado_em desc);

alter table public.admin_contas enable row level security;
alter table public.admin_acessos_eventos enable row level security;

revoke all on public.admin_contas from public, anon, authenticated;
revoke all on public.admin_acessos_eventos from public, anon, authenticated;
grant select, insert, update, delete on public.admin_contas to service_role;
grant select, insert, update, delete on public.admin_acessos_eventos to service_role;

create or replace function private.sincronizar_admin_conta_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plano text := coalesce(new.raw_app_meta_data ->> 'plano_subido', 'pro');
  v_nome text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '')
  );
begin
  if v_plano not in ('starter', 'pro', 'enterprise') then
    v_plano := 'pro';
  end if;

  insert into public.admin_contas (
    usuario_id,
    email,
    nome,
    plano,
    ultimo_acesso_em,
    criado_em,
    atualizado_em
  ) values (
    new.id,
    lower(new.email),
    v_nome,
    v_plano,
    new.last_sign_in_at,
    new.created_at,
    now()
  )
  on conflict (usuario_id) do update set
    email = excluded.email,
    nome = coalesce(excluded.nome, public.admin_contas.nome),
    plano = excluded.plano,
    ultimo_acesso_em = excluded.ultimo_acesso_em,
    atualizado_em = now();

  return new;
end;
$$;

comment on function private.sincronizar_admin_conta_auth() is
  'Espelha campos administrativos de auth.users sem expor o schema Auth.';

revoke execute on function private.sincronizar_admin_conta_auth()
  from public, anon, authenticated;

drop trigger if exists auth_usuario_sincronizar_admin_conta on auth.users;
create trigger auth_usuario_sincronizar_admin_conta
  after insert or update of email, raw_user_meta_data, raw_app_meta_data, last_sign_in_at
  on auth.users
  for each row
  execute function private.sincronizar_admin_conta_auth();

create or replace function private.sincronizar_admin_conta_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.admin_contas
  set nome = nullif(btrim(new.nome), ''), atualizado_em = now()
  where usuario_id = new.id;
  return new;
end;
$$;

revoke execute on function private.sincronizar_admin_conta_perfil()
  from public, anon, authenticated;

drop trigger if exists perfil_sincronizar_admin_conta on public.profiles;
create trigger perfil_sincronizar_admin_conta
  after insert or update of nome on public.profiles
  for each row
  execute function private.sincronizar_admin_conta_perfil();

insert into public.admin_contas (
  usuario_id,
  email,
  nome,
  plano,
  ultimo_acesso_em,
  criado_em,
  atualizado_em
)
select
  usuario.id,
  lower(usuario.email),
  coalesce(
    nullif(btrim(perfil.nome), ''),
    nullif(btrim(usuario.raw_user_meta_data ->> 'nome'), ''),
    nullif(btrim(usuario.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(usuario.raw_user_meta_data ->> 'full_name'), '')
  ),
  case
    when usuario.raw_app_meta_data ->> 'plano_subido' in ('starter', 'pro', 'enterprise')
      then usuario.raw_app_meta_data ->> 'plano_subido'
    else 'pro'
  end,
  usuario.last_sign_in_at,
  usuario.created_at,
  now()
from auth.users usuario
left join public.profiles perfil on perfil.id = usuario.id
on conflict (usuario_id) do update set
  email = excluded.email,
  nome = coalesce(excluded.nome, public.admin_contas.nome),
  plano = excluded.plano,
  ultimo_acesso_em = excluded.ultimo_acesso_em,
  atualizado_em = now();

create or replace function public.admin_sistema_listar_contas(
  p_busca text default null,
  p_limite integer default 30,
  p_offset integer default 0
)
returns table (
  usuario_id uuid,
  email text,
  nome text,
  plano text,
  saldo integer,
  ultimo_acesso_em timestamptz,
  criado_em timestamptz,
  total bigint
)
language sql
security invoker
set search_path = ''
stable
as $$
  select
    conta.usuario_id,
    conta.email,
    conta.nome,
    conta.plano,
    coalesce(carteira.saldo, 30) as saldo,
    conta.ultimo_acesso_em,
    conta.criado_em,
    count(*) over () as total
  from public.admin_contas conta
  left join public.prospeccao_carteiras carteira
    on carteira.dono = conta.usuario_id
  where nullif(btrim(coalesce(p_busca, '')), '') is null
    or lower(coalesce(conta.email, '')) like '%' || lower(btrim(p_busca)) || '%'
    or lower(coalesce(conta.nome, '')) like '%' || lower(btrim(p_busca)) || '%'
  order by conta.criado_em desc, conta.usuario_id
  limit least(greatest(coalesce(p_limite, 30), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.admin_sistema_listar_contas(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.admin_sistema_listar_contas(text, integer, integer)
  to service_role;

create or replace function public.admin_sistema_conceder_pacote(
  p_admin uuid,
  p_usuario uuid,
  p_pacote text,
  p_referencia text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_creditos integer;
  v_nome text;
  v_saldo integer;
begin
  if not exists (
    select 1
    from public.user_roles
    where user_id = p_admin and papel = 'admin'
  ) then
    raise exception 'admin_necessario' using errcode = '42501';
  end if;

  select creditos, nome into v_creditos, v_nome
  from (
    values
      ('essencial'::text, 50, 'Essencial'::text),
      ('crescimento'::text, 150, 'Crescimento'::text),
      ('escala'::text, 500, 'Escala'::text)
  ) as pacote(id, creditos, nome)
  where id = p_pacote;

  if v_creditos is null or coalesce(btrim(p_referencia), '') = '' then
    raise exception 'pacote_invalido' using errcode = '22023';
  end if;

  if not exists (select 1 from public.admin_contas where usuario_id = p_usuario) then
    raise exception 'usuario_nao_encontrado' using errcode = 'P0002';
  end if;

  v_saldo := public.creditos_sistema_conceder(
    p_usuario,
    v_creditos,
    'pacote',
    p_referencia,
    'Pacote ' || v_nome || ' concedido pela administracao'
  );

  insert into public.admin_acessos_eventos (
    admin_id,
    usuario_id,
    tipo,
    pacote_id,
    creditos,
    saldo_apos,
    detalhes
  ) values (
    p_admin,
    p_usuario,
    'pacote_concedido',
    p_pacote,
    v_creditos,
    v_saldo,
    jsonb_build_object('referencia', p_referencia)
  );

  return v_saldo;
end;
$$;

revoke execute on function public.admin_sistema_conceder_pacote(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_sistema_conceder_pacote(uuid, uuid, text, text)
  to service_role;

comment on function public.admin_sistema_listar_contas(text, integer, integer) is
  'Busca paginada de contas para a aplicacao administrativa. Uso exclusivo do servidor.';
comment on function public.admin_sistema_conceder_pacote(uuid, uuid, text, text) is
  'Concede um pacote fixo e registra o evento na mesma transacao. Uso exclusivo do servidor.';

commit;
