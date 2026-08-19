-- =============================================================================
-- GOOGLE CALENDAR NAS CALLS
--
-- A conta conecta o próprio Google Calendar. O app guarda somente o refresh
-- token cifrado pelo servidor e cria eventos no calendário principal, com a sala
-- pública da Subido como destino. O segredo de cifra nunca chega ao banco.
-- =============================================================================

create table public.google_calendar_conexoes (
  dono uuid primary key references auth.users (id) on delete cascade,
  google_sub text not null,
  google_email text not null,
  refresh_token_cifrado text not null,
  escopos text[] not null default '{}',
  calendar_id text not null default 'primary',
  status text not null default 'ativa',
  ultimo_erro text,
  conectado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint google_calendar_sub_tamanho
    check (char_length(btrim(google_sub)) between 3 and 255),
  constraint google_calendar_email_tamanho
    check (char_length(btrim(google_email)) between 3 and 320),
  constraint google_calendar_token_tamanho
    check (char_length(refresh_token_cifrado) between 40 and 4096),
  constraint google_calendar_id_tamanho
    check (char_length(btrim(calendar_id)) between 1 and 1024),
  constraint google_calendar_status_valido
    check (status in ('ativa', 'reconectar', 'erro')),
  constraint google_calendar_erro_tamanho
    check (ultimo_erro is null or char_length(ultimo_erro) <= 500)
);

comment on table public.google_calendar_conexoes is
  'Conexão individual do profissional com o Google Calendar. O refresh token é cifrado no servidor.';

create trigger google_calendar_conexoes_atualizada_em
  before update on public.google_calendar_conexoes
  for each row execute function private.tocar_atualizado_em();

alter table public.google_calendar_conexoes enable row level security;

create policy google_calendar_conexoes_select
  on public.google_calendar_conexoes
  for select to authenticated
  using (dono = (select auth.uid()));

revoke all on public.google_calendar_conexoes from public, anon, authenticated;
grant select (
  dono, google_email, escopos, calendar_id, status, ultimo_erro,
  conectado_em, atualizado_em
) on public.google_calendar_conexoes to authenticated;

create function public.google_calendar_salvar_conexao(
  p_google_sub text,
  p_google_email text,
  p_refresh_token_cifrado text,
  p_escopos text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_sub text := btrim(coalesce(p_google_sub, ''));
  v_email text := lower(btrim(coalesce(p_google_email, '')));
  v_token text := btrim(coalesce(p_refresh_token_cifrado, ''));
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if char_length(v_sub) not between 3 and 255 then
    raise exception 'conta_google_invalida' using errcode = '22023';
  end if;
  if char_length(v_email) not between 3 and 320 or position('@' in v_email) < 2 then
    raise exception 'email_google_invalido' using errcode = '22023';
  end if;
  if char_length(v_token) not between 40 and 4096 then
    raise exception 'token_google_invalido' using errcode = '22023';
  end if;

  insert into public.google_calendar_conexoes as conexao (
    dono, google_sub, google_email, refresh_token_cifrado, escopos,
    calendar_id, status, ultimo_erro, conectado_em
  ) values (
    v_dono, v_sub, v_email, v_token, coalesce(p_escopos, '{}'),
    'primary', 'ativa', null, now()
  )
  on conflict (dono) do update
  set google_sub = excluded.google_sub,
      google_email = excluded.google_email,
      refresh_token_cifrado = excluded.refresh_token_cifrado,
      escopos = excluded.escopos,
      status = 'ativa',
      ultimo_erro = null,
      conectado_em = now();
end;
$$;

create function public.google_calendar_obter_token()
returns table (
  refresh_token_cifrado text,
  calendar_id text,
  google_email text,
  status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    conexao.refresh_token_cifrado,
    conexao.calendar_id,
    conexao.google_email,
    conexao.status
  from public.google_calendar_conexoes conexao
  where conexao.dono = (select auth.uid());
$$;

create function public.google_calendar_marcar_estado(
  p_status text,
  p_erro text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if p_status not in ('ativa', 'reconectar', 'erro') then
    raise exception 'status_invalido' using errcode = '22023';
  end if;

  update public.google_calendar_conexoes
  set status = p_status,
      ultimo_erro = left(nullif(btrim(coalesce(p_erro, '')), ''), 500)
  where dono = (select auth.uid());
end;
$$;

create function public.google_calendar_desconectar()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_removidas integer;
begin
  if (select auth.uid()) is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  delete from public.google_calendar_conexoes
  where dono = (select auth.uid());
  get diagnostics v_removidas = row_count;
  return v_removidas > 0;
end;
$$;

revoke execute on function public.google_calendar_salvar_conexao(text, text, text, text[])
  from public, anon;
revoke execute on function public.google_calendar_obter_token()
  from public, anon;
revoke execute on function public.google_calendar_marcar_estado(text, text)
  from public, anon;
revoke execute on function public.google_calendar_desconectar()
  from public, anon;

grant execute on function public.google_calendar_salvar_conexao(text, text, text, text[])
  to authenticated;
grant execute on function public.google_calendar_obter_token()
  to authenticated;
grant execute on function public.google_calendar_marcar_estado(text, text)
  to authenticated;
grant execute on function public.google_calendar_desconectar()
  to authenticated;

alter table public.calls_reunioes
  add column convidado_email text,
  add column google_event_id text,
  add column google_event_url text,
  add column google_calendar_id text,
  add column google_sync_status text not null default 'nao_solicitado',
  add column google_sync_erro text,
  add constraint calls_convidado_email_tamanho
    check (convidado_email is null or char_length(convidado_email) between 3 and 320),
  add constraint calls_google_event_id_tamanho
    check (google_event_id is null or char_length(google_event_id) between 5 and 1024),
  add constraint calls_google_event_url_tamanho
    check (google_event_url is null or char_length(google_event_url) <= 2048),
  add constraint calls_google_calendar_id_tamanho
    check (google_calendar_id is null or char_length(google_calendar_id) <= 1024),
  add constraint calls_google_sync_status_valido
    check (google_sync_status in ('nao_solicitado', 'sincronizando', 'sincronizado', 'falhou')),
  add constraint calls_google_sync_erro_tamanho
    check (google_sync_erro is null or char_length(google_sync_erro) <= 500);

create index calls_reunioes_google_event_idx
  on public.calls_reunioes (dono, google_event_id)
  where google_event_id is not null;
