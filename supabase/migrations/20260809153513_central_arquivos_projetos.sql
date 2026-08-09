-- =============================================================================
-- CENTRAL DE ARQUIVOS DOS PROJETOS
--
-- Cada upload pertence a um profissional, a um projeto e, opcionalmente, a uma
-- tarefa. Versoes usam caminhos imutaveis: publicar uma nova versao nunca troca
-- silenciosamente o arquivo que estava em revisao. O bucket e privado; o Portal
-- do Cliente recebe downloads temporarios somente pelo servidor.
-- =============================================================================

begin;

create table public.projeto_arquivos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  projeto_execucao_id uuid not null,
  tarefa_id uuid,
  grupo_id uuid not null,
  versao integer not null,
  titulo text not null,
  descricao text,
  nome_original text not null,
  caminho_storage text not null,
  mime_type text not null,
  tamanho_bytes bigint not null,
  visivel_cliente boolean not null default false,
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),

  constraint projeto_arquivos_projeto_fk
    foreign key (dono, projeto_execucao_id)
    references public.projetos_execucao (dono, id)
    on delete cascade,
  constraint projeto_arquivos_tarefa_fk
    foreign key (tarefa_id)
    references public.projeto_tarefas (id)
    on delete set null,
  constraint projeto_arquivos_titulo_tamanho
    check (char_length(btrim(titulo)) between 2 and 180),
  constraint projeto_arquivos_descricao_tamanho
    check (descricao is null or char_length(descricao) <= 2000),
  constraint projeto_arquivos_nome_tamanho
    check (char_length(btrim(nome_original)) between 1 and 240),
  constraint projeto_arquivos_caminho_tamanho
    check (char_length(caminho_storage) between 10 and 1000),
  constraint projeto_arquivos_mime_tamanho
    check (char_length(btrim(mime_type)) between 1 and 180),
  constraint projeto_arquivos_tamanho_valido
    check (tamanho_bytes between 1 and 52428800),
  constraint projeto_arquivos_versao_valida
    check (versao > 0),
  unique (caminho_storage),
  unique (dono, grupo_id, versao),
  unique (dono, projeto_execucao_id, id)
);

comment on table public.projeto_arquivos is
  'Arquivos privados da entrega, com versoes imutaveis e publicacao deliberada no Portal do Cliente.';
comment on column public.projeto_arquivos.grupo_id is
  'Identidade estavel do entregavel. Todas as versoes do mesmo arquivo compartilham este UUID.';
comment on column public.projeto_arquivos.visivel_cliente is
  'Somente a versao deliberadamente liberada aparece no portal. Nao torna o bucket publico.';

create index projeto_arquivos_projeto_idx
  on public.projeto_arquivos (dono, projeto_execucao_id, criado_em desc);
create index projeto_arquivos_tarefa_idx
  on public.projeto_arquivos (dono, projeto_execucao_id, tarefa_id, criado_em desc)
  where tarefa_id is not null;
create index projeto_arquivos_portal_idx
  on public.projeto_arquivos (projeto_execucao_id, publicado_em desc)
  where visivel_cliente;

alter table public.projeto_arquivos enable row level security;

create policy projeto_arquivos_select on public.projeto_arquivos
  for select to authenticated using (dono = (select auth.uid()));

create policy projeto_arquivos_delete on public.projeto_arquivos
  for delete to authenticated using (dono = (select auth.uid()));

revoke all on table public.projeto_arquivos from anon;
revoke all on table public.projeto_arquivos from authenticated;
grant select, delete on table public.projeto_arquivos to authenticated;

-- Registra metadados somente depois do upload terminar. O lock por grupo torna
-- a numeracao de versao deterministica mesmo em dois envios simultaneos.
create function public.projeto_arquivo_registrar(
  p_projeto_id uuid,
  p_tarefa_id uuid,
  p_grupo_id uuid,
  p_titulo text,
  p_descricao text,
  p_nome_original text,
  p_caminho_storage text,
  p_mime_type text,
  p_tamanho_bytes bigint
)
returns public.projeto_arquivos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
  v_grupo uuid := coalesce(p_grupo_id, gen_random_uuid());
  v_versao integer;
  v_arquivo public.projeto_arquivos%rowtype;
begin
  if v_dono is null then
    raise exception 'sessao_obrigatoria';
  end if;

  if not exists (
    select 1 from public.projetos_execucao
    where id = p_projeto_id and dono = v_dono
  ) then
    raise exception 'projeto_indisponivel';
  end if;

  if p_tarefa_id is not null and not exists (
    select 1 from public.projeto_tarefas
    where id = p_tarefa_id
      and projeto_execucao_id = p_projeto_id
      and dono = v_dono
  ) then
    raise exception 'tarefa_indisponivel';
  end if;

  if p_caminho_storage not like v_dono::text || '/' || p_projeto_id::text || '/%' then
    raise exception 'caminho_storage_invalido';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_grupo::text, 0));

  if p_grupo_id is not null and not exists (
    select 1 from public.projeto_arquivos
    where grupo_id = p_grupo_id
      and projeto_execucao_id = p_projeto_id
      and dono = v_dono
  ) then
    raise exception 'grupo_indisponivel';
  end if;

  select coalesce(max(versao), 0) + 1
    into v_versao
  from public.projeto_arquivos
  where dono = v_dono and grupo_id = v_grupo;

  insert into public.projeto_arquivos (
    dono,
    projeto_execucao_id,
    tarefa_id,
    grupo_id,
    versao,
    titulo,
    descricao,
    nome_original,
    caminho_storage,
    mime_type,
    tamanho_bytes
  ) values (
    v_dono,
    p_projeto_id,
    p_tarefa_id,
    v_grupo,
    v_versao,
    btrim(p_titulo),
    nullif(btrim(coalesce(p_descricao, '')), ''),
    btrim(p_nome_original),
    p_caminho_storage,
    btrim(p_mime_type),
    p_tamanho_bytes
  ) returning * into v_arquivo;

  return v_arquivo;
end;
$$;

revoke execute on function public.projeto_arquivo_registrar(
  uuid, uuid, uuid, text, text, text, text, text, bigint
) from public, anon;
grant execute on function public.projeto_arquivo_registrar(
  uuid, uuid, uuid, text, text, text, text, text, bigint
) to authenticated;

-- Ha no maximo uma versao visivel por grupo. Retirar um arquivo do portal nao
-- apaga nenhuma versao e permite republica-lo mais tarde.
create function public.projeto_arquivo_definir_visibilidade(
  p_arquivo_id uuid,
  p_visivel boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
  v_grupo uuid;
  v_projeto uuid;
begin
  select grupo_id, projeto_execucao_id
    into v_grupo, v_projeto
  from public.projeto_arquivos
  where id = p_arquivo_id and dono = v_dono;

  if v_grupo is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_grupo::text, 0));

  if p_visivel then
    update public.projeto_arquivos
    set visivel_cliente = false,
        publicado_em = null
    where dono = v_dono
      and projeto_execucao_id = v_projeto
      and grupo_id = v_grupo
      and visivel_cliente;
  end if;

  update public.projeto_arquivos
  set visivel_cliente = p_visivel,
      publicado_em = case when p_visivel then now() else null end
  where id = p_arquivo_id and dono = v_dono;

  return found;
end;
$$;

revoke execute on function public.projeto_arquivo_definir_visibilidade(uuid, boolean)
  from public, anon;
grant execute on function public.projeto_arquivo_definir_visibilidade(uuid, boolean)
  to authenticated;

-- A trilha do portal registra quando um arquivo entra ou sai da visao do cliente.
alter table public.projeto_portal_eventos
  drop constraint projeto_portal_eventos_tipo_valido;
alter table public.projeto_portal_eventos
  add constraint projeto_portal_eventos_tipo_valido
    check (tipo in (
      'portal_ativado',
      'portal_desativado',
      'link_rotacionado',
      'aprovacao_solicitada',
      'entrega_aprovada',
      'ajustes_solicitados',
      'arquivo_liberado',
      'arquivo_retirado'
    ));

create function private.projeto_arquivo_registrar_publicacao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.visivel_cliente is distinct from old.visivel_cliente then
    insert into public.projeto_portal_eventos (
      dono, projeto_execucao_id, tarefa_id, tipo, autor, comentario
    ) values (
      new.dono,
      new.projeto_execucao_id,
      new.tarefa_id,
      case when new.visivel_cliente then 'arquivo_liberado' else 'arquivo_retirado' end,
      'prestador',
      new.titulo || ' · v' || new.versao::text
    );
  end if;

  return new;
end;
$$;

revoke execute on function private.projeto_arquivo_registrar_publicacao()
  from public, anon, authenticated;

create trigger projeto_arquivos_registrar_publicacao
  after update of visivel_cliente on public.projeto_arquivos
  for each row execute function private.projeto_arquivo_registrar_publicacao();

-- Bucket privado e imutavel: cada versao recebe um novo caminho. A policy valida
-- tanto o dono na primeira pasta quanto o projeto pertencente a ele na segunda.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'projeto-entregaveis',
  'projeto-entregaveis',
  false,
  52428800,
  array[
    'application/pdf',
    'application/zip',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'video/mp4',
    'audio/mpeg',
    'audio/mp4'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy projeto_entregaveis_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'projeto-entregaveis'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.projetos_execucao projeto
      where projeto.dono = (select auth.uid())
        and projeto.id::text = (storage.foldername(name))[2]
    )
  );

create policy projeto_entregaveis_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'projeto-entregaveis'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy projeto_entregaveis_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'projeto-entregaveis'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
