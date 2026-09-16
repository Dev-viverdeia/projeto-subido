begin;

alter table public.crm_empresas
  add column revisao integer not null default 0,
  add column cadastro_editado_em timestamptz,
  add column site_manual boolean not null default false;

create function private.crm_revisar_empresa()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.revisao := old.revisao + 1;
  return new;
end;
$$;
revoke all on function private.crm_revisar_empresa() from public, anon, authenticated;
create trigger crm_revisar_empresa before update on public.crm_empresas
  for each row execute function private.crm_revisar_empresa();

create function private.crm_editar_empresa(
  p_oportunidade uuid, p_empresa uuid, p_revisao integer, p_nome text, p_dominio text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_dono uuid := (select auth.uid());
  v_empresa public.crm_empresas%rowtype;
  v_nome text := btrim(p_nome);
  v_dominio text := lower(nullif(btrim(p_dominio), ''));
  v_campos text[] := '{}';
begin
  if v_dono is null or (select public.plano_subido_atual()) not in ('pro', 'enterprise') then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;
  if v_nome is null or char_length(v_nome) not between 1 and 160
    or v_nome ~ '[[:cntrl:]]' or p_revisao is null or p_revisao < 0
    or char_length(v_dominio) > 253
    or (v_dominio is not null and (
      v_dominio !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
      or v_dominio ~ '(^|\.)(localhost|local|internal|test|invalid|example|lan|home|onion)$'
    )) then
    raise exception 'empresa_invalida' using errcode = '22023';
  end if;
  perform 1 from public.crm_oportunidades
    where id = p_oportunidade and dono = v_dono and empresa_id = p_empresa for update;
  if not found then raise exception 'oportunidade_indisponivel' using errcode = 'P0002'; end if;
  select * into v_empresa from public.crm_empresas
    where id = p_empresa and dono = v_dono for update;
  if not found then raise exception 'empresa_indisponivel' using errcode = 'P0002'; end if;
  if v_empresa.revisao is distinct from p_revisao then
    raise exception 'empresa_alterada' using errcode = '40001';
  end if;
  if v_empresa.nome is distinct from v_nome then v_campos := array_append(v_campos, 'nome'); end if;
  if v_empresa.dominio is distinct from v_dominio then v_campos := array_append(v_campos, 'site'); end if;
  if cardinality(v_campos) = 0 then return false; end if;
  update public.crm_empresas set nome = v_nome, dominio = v_dominio,
    site_manual = site_manual or v_empresa.dominio is distinct from v_dominio,
    cadastro_editado_em = clock_timestamp()
    where id = p_empresa and dono = v_dono;
  insert into public.crm_eventos(dono, empresa_id, oportunidade_id, tipo, titulo, dados, fonte)
    values(v_dono, p_empresa, p_oportunidade, 'empresa_atualizada', 'Cadastro da empresa atualizado',
      jsonb_build_object('campos', v_campos), 'manual');
  return true;
end;
$$;
revoke all on function private.crm_editar_empresa(uuid, uuid, integer, text, text) from public, anon;
grant execute on function private.crm_editar_empresa(uuid, uuid, integer, text, text) to authenticated;
create function public.crm_editar_empresa(
  p_oportunidade uuid, p_empresa uuid, p_revisao integer, p_nome text, p_dominio text
) returns boolean language sql security invoker set search_path = '' as $$
  select private.crm_editar_empresa(p_oportunidade, p_empresa, p_revisao, p_nome, p_dominio);
$$;
revoke all on function public.crm_editar_empresa(uuid, uuid, integer, text, text) from public, anon;
grant execute on function public.crm_editar_empresa(uuid, uuid, integer, text, text) to authenticated;

-- Uma pesquisa iniciada antes da correção não pode restaurar o site anterior.
-- Preserva o contrato existente de publicação e o histórico do resultado.
create or replace function private.crm_publicar_enriquecimento()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_fatos integer := jsonb_array_length(coalesce(new.resultado -> 'fatos', '[]'::jsonb));
  v_hipoteses integer := jsonb_array_length(coalesce(new.resultado -> 'hipoteses', '[]'::jsonb));
begin
  update public.crm_empresas set
    dominio = case when site_manual then dominio else coalesce(new.dominio, dominio) end,
    setor = coalesce(nullif(new.resultado #>> '{empresa,setor}', ''), setor),
    porte = coalesce(nullif(new.resultado #>> '{empresa,porte}', ''), porte),
    cidade = coalesce(nullif(new.resultado #>> '{empresa,cidade}', ''), cidade),
    estado = coalesce(nullif(new.resultado #>> '{empresa,estado}', ''), estado),
    resumo = nullif(new.resultado ->> 'resumo', ''),
    enriquecimento = new.resultado,
    enriquecido_em = coalesce(new.concluido_em, now())
    where id = new.empresa_id and dono = new.dono;
  insert into public.crm_eventos(dono, empresa_id, contato_id, oportunidade_id,
    tipo, titulo, descricao, dados, fonte, fonte_id)
  values(new.dono, new.empresa_id, new.contato_id, new.oportunidade_id,
    'lead_enriquecido', 'Dossiê do lead atualizado', nullif(new.resultado ->> 'resumo', ''),
    jsonb_build_object('fatos', v_fatos, 'hipoteses', v_hipoteses), 'enriquecimento', new.id::text);
  return new;
end;
$$;
revoke all on function private.crm_publicar_enriquecimento() from public, anon, authenticated;

commit;
