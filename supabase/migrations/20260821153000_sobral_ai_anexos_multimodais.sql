-- =============================================================================
-- SOBRAL AI · ANEXOS MULTIMODAIS
--
-- O arquivo original fica privado no Storage. A mensagem guarda apenas o
-- contexto textual necessário para o Sobral continuar entendendo o anexo em
-- rodadas futuras. O navegador só acessa arquivos do próprio usuário por RLS.
-- =============================================================================

alter table public.consultor_mensagens
  add column contexto_anexos text;

alter table public.consultor_mensagens
  add constraint consultor_mensagens_contexto_anexos_tamanho
  check (contexto_anexos is null or char_length(contexto_anexos) <= 4000);

comment on column public.consultor_mensagens.contexto_anexos is
  'Resumo factual privado dos anexos, produzido pelo modelo para manter contexto entre rodadas.';

create table public.consultor_anexos (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid not null references public.consultor_mensagens (id) on delete cascade,
  dono uuid not null references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 240),
  tipo_mime text not null check (char_length(tipo_mime) between 3 and 120),
  tamanho_bytes bigint not null check (tamanho_bytes between 1 and 15728640),
  categoria text not null check (categoria in ('imagem', 'documento', 'audio')),
  caminho_storage text not null unique check (char_length(caminho_storage) between 10 and 600),
  transcricao text check (transcricao is null or char_length(transcricao) <= 24000),
  criado_em timestamptz not null default now()
);

comment on table public.consultor_anexos is
  'Arquivos privados enviados ao Sobral AI e ligados à mensagem que os originou.';

create index consultor_anexos_mensagem_idx
  on public.consultor_anexos (mensagem_id, criado_em);
create index consultor_anexos_dono_idx
  on public.consultor_anexos (dono, criado_em desc);

alter table public.consultor_anexos enable row level security;

create policy consultor_anexos_select on public.consultor_anexos
  for select to authenticated
  using (
    dono = (select auth.uid())
    and exists (
      select 1
      from public.consultor_mensagens mensagem
      join public.consultor_threads thread on thread.id = mensagem.thread_id
      where mensagem.id = mensagem_id
        and thread.dono = (select auth.uid())
    )
  );

create policy consultor_anexos_insert on public.consultor_anexos
  for insert to authenticated
  with check (
    dono = (select auth.uid())
    and exists (
      select 1
      from public.consultor_mensagens mensagem
      join public.consultor_threads thread on thread.id = mensagem.thread_id
      where mensagem.id = mensagem_id
        and thread.dono = (select auth.uid())
    )
  );

create policy consultor_anexos_delete on public.consultor_anexos
  for delete to authenticated
  using (dono = (select auth.uid()));

grant select, insert, delete on public.consultor_anexos to authenticated;
grant select, insert, update, delete on public.consultor_anexos to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sobral-anexos',
  'sobral-anexos',
  false,
  15728640,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a',
    'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy sobral_anexos_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'sobral-anexos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy sobral_anexos_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'sobral-anexos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy sobral_anexos_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'sobral-anexos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
