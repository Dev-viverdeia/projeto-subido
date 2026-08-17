-- Fecha tambem saldo, reserva e envio ao CRM. A interface autentica a sessao e
-- o servidor executa as transacoes com o dono explicito; nenhuma mutacao de
-- creditos ou entrada no pipeline permanece chamavel pelo navegador.

create function public.prospeccao_sistema_obter_saldo(p_dono uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_saldo integer;
begin
  if p_dono is null then
    raise exception 'dono_necessario' using errcode = '22023';
  end if;

  insert into public.prospeccao_carteiras (dono)
  values (p_dono)
  on conflict (dono) do nothing;

  select saldo into v_saldo
  from public.prospeccao_carteiras
  where dono = p_dono;

  insert into public.prospeccao_movimentos (
    dono, tipo, movimento, saldo_apos, descricao
  ) values (
    p_dono, 'credito_inicial', v_saldo, v_saldo, 'Saldo inicial da prospeccao'
  ) on conflict (dono, tipo) where tipo = 'credito_inicial' do nothing;

  return v_saldo;
end;
$$;

create function public.prospeccao_sistema_criar_lista(
  p_dono uuid,
  p_nome text,
  p_segmento text,
  p_localizacao text,
  p_termos text[],
  p_quantidade integer,
  p_filtros jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_saldo integer;
  v_lista uuid;
  v_nome text := btrim(coalesce(p_nome, ''));
  v_segmento text := btrim(coalesce(p_segmento, ''));
  v_localizacao text := btrim(coalesce(p_localizacao, ''));
begin
  if p_dono is null then
    raise exception 'dono_necessario' using errcode = '22023';
  end if;
  if char_length(v_nome) not between 1 and 160
    or char_length(v_segmento) not between 2 and 160
    or char_length(v_localizacao) not between 2 and 180
    or p_quantidade not between 1 and 50
    or jsonb_typeof(coalesce(p_filtros, '{}'::jsonb)) <> 'object' then
    raise exception 'filtros_invalidos' using errcode = '22023';
  end if;

  perform public.prospeccao_sistema_obter_saldo(p_dono);

  select saldo into v_saldo
  from public.prospeccao_carteiras
  where dono = p_dono
  for update;

  if v_saldo < p_quantidade then
    raise exception 'creditos_insuficientes' using errcode = 'P0001';
  end if;

  insert into public.prospeccao_listas (
    dono, nome, segmento, localizacao, termos, filtros,
    quantidade_solicitada, creditos_reservados
  ) values (
    p_dono, v_nome, v_segmento, v_localizacao, coalesce(p_termos, '{}'),
    coalesce(p_filtros, '{}'::jsonb), p_quantidade, p_quantidade
  ) returning id into v_lista;

  update public.prospeccao_carteiras
  set saldo = saldo - p_quantidade
  where dono = p_dono
  returning saldo into v_saldo;

  insert into public.prospeccao_movimentos (
    dono, lista_id, tipo, movimento, saldo_apos, descricao
  ) values (
    p_dono, v_lista, 'busca', -p_quantidade, v_saldo,
    'Reserva para a lista ' || v_nome
  );

  return v_lista;
end;
$$;

create function public.prospeccao_sistema_enviar_lead_crm(p_dono uuid, p_lead uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead public.prospeccao_leads%rowtype;
  v_existente uuid;
  v_empresa uuid;
  v_contato uuid;
  v_oportunidade uuid;
begin
  if p_dono is null then
    raise exception 'dono_necessario' using errcode = '22023';
  end if;

  select * into v_lead
  from public.prospeccao_leads
  where id = p_lead and dono = p_dono
  for update;

  if not found then
    raise exception 'lead_nao_encontrado' using errcode = 'P0002';
  end if;
  if v_lead.crm_oportunidade_id is not null then
    return v_lead.crm_oportunidade_id;
  end if;

  select crm_oportunidade_id into v_existente
  from public.prospeccao_leads
  where dono = p_dono
    and chave_externa = v_lead.chave_externa
    and crm_oportunidade_id is not null
  order by enviado_crm_em desc nulls last
  limit 1;

  if v_existente is not null then
    update public.prospeccao_leads
    set crm_oportunidade_id = v_existente, enviado_crm_em = now()
    where id = p_lead and dono = p_dono;
    return v_existente;
  end if;

  insert into public.crm_empresas (
    dono, nome, dominio, setor, cidade, estado, resumo, enriquecimento
  ) values (
    p_dono,
    v_lead.nome,
    v_lead.dominio,
    v_lead.categoria,
    v_lead.cidade,
    v_lead.estado,
    v_lead.descricao,
    jsonb_build_object(
      'origem', 'prospeccao',
      'endereco', v_lead.endereco,
      'site_url', v_lead.site_url,
      'fontes', v_lead.fontes,
      'dados_publicos', v_lead.dados
    )
  ) returning id into v_empresa;

  insert into public.crm_contatos (dono, empresa_id, nome, telefone)
  values (p_dono, v_empresa, 'Contato a identificar', v_lead.telefone)
  returning id into v_contato;

  insert into public.crm_oportunidades (
    dono, empresa_id, contato_principal_id, titulo, etapa, origem
  ) values (
    p_dono, v_empresa, v_contato, 'Projeto de IA para ' || v_lead.nome,
    'novo_lead', 'prospeccao'
  ) returning id into v_oportunidade;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id, tipo, titulo,
    descricao, dados, fonte, fonte_id
  ) values (
    p_dono, v_empresa, v_contato, v_oportunidade, 'lead_criado',
    'Lead enviado pela Prospecção',
    'Empresa encontrada em uma lista de prospecção e adicionada ao pipeline.',
    jsonb_build_object(
      'etapa', 'novo_lead',
      'origem', 'prospeccao',
      'lista_id', v_lead.lista_id,
      'lead_id', v_lead.id
    ),
    'prospeccao', v_lead.id::text
  );

  update public.prospeccao_leads
  set crm_oportunidade_id = v_oportunidade, enviado_crm_em = now()
  where id = p_lead and dono = p_dono;

  return v_oportunidade;
end;
$$;

revoke execute on function public.prospeccao_obter_saldo() from authenticated;
revoke execute on function public.prospeccao_criar_lista(text, text, text, text[], integer, jsonb)
  from authenticated;
revoke execute on function public.prospeccao_enviar_lead_crm(uuid) from authenticated;

revoke execute on function public.prospeccao_sistema_obter_saldo(uuid)
  from public, anon, authenticated;
revoke execute on function public.prospeccao_sistema_criar_lista(
  uuid, text, text, text, text[], integer, jsonb
) from public, anon, authenticated;
revoke execute on function public.prospeccao_sistema_enviar_lead_crm(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.prospeccao_sistema_obter_saldo(uuid) to service_role;
grant execute on function public.prospeccao_sistema_criar_lista(
  uuid, text, text, text, text[], integer, jsonb
) to service_role;
grant execute on function public.prospeccao_sistema_enviar_lead_crm(uuid, uuid) to service_role;
