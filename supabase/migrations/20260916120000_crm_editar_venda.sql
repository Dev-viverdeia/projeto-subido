begin;

alter table public.crm_oportunidades add column revisao_comercial integer not null default 0;

-- Protege título/valor mesmo quando alterados por outro caminho, sem conflitar com agenda/etapa.
create function private.crm_revisar_venda()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.revisao_comercial := old.revisao_comercial + case
    when new.titulo is distinct from old.titulo or new.valor_centavos is distinct from old.valor_centavos
    then 1 else 0 end;
  return new;
end;
$$;
revoke all on function private.crm_revisar_venda() from public, anon, authenticated;
create trigger crm_revisar_venda before update on public.crm_oportunidades
  for each row execute function private.crm_revisar_venda();

create function private.crm_editar_venda(
  p_oportunidade uuid, p_revisao integer, p_titulo text, p_valor_centavos bigint default null
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_dono uuid := (select auth.uid());
  v_venda public.crm_oportunidades%rowtype;
  v_titulo text := btrim(p_titulo);
  v_campos text[] := '{}';
begin
  if v_dono is null or (select public.plano_subido_atual()) not in ('pro', 'enterprise') then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;
  if v_titulo is null or char_length(v_titulo) not between 1 and 180
    or v_titulo ~ '[[:cntrl:]]' or p_revisao is null or p_revisao < 0
    or p_valor_centavos not between 0 and 100000000000 then
    raise exception 'venda_invalida' using errcode = '22023';
  end if;
  select * into v_venda from public.crm_oportunidades
    where id = p_oportunidade and dono = v_dono for update;
  if not found then raise exception 'oportunidade_indisponivel' using errcode = 'P0002'; end if;
  if v_venda.revisao_comercial is distinct from p_revisao then
    raise exception 'venda_alterada' using errcode = '40001';
  end if;
  if v_venda.titulo is distinct from v_titulo then v_campos := array_append(v_campos, 'nome do projeto'); end if;
  if v_venda.valor_centavos is distinct from p_valor_centavos then v_campos := array_append(v_campos, 'valor previsto'); end if;
  if cardinality(v_campos) = 0 then return false; end if;
  update public.crm_oportunidades set titulo = v_titulo, valor_centavos = p_valor_centavos
    where id = p_oportunidade and dono = v_dono;
  insert into public.crm_eventos(dono, empresa_id, oportunidade_id, tipo, titulo, descricao, dados, fonte)
    values(v_dono, v_venda.empresa_id, p_oportunidade, 'venda_atualizada', 'Dados da venda atualizados',
      'Campos alterados: ' || array_to_string(v_campos, ' e ') || '.',
      jsonb_build_object('campos', v_campos), 'manual');
  return true;
end;
$$;
revoke all on function private.crm_editar_venda(uuid, integer, text, bigint) from public, anon;
grant execute on function private.crm_editar_venda(uuid, integer, text, bigint) to authenticated;
create function public.crm_editar_venda(
  p_oportunidade uuid, p_revisao integer, p_titulo text, p_valor_centavos bigint default null
) returns boolean language sql security invoker set search_path = '' as $$
  select private.crm_editar_venda(p_oportunidade, p_revisao, p_titulo, p_valor_centavos);
$$;
revoke all on function public.crm_editar_venda(uuid, integer, text, bigint) from public, anon;
grant execute on function public.crm_editar_venda(uuid, integer, text, bigint) to authenticated;

commit;
