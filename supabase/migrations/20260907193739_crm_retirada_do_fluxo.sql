-- Retirada reversível, independente do resultado financeiro da venda.
begin;

alter table public.crm_oportunidades
  add column situacao text not null default 'ativa'
    check (situacao in ('ativa', 'arquivada', 'desclassificada')),
  add column retirada_em timestamptz,
  add column motivo_retirada text;

alter table public.crm_oportunidades add constraint crm_retirada_consistente check (
  (situacao = 'ativa' and retirada_em is null and motivo_retirada is null)
  or (situacao <> 'ativa' and retirada_em is not null and motivo_retirada is not null
      and char_length(btrim(motivo_retirada)) between 1 and 300)
);
alter table public.crm_oportunidades add constraint crm_ganha_nao_desclassificada
  check (not (situacao = 'desclassificada' and etapa = 'ganho'));
create index crm_oportunidades_dono_situacao_ordem
  on public.crm_oportunidades(dono, situacao, ordem desc);

create function private.crm_registrar_situacao()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.situacao is distinct from old.situacao then
    insert into public.crm_eventos(dono, empresa_id, oportunidade_id, tipo, titulo, descricao, dados)
    values (new.dono, new.empresa_id, new.id, 'situacao_alterada',
      case new.situacao when 'ativa' then 'Oportunidade restaurada'
        when 'arquivada' then 'Oportunidade arquivada' else 'Oportunidade desclassificada' end,
      new.motivo_retirada,
      jsonb_build_object('de', old.situacao, 'para', new.situacao, 'etapa', new.etapa,
        'motivo', coalesce(new.motivo_retirada, old.motivo_retirada)));
  end if;
  return new;
end;
$$;
revoke all on function private.crm_registrar_situacao() from public, anon, authenticated;
create trigger crm_registrar_situacao after update of situacao on public.crm_oportunidades
  for each row execute function private.crm_registrar_situacao();

create function private.crm_alterar_situacao(
  p_oportunidade uuid, p_situacao text, p_anterior text, p_motivo text default null
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_atual text;
  v_motivo text := nullif(btrim(p_motivo), '');
begin
  if (select auth.uid()) is null or (select public.plano_subido_atual()) not in ('pro', 'enterprise') then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;
  if p_situacao is null or p_situacao not in ('ativa', 'arquivada', 'desclassificada') then
    raise exception 'situacao_invalida' using errcode = '22023';
  end if;
  if p_situacao <> 'ativa' and (v_motivo is null or char_length(v_motivo) > 300) then
    raise exception 'motivo_obrigatorio' using errcode = '22023';
  end if;
  select situacao into v_atual from public.crm_oportunidades
    where id = p_oportunidade and dono = (select auth.uid()) for update;
  if not found then raise exception 'oportunidade_indisponivel' using errcode = 'P0002'; end if;
  -- Repetir uma confirmação já aplicada não duplica o histórico.
  if v_atual = p_situacao then return false; end if;
  if v_atual is distinct from p_anterior then
    raise exception 'situacao_alterada' using errcode = '40001';
  end if;
  update public.crm_oportunidades set situacao = p_situacao,
    retirada_em = case when p_situacao = 'ativa' then null else now() end,
    motivo_retirada = case when p_situacao = 'ativa' then null else v_motivo end
    where id = p_oportunidade and dono = (select auth.uid());
  return true;
end;
$$;
revoke all on function private.crm_alterar_situacao(uuid, text, text, text) from public, anon;
grant execute on function private.crm_alterar_situacao(uuid, text, text, text) to authenticated;
create function public.crm_alterar_situacao(
  p_oportunidade uuid, p_situacao text, p_anterior text, p_motivo text default null
) returns boolean language sql security invoker set search_path = '' as $$
  select private.crm_alterar_situacao(p_oportunidade, p_situacao, p_anterior, p_motivo);
$$;
revoke all on function public.crm_alterar_situacao(uuid, text, text, text) from public, anon;
grant execute on function public.crm_alterar_situacao(uuid, text, text, text) to authenticated;

commit;
