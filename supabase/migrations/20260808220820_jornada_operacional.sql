-- =============================================================================
-- JORNADA OPERACIONAL
--
-- O mapa deriva quase tudo de fatos que já existem na plataforma. Esta tabela
-- guarda somente as três escolhas que o sistema não consegue inferir: nicho,
-- primeira oferta e a frase usada para explicar o serviço.
-- =============================================================================

create table public.jornada_perfis (
  dono uuid primary key references auth.users (id) on delete cascade,
  nicho text not null,
  projeto_inicial_id uuid references public.solucoes (id) on delete set null,
  posicionamento text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint jornada_perfis_nicho_tamanho
    check (char_length(btrim(nicho)) between 2 and 100),
  constraint jornada_perfis_posicionamento_tamanho
    check (char_length(btrim(posicionamento)) between 20 and 280)
);

comment on table public.jornada_perfis is
  'Escolhas declaradas pelo profissional para orientar a jornada factual de ativação.';
comment on column public.jornada_perfis.projeto_inicial_id is
  'Primeiro projeto padrão que o profissional decidiu dominar e vender.';

create index jornada_perfis_projeto_fk_idx
  on public.jornada_perfis (projeto_inicial_id)
  where projeto_inicial_id is not null;

create function private.jornada_validar_projeto_publicado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.projeto_inicial_id is not null
    and not exists (
      select 1
      from public.solucoes s
      where s.id = new.projeto_inicial_id
        and s.status = 'publicado'
    )
  then
    raise exception 'projeto_inicial_indisponivel' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke execute on function private.jornada_validar_projeto_publicado() from public;
revoke execute on function private.jornada_validar_projeto_publicado() from authenticated;

create trigger jornada_perfis_validar_projeto
  before insert or update of projeto_inicial_id on public.jornada_perfis
  for each row execute function private.jornada_validar_projeto_publicado();

create trigger jornada_perfis_atualizado_em
  before update on public.jornada_perfis
  for each row execute function private.tocar_atualizado_em();

alter table public.jornada_perfis enable row level security;

create policy "profissional lê seu perfil de jornada"
  on public.jornada_perfis for select to authenticated
  using (dono = (select auth.uid()));

create policy "profissional cria seu perfil de jornada"
  on public.jornada_perfis for insert to authenticated
  with check (dono = (select auth.uid()));

create policy "profissional atualiza seu perfil de jornada"
  on public.jornada_perfis for update to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

revoke all on table public.jornada_perfis from anon;
grant select, insert on table public.jornada_perfis to authenticated;
grant update (nicho, projeto_inicial_id, posicionamento)
  on table public.jornada_perfis to authenticated;
