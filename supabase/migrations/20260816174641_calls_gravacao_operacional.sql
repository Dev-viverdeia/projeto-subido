begin;

-- Uma call produz no máximo uma gravação operacional. A integração é
-- idempotente porque o anfitrião pode recarregar a sala enquanto ela acontece.
create unique index calls_gravacoes_reuniao_unica_idx
  on public.calls_gravacoes (reuniao_id);

alter table public.calls_gravacoes
  add column tamanho_bytes bigint
    check (tamanho_bytes is null or tamanho_bytes >= 0),
  add column mime_type text not null default 'audio/mpeg';

-- O arquivo é privado e fica fora do banco. O primeiro segmento sempre é o UUID
-- do dono, o segundo é a reunião e o terceiro é a gravação.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'call-gravacoes',
  'call-gravacoes',
  false,
  1073741824,
  array['audio/mpeg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy call_gravacoes_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'call-gravacoes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.calls_gravacoes gravacao
      where gravacao.dono = (select auth.uid())
        and gravacao.caminho_arquivo = name
    )
  );

-- Evita duas análises concorrentes quando o browser e o webhook do LiveKit
-- avisam quase ao mesmo tempo que a conversa terminou. Uma tentativa travada
-- pode ser retomada depois de cinco minutos.
create or replace function public.calls_reivindicar_analise(
  p_reuniao uuid,
  p_dono uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_linhas integer := 0;
begin
  insert into public.calls_analises (dono, reuniao_id, status)
  values (p_dono, p_reuniao, 'pendente')
  on conflict (reuniao_id) do nothing;

  update public.calls_analises
  set status = 'processando',
      erro = null,
      atualizada_em = now()
  where dono = p_dono
    and reuniao_id = p_reuniao
    and (
      status in ('pendente', 'falhou')
      or (status = 'processando' and atualizada_em < now() - interval '5 minutes')
    );

  get diagnostics v_linhas = row_count;
  return v_linhas > 0;
end;
$$;

revoke all on function public.calls_reivindicar_analise(uuid, uuid) from public;
revoke all on function public.calls_reivindicar_analise(uuid, uuid) from anon;
revoke all on function public.calls_reivindicar_analise(uuid, uuid) from authenticated;
grant execute on function public.calls_reivindicar_analise(uuid, uuid) to service_role;

commit;
