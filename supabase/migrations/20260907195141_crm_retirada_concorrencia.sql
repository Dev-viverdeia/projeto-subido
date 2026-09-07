begin;
create or replace function public.crm_mover_oportunidade_kanban(
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
  v_situacao text;
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

  select etapa, situacao
  into v_etapa_anterior, v_situacao
  from public.crm_oportunidades
  where id = p_oportunidade and dono = v_dono
  for update;

  if not found then raise exception 'oportunidade_indisponivel' using errcode = 'P0002'; end if;
  if v_situacao <> 'ativa' then
    raise exception 'restaure_antes_de_mover' using errcode = '40001';
  end if;
  if v_etapa_anterior = p_etapa then return false; end if;

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

-- Um aceite posterior continua válido, mesmo que o lead tenha sido desclassificado.
-- A confirmação do cliente restaura o fluxo; não inventa uma entrega concluída.
create function private.crm_restaurar_ao_ganhar()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.situacao = 'desclassificada' and old.etapa <> 'ganho' and new.etapa = 'ganho' then
    new.situacao := 'ativa';
    new.retirada_em := null;
    new.motivo_retirada := null;
  end if;
  return new;
end;
$$;
revoke all on function private.crm_restaurar_ao_ganhar() from public, anon, authenticated;
create trigger crm_restaurar_ao_ganhar before update of etapa on public.crm_oportunidades
  for each row execute function private.crm_restaurar_ao_ganhar();
drop trigger crm_registrar_situacao on public.crm_oportunidades;
create trigger crm_registrar_situacao after update on public.crm_oportunidades
  for each row when (old.situacao is distinct from new.situacao)
  execute function private.crm_registrar_situacao();

commit;
