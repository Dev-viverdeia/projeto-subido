-- Resultados externos e estornos sao operacoes do sistema, nao do navegador.
-- A sessao cria a busca e reserva o proprio saldo; somente o servidor, depois
-- de consultar os provedores, pode publicar os leads ou devolver a reserva.

grant select, insert, update on
  public.prospeccao_carteiras,
  public.prospeccao_listas,
  public.prospeccao_leads,
  public.prospeccao_movimentos
to service_role;

create function public.prospeccao_sistema_concluir_lista(
  p_dono uuid,
  p_lista uuid,
  p_leads jsonb,
  p_provedores jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_reservados integer;
  v_status text;
  v_inseridos integer := 0;
  v_linhas integer;
  v_estorno integer;
  v_saldo integer;
  v_item record;
begin
  if p_dono is null then
    raise exception 'dono_necessario' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_leads, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_leads, '[]'::jsonb)) > 50
    or jsonb_typeof(coalesce(p_provedores, '{}'::jsonb)) <> 'object' then
    raise exception 'resultados_invalidos' using errcode = '22023';
  end if;

  select creditos_reservados, status
  into v_reservados, v_status
  from public.prospeccao_listas
  where id = p_lista and dono = p_dono
  for update;

  if not found then
    raise exception 'lista_nao_encontrada' using errcode = 'P0002';
  end if;
  if v_status <> 'processando' then
    select creditos_consumidos into v_inseridos
    from public.prospeccao_listas where id = p_lista and dono = p_dono;
    return v_inseridos;
  end if;

  for v_item in
    select * from jsonb_to_recordset(coalesce(p_leads, '[]'::jsonb)) as x(
      chave_externa text,
      nome text,
      categoria text,
      endereco text,
      cidade text,
      estado text,
      site_url text,
      dominio text,
      telefone text,
      avaliacao numeric,
      total_avaliacoes integer,
      descricao text,
      fontes jsonb,
      dados jsonb
    )
    limit v_reservados
  loop
    if nullif(btrim(coalesce(v_item.chave_externa, '')), '') is null
      or nullif(btrim(coalesce(v_item.nome, '')), '') is null then
      continue;
    end if;

    insert into public.prospeccao_leads (
      dono, lista_id, chave_externa, nome, categoria, endereco, cidade, estado,
      site_url, dominio, telefone, avaliacao, total_avaliacoes, descricao, fontes, dados
    ) values (
      p_dono,
      p_lista,
      left(btrim(v_item.chave_externa), 500),
      left(btrim(v_item.nome), 160),
      left(nullif(btrim(coalesce(v_item.categoria, '')), ''), 160),
      left(nullif(btrim(coalesce(v_item.endereco, '')), ''), 500),
      left(nullif(btrim(coalesce(v_item.cidade, '')), ''), 120),
      left(nullif(btrim(coalesce(v_item.estado, '')), ''), 80),
      left(nullif(btrim(coalesce(v_item.site_url, '')), ''), 2048),
      left(nullif(btrim(coalesce(v_item.dominio, '')), ''), 253),
      left(nullif(btrim(coalesce(v_item.telefone, '')), ''), 80),
      case when v_item.avaliacao between 0 and 5 then v_item.avaliacao else null end,
      case when v_item.total_avaliacoes >= 0 then v_item.total_avaliacoes else null end,
      left(nullif(btrim(coalesce(v_item.descricao, '')), ''), 3000),
      case when jsonb_typeof(v_item.fontes) = 'array' then v_item.fontes else '[]'::jsonb end,
      case when jsonb_typeof(v_item.dados) = 'object' then v_item.dados else '{}'::jsonb end
    ) on conflict (dono, lista_id, chave_externa) do nothing;

    get diagnostics v_linhas = row_count;
    v_inseridos := v_inseridos + v_linhas;
  end loop;

  v_estorno := greatest(v_reservados - v_inseridos, 0);

  update public.prospeccao_listas
  set
    status = 'concluida',
    creditos_consumidos = v_inseridos,
    provedores = coalesce(p_provedores, '{}'::jsonb),
    concluido_em = now(),
    erro = null
  where id = p_lista and dono = p_dono;

  if v_estorno > 0 then
    update public.prospeccao_carteiras
    set saldo = saldo + v_estorno
    where dono = p_dono
    returning saldo into v_saldo;

    insert into public.prospeccao_movimentos (
      dono, lista_id, tipo, movimento, saldo_apos, descricao
    ) values (
      p_dono, p_lista, 'estorno', v_estorno, v_saldo,
      'Creditos nao utilizados pela busca'
    );
  end if;

  return v_inseridos;
end;
$$;

create function public.prospeccao_sistema_falhar_lista(
  p_dono uuid,
  p_lista uuid,
  p_erro text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_reservados integer;
  v_status text;
  v_saldo integer;
begin
  if p_dono is null then
    raise exception 'dono_necessario' using errcode = '22023';
  end if;

  select creditos_reservados, status
  into v_reservados, v_status
  from public.prospeccao_listas
  where id = p_lista and dono = p_dono
  for update;

  if not found or v_status <> 'processando' then
    return false;
  end if;

  update public.prospeccao_carteiras
  set saldo = saldo + v_reservados
  where dono = p_dono
  returning saldo into v_saldo;

  update public.prospeccao_listas
  set
    status = 'falhou',
    erro = left(nullif(btrim(coalesce(p_erro, '')), ''), 500),
    concluido_em = now()
  where id = p_lista and dono = p_dono;

  insert into public.prospeccao_movimentos (
    dono, lista_id, tipo, movimento, saldo_apos, descricao
  ) values (
    p_dono, p_lista, 'estorno', v_reservados, v_saldo,
    'Estorno integral de busca nao concluida'
  );

  return true;
end;
$$;

revoke execute on function public.prospeccao_concluir_lista(uuid, jsonb, jsonb)
  from authenticated;
revoke execute on function public.prospeccao_falhar_lista(uuid, text)
  from authenticated;

revoke execute on function public.prospeccao_sistema_concluir_lista(uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;
revoke execute on function public.prospeccao_sistema_falhar_lista(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.prospeccao_sistema_concluir_lista(uuid, uuid, jsonb, jsonb)
  to service_role;
grant execute on function public.prospeccao_sistema_falhar_lista(uuid, uuid, text)
  to service_role;

create index prospeccao_leads_crm_fk_idx
  on public.prospeccao_leads (crm_oportunidade_id)
  where crm_oportunidade_id is not null;
create index prospeccao_movimentos_lista_fk_idx
  on public.prospeccao_movimentos (dono, lista_id)
  where lista_id is not null;
