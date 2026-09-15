begin;

alter table public.crm_contatos
  add column revisao integer not null default 0,
  add column telefone_manual boolean not null default false;

-- Revisão própria: timestamps com now() podem coincidir numa mesma transação.
create function private.crm_revisar_contato()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.revisao := old.revisao + 1;
  return new;
end;
$$;
revoke all on function private.crm_revisar_contato() from public, anon, authenticated;
create trigger crm_revisar_contato before update on public.crm_contatos
  for each row execute function private.crm_revisar_contato();

-- Sem grant amplo de UPDATE em contatos: somente estes três campos e este vínculo.
create function private.crm_editar_contato(
  p_oportunidade uuid, p_nome text, p_telefone text, p_email text,
  p_contato uuid default null, p_revisao integer default null
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_dono uuid := (select auth.uid());
  v_oportunidade public.crm_oportunidades%rowtype;
  v_contato public.crm_contatos%rowtype;
  v_nome text := coalesce(nullif(btrim(p_nome), ''), 'Contato a identificar');
  v_telefone text := nullif(btrim(p_telefone), '');
  v_email text := lower(nullif(btrim(p_email), ''));
  v_campos text[] := '{}';
begin
  if v_dono is null or (select public.plano_subido_atual()) not in ('pro', 'enterprise') then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;
  if char_length(v_nome) > 160 or v_nome ~ '[[:cntrl:]]'
    or char_length(v_email) > 254 or v_email ~ '[[:cntrl:]]'
    or (v_email is not null and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    or char_length(v_telefone) > 80
    or (v_telefone is not null and (v_telefone !~ '^\+?[0-9 ().-]+$'
      or char_length(regexp_replace(v_telefone, '[^0-9]', '', 'g')) not between 8 and 15))
    or (p_contato is null) <> (p_revisao is null) or p_revisao < 0 then
    raise exception 'contato_invalido' using errcode = '22023';
  end if;
  select * into v_oportunidade from public.crm_oportunidades
    where id = p_oportunidade and dono = v_dono for update;
  if not found then raise exception 'oportunidade_indisponivel' using errcode = 'P0002'; end if;
  if v_oportunidade.contato_principal_id is distinct from p_contato then
    raise exception 'contato_alterado' using errcode = '40001';
  end if;

  if p_contato is null then
    if v_nome = 'Contato a identificar' and v_email is null and v_telefone is null then
      raise exception 'contato_vazio' using errcode = '22023';
    end if;
    insert into public.crm_contatos(dono, empresa_id, nome, telefone, email, telefone_manual)
      values(v_dono, v_oportunidade.empresa_id, v_nome, v_telefone, v_email, v_telefone is not null)
      returning * into v_contato;
    update public.crm_oportunidades set contato_principal_id = v_contato.id
      where id = v_oportunidade.id and dono = v_dono;
    v_campos := array['nome', 'telefone', 'email'];
  else
    select * into v_contato from public.crm_contatos
      where id = p_contato and dono = v_dono and empresa_id = v_oportunidade.empresa_id for update;
    if not found then raise exception 'contato_indisponivel' using errcode = 'P0002'; end if;
    if v_contato.revisao is distinct from p_revisao then
      raise exception 'contato_alterado' using errcode = '40001';
    end if;
    if v_contato.nome is distinct from v_nome then v_campos := array_append(v_campos, 'nome'); end if;
    if v_contato.telefone is distinct from v_telefone then v_campos := array_append(v_campos, 'telefone'); end if;
    if v_contato.email is distinct from v_email then v_campos := array_append(v_campos, 'email'); end if;
    if cardinality(v_campos) = 0 then return false; end if;
    update public.crm_contatos set nome = v_nome, telefone = v_telefone, email = v_email,
      telefone_manual = case
        when v_telefone is null then false
        when regexp_replace(coalesce(v_contato.telefone, ''), '[^0-9]', '', 'g')
          <> regexp_replace(v_telefone, '[^0-9]', '', 'g') then true
        else v_contato.telefone_manual end
      where id = v_contato.id and dono = v_dono;
  end if;
  insert into public.crm_eventos(dono, empresa_id, contato_id, oportunidade_id, tipo, titulo, dados, fonte)
    values(v_dono, v_oportunidade.empresa_id, v_contato.id, v_oportunidade.id,
      'contato_atualizado', 'Contato principal atualizado', jsonb_build_object('campos', v_campos), 'manual');
  return true;
end;
$$;
revoke all on function private.crm_editar_contato(uuid, text, text, text, uuid, integer) from public, anon;
grant execute on function private.crm_editar_contato(uuid, text, text, text, uuid, integer) to authenticated;
create function public.crm_editar_contato(
  p_oportunidade uuid, p_nome text, p_telefone text, p_email text,
  p_contato uuid default null, p_revisao integer default null
) returns boolean language sql security invoker set search_path = '' as $$
  select private.crm_editar_contato(p_oportunidade, p_nome, p_telefone, p_email, p_contato, p_revisao);
$$;
revoke all on function public.crm_editar_contato(uuid, text, text, text, uuid, integer) from public, anon;
grant execute on function public.crm_editar_contato(uuid, text, text, text, uuid, integer) to authenticated;

commit;
