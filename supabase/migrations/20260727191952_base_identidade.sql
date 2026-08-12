-- =============================================================================
-- BASE DE IDENTIDADE E AUTORIZAÇÃO
--
-- Perfil, papéis e as policies que todo o resto vai herdar. Nada de conteúdo dos
-- pilares aqui — primeiro quem é a pessoa e o que ela pode.
--
-- As quatro decisões desta migration, e o motivo de cada uma:
--
--   1. PAPEL MORA EM TABELA PRÓPRIA, nunca como coluna em `profiles`.
--      Com `profiles.papel`, a policy de leitura de profiles precisaria consultar
--      profiles para saber se quem lê é admin — e o Postgres devolve 42P17,
--      "infinite recursion detected in policy". O erro aparece em produção, no
--      primeiro admin, e o reflexo usual é desligar a RLS.
--
--   2. OS HELPERS VIVEM NO SCHEMA `private`, com SECURITY DEFINER.
--      SECURITY DEFINER faz a função ignorar a RLS da tabela que ela consulta —
--      é o que quebra o ciclo do item 1. O schema `private` não é exposto pelo
--      PostgREST, então essas funções não viram endpoint RPC.
--
--   3. `set search_path = ''` EM TODA FUNÇÃO SECURITY DEFINER.
--      Sem isso, quem chama controla o search_path e pode plantar um
--      `public.user_roles` falso num schema temporário — a função privilegiada
--      passa a ler a tabela do atacante. Com o path vazio, todo nome precisa vir
--      qualificado, o que é chato de escrever e impossível de sequestrar.
--
--   4. `(select auth.uid())` SEMPRE DENTRO DE SUBQUERY.
--      Escrito como `auth.uid() = user_id`, o Postgres chama a função uma vez POR
--      LINHA. Envolto em subquery ele o promove a InitPlan e avalia uma vez por
--      query. Numa tabela de 100 mil linhas a diferença é de duas ordens de
--      grandeza, e não aparece em nenhum teste com dez linhas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Schema dos helpers de policy
-- -----------------------------------------------------------------------------
create schema if not exists private;

comment on schema private is
  'Helpers de RLS. Não exposto pelo PostgREST — nada aqui vira endpoint.';

-- -----------------------------------------------------------------------------
-- Papéis
-- -----------------------------------------------------------------------------
create type public.papel_usuario as enum ('membro', 'mentor', 'admin');

comment on type public.papel_usuario is
  'membro = assinante · mentor = conduz mentorias · admin = opera a plataforma.';

-- -----------------------------------------------------------------------------
-- Perfil
--
-- 1:1 com auth.users. O `on delete cascade` é o que faz a exclusão de conta pelo
-- painel do Supabase levar o perfil junto, em vez de deixar órfão.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  avatar_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- Nome é entrada de usuário e vai aparecer no HUB. Limite no banco, não só no
  -- zod: a Server Action não é o único caminho até esta coluna.
  constraint nome_tamanho check (char_length(nome) <= 80)
);

comment on table public.profiles is
  'Dados públicos do assinante. E-mail NÃO é duplicado aqui — ele vive em auth.users e chega às telas pelos claims do JWT, sem query.';

-- -----------------------------------------------------------------------------
-- Papéis por usuário
--
-- Um usuário pode ter mais de um papel (um mentor também é membro), daí a tabela
-- de associação em vez de uma coluna.
-- -----------------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  papel public.papel_usuario not null,
  criado_em timestamptz not null default now(),

  unique (user_id, papel)
);

comment on table public.user_roles is
  'Autorização por grant explícito. Nunca inferir papel de domínio de e-mail.';

-- Coluna de predicado de policy É indexada. Sem este índice, toda avaliação de
-- policy que consulta papel vira seq scan nesta tabela.
create index user_roles_user_id_idx on public.user_roles (user_id);

-- -----------------------------------------------------------------------------
-- Helpers de policy
-- -----------------------------------------------------------------------------
create function private.tem_papel(_papel public.papel_usuario)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and papel = _papel
  );
$$;

comment on function private.tem_papel is
  'SECURITY DEFINER: ignora a RLS de user_roles de propósito — é o que impede a recursão 42P17 quando uma policy precisa saber o papel de quem consulta.';

create function private.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.tem_papel('admin');
$$;

-- `authenticated` precisa poder EXECUTAR os helpers, senão toda policy que os usa
-- falha por permissão. `usage` no schema não expõe as tabelas — não há nenhuma.
grant usage on schema private to authenticated;
grant execute on function private.tem_papel(public.papel_usuario) to authenticated;
grant execute on function private.eh_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- atualizado_em
-- -----------------------------------------------------------------------------
create function public.tocar_atualizado_em()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger profiles_atualizado_em
  before update on public.profiles
  for each row execute function public.tocar_atualizado_em();

-- -----------------------------------------------------------------------------
-- Provisionamento no cadastro
--
-- Roda dentro da transação do signup. Se esta função lançar, o cadastro inteiro
-- falha com um 500 opaco — daí os dois `on conflict do nothing`: um retry do
-- Supabase sobre o mesmo usuário não pode virar erro de chave duplicada.
-- -----------------------------------------------------------------------------
create function public.provisionar_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    -- `data: { nome }` do signUp() aterrissa em raw_user_meta_data.
    left(coalesce(new.raw_user_meta_data ->> 'nome', ''), 80)
  )
  on conflict (id) do nothing;

  -- Todo mundo nasce membro. Mentor e admin são grant explícito, feito depois.
  insert into public.user_roles (user_id, papel)
  values (new.id, 'membro')
  on conflict (user_id, papel) do nothing;

  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.provisionar_novo_usuario();

-- -----------------------------------------------------------------------------
-- RLS
--
-- Toda policy tem `TO` explícito. Sem ele a policy vale também para `anon`, e uma
-- policy pensada para usuário logado passa a ser avaliada para visitante — o que
-- normalmente não vaza nada só por sorte, porque auth.uid() é null.
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Perfil: cada um lê e edita o seu.
create policy "perfil visível para o dono"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "perfil editável pelo dono"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "perfil visível para admin"
  on public.profiles for select
  to authenticated
  using (private.eh_admin());

-- Sem policy de INSERT e de DELETE em profiles, e isso é intencional: a linha
-- nasce pelo trigger de signup e morre pelo cascade de auth.users. Um insert
-- direto pelo cliente só criaria perfil sem usuário correspondente.

-- Papéis: leitura do próprio, escrita só por admin. Ninguém se promove.
create policy "papéis visíveis para o dono"
  on public.user_roles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "papéis administrados por admin"
  on public.user_roles for all
  to authenticated
  using (private.eh_admin())
  with check (private.eh_admin());
