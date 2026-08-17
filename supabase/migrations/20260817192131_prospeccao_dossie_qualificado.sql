-- A lista deixa de guardar apenas o registro basico do mapa e passa a preservar
-- o dossie comercial encontrado: canais, presenca digital, horarios e pessoas.

alter table public.prospeccao_leads
  add column telefones jsonb not null default '[]'::jsonb,
  add column emails jsonb not null default '[]'::jsonb,
  add column redes_sociais jsonb not null default '[]'::jsonb,
  add column decisores jsonb not null default '[]'::jsonb,
  add column horarios jsonb not null default '[]'::jsonb,
  add column maps_url text,
  add column imagem_url text,
  add column qualificacao jsonb not null default '{}'::jsonb;

update public.prospeccao_leads
set
  telefones = case when telefone is null then '[]'::jsonb else jsonb_build_array(telefone) end,
  maps_url = nullif(dados ->> 'maps_url', ''),
  qualificacao = jsonb_build_object(
    'completude',
      (case when telefone is not null then 20 else 0 end) +
      (case when site_url is not null then 15 else 0 end),
    'itens', jsonb_build_object(
      'telefone', telefone is not null,
      'email', false,
      'site', site_url is not null,
      'redes_sociais', false,
      'decisores', false
    ),
    'sinais', '[]'::jsonb
  );

alter table public.prospeccao_leads
  add constraint prospeccao_leads_telefones_array
    check (jsonb_typeof(telefones) = 'array'),
  add constraint prospeccao_leads_emails_array
    check (jsonb_typeof(emails) = 'array'),
  add constraint prospeccao_leads_redes_array
    check (jsonb_typeof(redes_sociais) = 'array'),
  add constraint prospeccao_leads_decisores_array
    check (jsonb_typeof(decisores) = 'array'),
  add constraint prospeccao_leads_horarios_array
    check (jsonb_typeof(horarios) = 'array'),
  add constraint prospeccao_leads_qualificacao_object
    check (jsonb_typeof(qualificacao) = 'object');

create or replace function public.prospeccao_sistema_concluir_lista(
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
      telefones jsonb,
      emails jsonb,
      redes_sociais jsonb,
      decisores jsonb,
      horarios jsonb,
      maps_url text,
      imagem_url text,
      avaliacao numeric,
      total_avaliacoes integer,
      descricao text,
      fontes jsonb,
      qualificacao jsonb,
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
      site_url, dominio, telefone, telefones, emails, redes_sociais, decisores,
      horarios, maps_url, imagem_url, avaliacao, total_avaliacoes, descricao,
      fontes, qualificacao, dados
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
      case when jsonb_typeof(v_item.telefones) = 'array' then v_item.telefones else '[]'::jsonb end,
      case when jsonb_typeof(v_item.emails) = 'array' then v_item.emails else '[]'::jsonb end,
      case when jsonb_typeof(v_item.redes_sociais) = 'array' then v_item.redes_sociais else '[]'::jsonb end,
      case when jsonb_typeof(v_item.decisores) = 'array' then v_item.decisores else '[]'::jsonb end,
      case when jsonb_typeof(v_item.horarios) = 'array' then v_item.horarios else '[]'::jsonb end,
      left(nullif(btrim(coalesce(v_item.maps_url, '')), ''), 2048),
      left(nullif(btrim(coalesce(v_item.imagem_url, '')), ''), 2048),
      case when v_item.avaliacao between 0 and 5 then v_item.avaliacao else null end,
      case when v_item.total_avaliacoes >= 0 then v_item.total_avaliacoes else null end,
      left(nullif(btrim(coalesce(v_item.descricao, '')), ''), 3000),
      case when jsonb_typeof(v_item.fontes) = 'array' then v_item.fontes else '[]'::jsonb end,
      case when jsonb_typeof(v_item.qualificacao) = 'object' then v_item.qualificacao else '{}'::jsonb end,
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

create or replace function public.prospeccao_sistema_enviar_lead_crm(p_dono uuid, p_lead uuid)
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
  v_contato_gerado uuid;
  v_oportunidade uuid;
  v_decisor jsonb;
  v_email text;
  v_telefone text;
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

  v_email := left(nullif(btrim(coalesce(v_lead.emails ->> 0, '')), ''), 320);
  v_telefone := coalesce(
    left(nullif(btrim(coalesce(v_lead.telefones ->> 0, '')), ''), 80),
    v_lead.telefone
  );

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
      'maps_url', v_lead.maps_url,
      'emails', v_lead.emails,
      'telefones', v_lead.telefones,
      'redes_sociais', v_lead.redes_sociais,
      'decisores', v_lead.decisores,
      'horarios', v_lead.horarios,
      'qualificacao', v_lead.qualificacao,
      'fontes', v_lead.fontes,
      'dados_publicos', v_lead.dados
    )
  ) returning id into v_empresa;

  for v_decisor in
    select value from jsonb_array_elements(v_lead.decisores) limit 5
  loop
    insert into public.crm_contatos (
      dono, empresa_id, nome, email, telefone, cargo, linkedin_url
    ) values (
      p_dono,
      v_empresa,
      left(coalesce(nullif(btrim(v_decisor ->> 'nome'), ''), 'Contato a identificar'), 160),
      left(coalesce(
        nullif(btrim(v_decisor ->> 'email'), ''),
        case when v_contato is null then v_email else null end
      ), 320),
      left(coalesce(
        nullif(btrim(v_decisor ->> 'telefone'), ''),
        case when v_contato is null then v_telefone else null end
      ), 80),
      left(nullif(btrim(v_decisor ->> 'cargo'), ''), 180),
      left(nullif(btrim(v_decisor ->> 'linkedin_url'), ''), 2048)
    ) returning id into v_contato_gerado;

    if v_contato is null then
      v_contato := v_contato_gerado;
    end if;
  end loop;

  if v_contato is null then
    insert into public.crm_contatos (dono, empresa_id, nome, email, telefone)
    values (p_dono, v_empresa, 'Contato a identificar', v_email, v_telefone)
    returning id into v_contato;
  end if;

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
    'Lead qualificado enviado pela Prospecção',
    'Empresa revisada em uma lista de prospecção e adicionada ao pipeline.',
    jsonb_build_object(
      'etapa', 'novo_lead',
      'origem', 'prospeccao',
      'lista_id', v_lead.lista_id,
      'lead_id', v_lead.id,
      'completude', v_lead.qualificacao -> 'completude'
    ),
    'prospeccao', v_lead.id::text
  );

  update public.prospeccao_leads
  set crm_oportunidade_id = v_oportunidade, enviado_crm_em = now()
  where id = p_lead and dono = p_dono;

  return v_oportunidade;
end;
$$;

revoke execute on function public.prospeccao_sistema_concluir_lista(uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;
revoke execute on function public.prospeccao_sistema_enviar_lead_crm(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.prospeccao_sistema_concluir_lista(uuid, uuid, jsonb, jsonb)
  to service_role;
grant execute on function public.prospeccao_sistema_enviar_lead_crm(uuid, uuid)
  to service_role;
