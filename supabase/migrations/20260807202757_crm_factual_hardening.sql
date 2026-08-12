-- =============================================================================
-- CRM FACTUAL · HARDENING DAS ESCRITAS
--
-- O projeto tem default privileges antigos que concedem ALL em tabelas novas a
-- anon/authenticated. RLS impediria o acesso anônimo, mas não queremos depender
-- de uma permissão ampla para depois negar: revogamos e concedemos só o mínimo.
--
-- A linha do tempo passa a nascer por triggers privados. Assim, até uma escrita
-- autenticada feita fora das RPCs continua gerando o fato correspondente. Com
-- isso as RPCs podem ser SECURITY INVOKER e o advisor deixa de precisar aceitar
-- duas funções privilegiadas expostas no schema público.
-- =============================================================================

create function private.crm_registrar_oportunidade_criada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id, tipo, titulo, dados
  ) values (
    new.dono,
    new.empresa_id,
    new.contato_principal_id,
    new.id,
    'lead_criado',
    'Lead adicionado ao CRM',
    jsonb_build_object('etapa', new.etapa, 'origem', new.origem)
  );
  return new;
end;
$$;

create function private.crm_registrar_etapa_alterada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id, tipo, titulo, dados
  ) values (
    new.dono,
    new.empresa_id,
    new.contato_principal_id,
    new.id,
    'etapa_alterada',
    'Etapa do pipeline alterada',
    jsonb_build_object('de', old.etapa, 'para', new.etapa)
  );
  return new;
end;
$$;

revoke execute on function private.crm_registrar_oportunidade_criada() from public;
revoke execute on function private.crm_registrar_oportunidade_criada() from authenticated;
revoke execute on function private.crm_registrar_etapa_alterada() from public;
revoke execute on function private.crm_registrar_etapa_alterada() from authenticated;

create trigger crm_oportunidade_criada_evento
  after insert on public.crm_oportunidades
  for each row execute function private.crm_registrar_oportunidade_criada();

create trigger crm_oportunidade_etapa_evento
  after update of etapa on public.crm_oportunidades
  for each row
  when (old.etapa is distinct from new.etapa)
  execute function private.crm_registrar_etapa_alterada();

create or replace function public.crm_criar_lead(
  p_empresa_nome text,
  p_contato_nome text,
  p_contato_email text default null,
  p_oportunidade_titulo text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_empresa uuid;
  v_contato uuid;
  v_oportunidade uuid;
  v_empresa_nome text := btrim(coalesce(p_empresa_nome, ''));
  v_contato_nome text := btrim(coalesce(p_contato_nome, ''));
  v_email text := nullif(lower(btrim(coalesce(p_contato_email, ''))), '');
  v_titulo text := nullif(btrim(coalesce(p_oportunidade_titulo, '')), '');
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if char_length(v_empresa_nome) not between 1 and 160 then
    raise exception 'empresa_invalida' using errcode = '22023';
  end if;
  if char_length(v_contato_nome) not between 1 and 160 then
    raise exception 'contato_invalido' using errcode = '22023';
  end if;
  if v_email is not null and char_length(v_email) > 320 then
    raise exception 'email_invalido' using errcode = '22023';
  end if;

  insert into public.crm_empresas (dono, nome)
  values (v_dono, v_empresa_nome)
  returning id into v_empresa;

  insert into public.crm_contatos (dono, empresa_id, nome, email)
  values (v_dono, v_empresa, v_contato_nome, v_email)
  returning id into v_contato;

  insert into public.crm_oportunidades (
    dono, empresa_id, contato_principal_id, titulo, etapa, origem
  ) values (
    v_dono,
    v_empresa,
    v_contato,
    coalesce(v_titulo, 'Projeto de IA para ' || v_empresa_nome),
    'novo_lead',
    'manual'
  )
  returning id into v_oportunidade;

  return v_oportunidade;
end;
$$;

create or replace function public.crm_mover_oportunidade(
  p_oportunidade uuid,
  p_etapa public.crm_etapa
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_etapa_anterior public.crm_etapa;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select etapa
  into v_etapa_anterior
  from public.crm_oportunidades
  where id = p_oportunidade and dono = v_dono
  for update;

  if not found or v_etapa_anterior = p_etapa then
    return false;
  end if;

  update public.crm_oportunidades
  set
    etapa = p_etapa,
    ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint,
    ganha_em = case when p_etapa = 'ganho' then now() else ganha_em end,
    perdida_em = case when p_etapa = 'perdido' then now() else perdida_em end
  where id = p_oportunidade and dono = v_dono;

  return true;
end;
$$;

-- Retira os privilégios amplos herdados e reconstrói a superfície necessária.
revoke all on public.crm_empresas, public.crm_contatos, public.crm_oportunidades, public.crm_eventos
  from anon;
revoke all on public.crm_empresas, public.crm_contatos, public.crm_oportunidades, public.crm_eventos
  from authenticated;

grant select on public.crm_empresas, public.crm_contatos, public.crm_oportunidades, public.crm_eventos
  to authenticated;
grant insert on public.crm_empresas, public.crm_contatos, public.crm_oportunidades
  to authenticated;
grant update on public.crm_oportunidades to authenticated;

drop policy if exists crm_eventos_insert on public.crm_eventos;

revoke execute on function public.crm_criar_lead(text, text, text, text) from public;
revoke execute on function public.crm_criar_lead(text, text, text, text) from anon;
grant execute on function public.crm_criar_lead(text, text, text, text) to authenticated;

revoke execute on function public.crm_mover_oportunidade(uuid, public.crm_etapa) from public;
revoke execute on function public.crm_mover_oportunidade(uuid, public.crm_etapa) from anon;
grant execute on function public.crm_mover_oportunidade(uuid, public.crm_etapa) to authenticated;
