begin;

-- Identidade comercial do prestador. A Subido organiza a venda, mas o cliente
-- contrata e paga o próprio profissional, fora da plataforma.
create table public.perfis_comerciais (
  dono uuid primary key references auth.users (id) on delete cascade,
  nome_responsavel text not null check (char_length(nome_responsavel) between 2 and 120),
  nome_negocio text check (nome_negocio is null or char_length(nome_negocio) between 2 and 160),
  email text check (email is null or char_length(email) <= 254),
  telefone text check (telefone is null or char_length(telefone) <= 40),
  site text check (site is null or char_length(site) <= 500),
  logo_path text check (logo_path is null or char_length(logo_path) <= 500),
  link_pagamento_padrao text check (
    link_pagamento_padrao is null or char_length(link_pagamento_padrao) <= 1000
  ),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.perfis_comerciais is
  'Identidade e meios comerciais usados como padrão nas propostas do prestador.';
comment on column public.perfis_comerciais.link_pagamento_padrao is
  'Checkout externo do próprio prestador. A Subido não recebe nem intermedeia o pagamento.';

alter table public.perfis_comerciais enable row level security;

create policy perfis_comerciais_select on public.perfis_comerciais
  for select to authenticated
  using (dono = (select auth.uid()));

create policy perfis_comerciais_insert on public.perfis_comerciais
  for insert to authenticated
  with check (dono = (select auth.uid()));

create policy perfis_comerciais_update on public.perfis_comerciais
  for update to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

grant select, insert, update on public.perfis_comerciais to authenticated;
grant select, insert, update, delete on public.perfis_comerciais to service_role;

create trigger perfis_comerciais_atualizado_em
  before update on public.perfis_comerciais
  for each row execute function private.tocar_atualizado_em();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'identidade-comercial',
  'identidade-comercial',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy identidade_comercial_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'identidade-comercial'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy identidade_comercial_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'identidade-comercial'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'identidade-comercial'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy identidade_comercial_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'identidade-comercial'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- A aprovação registra exatamente qual versão foi aceita e qual texto de
-- consentimento estava vigente naquele momento.
alter table public.propostas
  add column aceite_termos_em timestamptz,
  add column aceite_termos_versao integer,
  add column aceite_termos_identificador text;

alter table public.propostas
  add constraint propostas_aceite_termos_consistente check (
    (aceite_termos_em is null and aceite_termos_versao is null and aceite_termos_identificador is null)
    or
    (aceite_termos_em is not null and aceite_termos_versao is not null and aceite_termos_identificador is not null)
  );

drop function public.proposta_portal_decidir(
  uuid, public.proposta_status, text, text, text
);

create function public.proposta_portal_decidir(
  p_codigo uuid,
  p_decisao public.proposta_status,
  p_nome text,
  p_email text,
  p_comentario text default null,
  p_aceite_termos boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposta_id uuid;
  v_dono uuid;
  v_projeto_id uuid;
  v_nome text := nullif(btrim(coalesce(p_nome, '')), '');
  v_email text := lower(nullif(btrim(coalesce(p_email, '')), ''));
  v_comentario text := nullif(btrim(coalesce(p_comentario, '')), '');
begin
  if p_decisao not in ('aceita', 'recusada') then
    raise exception 'decisao_invalida' using errcode = '22023';
  end if;
  if p_decisao = 'aceita' and not p_aceite_termos then
    raise exception 'aceite_termos_obrigatorio' using errcode = '22023';
  end if;
  if v_nome is null or char_length(v_nome) not between 2 and 120 then
    raise exception 'nome_invalido' using errcode = '22023';
  end if;
  if v_email is null or char_length(v_email) > 254 or position('@' in v_email) < 2 then
    raise exception 'email_invalido' using errcode = '22023';
  end if;
  if char_length(coalesce(v_comentario, '')) > 2000 then
    raise exception 'comentario_invalido' using errcode = '22023';
  end if;

  update public.propostas
  set status = p_decisao,
      decisao_nome = v_nome,
      decisao_email = v_email,
      decisao_comentario = v_comentario,
      decidida_em = now(),
      aceite_termos_em = case when p_decisao = 'aceita' then now() else null end,
      aceite_termos_versao = case when p_decisao = 'aceita' then versao else null end,
      aceite_termos_identificador = case
        when p_decisao = 'aceita' then 'proposta-comercial-v1'
        else null
      end
  where compartilhamento_codigo = p_codigo
    and compartilhamento_ativo
    and status = 'apresentada'
  returning id, dono into v_proposta_id, v_dono;

  if v_proposta_id is null then
    return null;
  end if;

  insert into public.proposta_portal_eventos (
    dono, proposta_id, tipo, nome, email, comentario
  ) values (
    v_dono, v_proposta_id, p_decisao::text, v_nome, v_email, v_comentario
  );

  if p_decisao = 'aceita' then
    v_projeto_id := private.projeto_criar_da_proposta(v_proposta_id, v_dono);
  end if;

  return jsonb_build_object(
    'proposta_id', v_proposta_id,
    'status', p_decisao,
    'projeto_id', v_projeto_id
  );
end;
$$;

revoke all on function public.proposta_portal_decidir(
  uuid, public.proposta_status, text, text, text, boolean
) from public, anon, authenticated;
grant execute on function public.proposta_portal_decidir(
  uuid, public.proposta_status, text, text, text, boolean
) to service_role;

commit;
