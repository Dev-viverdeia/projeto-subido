-- =============================================================================
-- CRM KANBAN · DESFECHO COM CONTEXTO
--
-- O quadro passa a tratar ganho e perdido como resultados distintos. Uma perda
-- precisa de motivo, reabrir uma oportunidade limpa o desfecho atual e todas as
-- transições continuam registradas na linha do tempo factual.
-- =============================================================================

-- Corrige registros antigos antes de tornar o estado de perda coerente.
update public.crm_oportunidades
set
  ganha_em = case
    when etapa = 'ganho' then coalesce(ganha_em, atualizado_em, now())
    else null
  end,
  perdida_em = case
    when etapa = 'perdido' then coalesce(perdida_em, atualizado_em, now())
    else null
  end,
  motivo_perda = case
    when etapa = 'perdido' then left(
      coalesce(nullif(btrim(motivo_perda), ''), 'nao_informado'),
      120
    )
    else null
  end
where
  (etapa = 'ganho' and (ganha_em is null or perdida_em is not null or motivo_perda is not null))
  or (etapa = 'perdido' and (perdida_em is null or motivo_perda is null or ganha_em is not null))
  or (etapa not in ('ganho', 'perdido') and (ganha_em is not null or perdida_em is not null or motivo_perda is not null));

alter table public.crm_oportunidades
  drop constraint if exists crm_oportunidades_motivo_perda_estado;

alter table public.crm_oportunidades
  add constraint crm_oportunidades_motivo_perda_estado check (
    (
      etapa = 'perdido'
      and motivo_perda is not null
      and char_length(btrim(motivo_perda)) between 1 and 120
    )
    or (etapa <> 'perdido' and motivo_perda is null)
  );

create or replace function private.crm_registrar_etapa_alterada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tipo text;
  v_titulo text;
  v_dados jsonb;
begin
  if new.etapa = 'perdido' then
    v_tipo := 'oportunidade_perdida';
    v_titulo := 'Oportunidade marcada como perdida';
    v_dados := jsonb_build_object(
      'de', old.etapa,
      'para', new.etapa,
      'motivo', new.motivo_perda
    );
  elsif new.etapa = 'ganho' then
    v_tipo := 'oportunidade_ganha';
    v_titulo := 'Oportunidade marcada como ganha';
    v_dados := jsonb_build_object('de', old.etapa, 'para', new.etapa);
  elsif old.etapa in ('ganho', 'perdido') then
    v_tipo := 'oportunidade_reaberta';
    v_titulo := 'Oportunidade reaberta';
    v_dados := jsonb_build_object('de', old.etapa, 'para', new.etapa);
  else
    v_tipo := 'etapa_alterada';
    v_titulo := 'Etapa do pipeline alterada';
    v_dados := jsonb_build_object('de', old.etapa, 'para', new.etapa);
  end if;

  insert into public.crm_eventos (
    dono,
    empresa_id,
    contato_id,
    oportunidade_id,
    tipo,
    titulo,
    dados
  ) values (
    new.dono,
    new.empresa_id,
    new.contato_principal_id,
    new.id,
    v_tipo,
    v_titulo,
    v_dados
  );

  return new;
end;
$$;

revoke execute on function private.crm_registrar_etapa_alterada() from public;
revoke execute on function private.crm_registrar_etapa_alterada() from anon;
revoke execute on function private.crm_registrar_etapa_alterada() from authenticated;

create function public.crm_mover_oportunidade_kanban(
  p_oportunidade uuid,
  p_etapa public.crm_etapa,
  p_motivo_perda text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_etapa_anterior public.crm_etapa;
  v_motivo text := nullif(btrim(coalesce(p_motivo_perda, '')), '');
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  if p_etapa = 'perdido' then
    if v_motivo is null then
      raise exception 'motivo_perda_obrigatorio' using errcode = '22023';
    end if;
    if v_motivo not in (
      'sem_prioridade',
      'sem_orcamento',
      'sem_retorno',
      'outra_solucao',
      'momento_inadequado',
      'sem_aderencia',
      'outro',
      'nao_informado'
    ) then
      raise exception 'motivo_perda_invalido' using errcode = '22023';
    end if;
  else
    v_motivo := null;
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
    ganha_em = case when p_etapa = 'ganho' then now() else null end,
    perdida_em = case when p_etapa = 'perdido' then now() else null end,
    motivo_perda = v_motivo
  where id = p_oportunidade and dono = v_dono;

  return true;
end;
$$;

comment on function public.crm_mover_oportunidade_kanban(uuid, public.crm_etapa, text) is
  'Move uma oportunidade pelo Kanban, exige motivo para perda e limpa o desfecho ao reabrir.';

revoke execute on function public.crm_mover_oportunidade_kanban(uuid, public.crm_etapa, text)
  from public;
revoke execute on function public.crm_mover_oportunidade_kanban(uuid, public.crm_etapa, text)
  from anon;
grant execute on function public.crm_mover_oportunidade_kanban(uuid, public.crm_etapa, text)
  to authenticated;

-- Compatibilidade para Calls e integrações que ainda usam a RPC original.
create or replace function public.crm_mover_oportunidade(
  p_oportunidade uuid,
  p_etapa public.crm_etapa
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return public.crm_mover_oportunidade_kanban(
    p_oportunidade,
    p_etapa,
    case when p_etapa = 'perdido' then 'nao_informado' else null end
  );
end;
$$;

revoke execute on function public.crm_mover_oportunidade(uuid, public.crm_etapa) from public;
revoke execute on function public.crm_mover_oportunidade(uuid, public.crm_etapa) from anon;
grant execute on function public.crm_mover_oportunidade(uuid, public.crm_etapa) to authenticated;
