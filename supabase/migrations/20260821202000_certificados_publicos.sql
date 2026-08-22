-- =============================================================================
-- CERTIFICADOS PUBLICOS · REGISTRO VERIFICAVEL
-- =============================================================================

begin;

create table public.certificados_emitidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 24),
  dono uuid not null references auth.users (id) on delete cascade,
  origem text not null check (origem in ('formacao', 'solucao')),
  slug text not null,
  titulo text not null,
  nome text not null,
  concluido_em timestamptz not null,
  emitido_em timestamptz not null default now(),
  unique (codigo),
  unique (dono, origem, slug),
  constraint certificados_titulo_valido check (char_length(titulo) between 3 and 180),
  constraint certificados_nome_valido check (char_length(nome) between 2 and 180)
);

create index certificados_emitidos_dono_idx
  on public.certificados_emitidos (dono, emitido_em desc);

alter table public.certificados_emitidos enable row level security;

create policy "certificado pertence ao usuario"
  on public.certificados_emitidos for select to authenticated
  using (dono = (select auth.uid()));

grant select on public.certificados_emitidos to authenticated;

create function public.certificado_publico(p_codigo text)
returns table (
  codigo text,
  origem text,
  slug text,
  titulo text,
  nome text,
  concluido_em timestamptz,
  emitido_em timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.codigo,
    c.origem,
    c.slug,
    c.titulo,
    c.nome,
    c.concluido_em,
    c.emitido_em
  from public.certificados_emitidos c
  where c.codigo = p_codigo
  limit 1;
$$;

revoke execute on function public.certificado_publico(text) from public;
grant execute on function public.certificado_publico(text) to anon, authenticated;

comment on table public.certificados_emitidos is
  'Registro imutavel e compartilhavel de conclusoes verificadas pelo servidor.';

commit;
