-- =============================================================================
-- PROSPECCAO: LISTAS, CREDITOS E ENTRADA NO CRM
--
-- O profissional pesquisa empresas antes de transforma-las em oportunidades.
-- Uma busca reserva os creditos; somente leads realmente persistidos consomem
-- saldo. Falhas e resultados menores que o pedido geram estorno atomico.
-- =============================================================================

create table public.prospeccao_carteiras (
  dono uuid primary key references auth.users (id) on delete cascade,
  saldo integer not null default 30,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint prospeccao_carteiras_saldo_valido check (saldo >= 0)
);

create table public.prospeccao_listas (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  segmento text not null,
  localizacao text not null,
  termos text[] not null default '{}',
  filtros jsonb not null default '{}'::jsonb,
  status text not null default 'processando',
  quantidade_solicitada integer not null,
  creditos_reservados integer not null,
  creditos_consumidos integer not null default 0,
  provedores jsonb not null default '{}'::jsonb,
  erro text,
  criado_em timestamptz not null default now(),
  concluido_em timestamptz,
  atualizado_em timestamptz not null default now(),

  constraint prospeccao_listas_nome_tamanho
    check (char_length(btrim(nome)) between 1 and 160),
  constraint prospeccao_listas_segmento_tamanho
    check (char_length(btrim(segmento)) between 2 and 160),
  constraint prospeccao_listas_localizacao_tamanho
    check (char_length(btrim(localizacao)) between 2 and 180),
  constraint prospeccao_listas_quantidade_valida
    check (quantidade_solicitada between 1 and 50),
  constraint prospeccao_listas_creditos_validos
    check (
      creditos_reservados = quantidade_solicitada
      and creditos_consumidos between 0 and creditos_reservados
    ),
  constraint prospeccao_listas_status_valido
    check (status in ('processando', 'concluida', 'falhou')),
  unique (dono, id)
);

create table public.prospeccao_leads (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  lista_id uuid not null,
  chave_externa text not null,
  nome text not null,
  categoria text,
  endereco text,
  cidade text,
  estado text,
  site_url text,
  dominio text,
  telefone text,
  avaliacao numeric(2, 1),
  total_avaliacoes integer,
  descricao text,
  fontes jsonb not null default '[]'::jsonb,
  dados jsonb not null default '{}'::jsonb,
  crm_oportunidade_id uuid,
  enviado_crm_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint prospeccao_leads_lista_fk
    foreign key (dono, lista_id)
    references public.prospeccao_listas (dono, id)
    on delete cascade,
  constraint prospeccao_leads_crm_fk
    foreign key (crm_oportunidade_id)
    references public.crm_oportunidades (id)
    on delete restrict,
  constraint prospeccao_leads_nome_tamanho
    check (char_length(btrim(nome)) between 1 and 160),
  constraint prospeccao_leads_chave_tamanho
    check (char_length(btrim(chave_externa)) between 1 and 500),
  constraint prospeccao_leads_avaliacao_valida
    check (avaliacao is null or avaliacao between 0 and 5),
  constraint prospeccao_leads_total_avaliacoes_valido
    check (total_avaliacoes is null or total_avaliacoes >= 0),
  unique (dono, lista_id, chave_externa),
  unique (dono, lista_id, id)
);

create table public.prospeccao_movimentos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  lista_id uuid,
  tipo text not null,
  movimento integer not null,
  saldo_apos integer not null,
  descricao text not null,
  criado_em timestamptz not null default now(),

  constraint prospeccao_movimentos_lista_fk
    foreign key (dono, lista_id)
    references public.prospeccao_listas (dono, id)
    on delete cascade,
  constraint prospeccao_movimentos_tipo_valido
    check (tipo in ('credito_inicial', 'busca', 'estorno', 'compra', 'ajuste')),
  constraint prospeccao_movimentos_movimento_valido check (movimento <> 0),
  constraint prospeccao_movimentos_saldo_valido check (saldo_apos >= 0)
);

create index prospeccao_listas_dono_criado_idx
  on public.prospeccao_listas (dono, criado_em desc);
create index prospeccao_leads_lista_idx
  on public.prospeccao_leads (dono, lista_id, criado_em);
create index prospeccao_leads_chave_crm_idx
  on public.prospeccao_leads (dono, chave_externa)
  where crm_oportunidade_id is not null;
create index prospeccao_movimentos_dono_criado_idx
  on public.prospeccao_movimentos (dono, criado_em desc);
create unique index prospeccao_movimentos_credito_inicial_idx
  on public.prospeccao_movimentos (dono, tipo)
  where tipo = 'credito_inicial';

create trigger prospeccao_carteiras_atualizado_em
  before update on public.prospeccao_carteiras
  for each row execute function private.tocar_atualizado_em();
create trigger prospeccao_listas_atualizado_em
  before update on public.prospeccao_listas
  for each row execute function private.tocar_atualizado_em();
create trigger prospeccao_leads_atualizado_em
  before update on public.prospeccao_leads
  for each row execute function private.tocar_atualizado_em();

alter table public.prospeccao_carteiras enable row level security;
alter table public.prospeccao_listas enable row level security;
alter table public.prospeccao_leads enable row level security;
alter table public.prospeccao_movimentos enable row level security;

create policy prospeccao_carteiras_select on public.prospeccao_carteiras
  for select to authenticated using (dono = (select auth.uid()));
create policy prospeccao_listas_select on public.prospeccao_listas
  for select to authenticated using (dono = (select auth.uid()));
create policy prospeccao_leads_select on public.prospeccao_leads
  for select to authenticated using (dono = (select auth.uid()));
create policy prospeccao_movimentos_select on public.prospeccao_movimentos
  for select to authenticated using (dono = (select auth.uid()));

grant select on
  public.prospeccao_carteiras,
  public.prospeccao_listas,
  public.prospeccao_leads,
  public.prospeccao_movimentos
to authenticated;

create function public.prospeccao_obter_saldo()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_saldo integer;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  insert into public.prospeccao_carteiras (dono)
  values (v_dono)
  on conflict (dono) do nothing;

  select saldo into v_saldo
  from public.prospeccao_carteiras
  where dono = v_dono;

  if not exists (
    select 1 from public.prospeccao_movimentos
    where dono = v_dono and tipo = 'credito_inicial'
  ) then
    insert into public.prospeccao_movimentos (
      dono, tipo, movimento, saldo_apos, descricao
    ) values (
      v_dono, 'credito_inicial', v_saldo, v_saldo, 'Saldo inicial da prospeccao'
    ) on conflict (dono, tipo) where tipo = 'credito_inicial' do nothing;
  end if;

  return v_saldo;
end;
$$;

create function public.prospeccao_criar_lista(
  p_nome text,
  p_segmento text,
  p_localizacao text,
  p_termos text[],
  p_quantidade integer,
  p_filtros jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_saldo integer;
  v_lista uuid;
  v_nome text := btrim(coalesce(p_nome, ''));
  v_segmento text := btrim(coalesce(p_segmento, ''));
  v_localizacao text := btrim(coalesce(p_localizacao, ''));
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if char_length(v_nome) not between 1 and 160
    or char_length(v_segmento) not between 2 and 160
    or char_length(v_localizacao) not between 2 and 180
    or p_quantidade not between 1 and 50
    or jsonb_typeof(coalesce(p_filtros, '{}'::jsonb)) <> 'object' then
    raise exception 'filtros_invalidos' using errcode = '22023';
  end if;

  perform public.prospeccao_obter_saldo();

  select saldo into v_saldo
  from public.prospeccao_carteiras
  where dono = v_dono
  for update;

  if v_saldo < p_quantidade then
    raise exception 'creditos_insuficientes' using errcode = 'P0001';
  end if;

  insert into public.prospeccao_listas (
    dono, nome, segmento, localizacao, termos, filtros,
    quantidade_solicitada, creditos_reservados
  ) values (
    v_dono, v_nome, v_segmento, v_localizacao, coalesce(p_termos, '{}'),
    coalesce(p_filtros, '{}'::jsonb), p_quantidade, p_quantidade
  ) returning id into v_lista;

  update public.prospeccao_carteiras
  set saldo = saldo - p_quantidade
  where dono = v_dono
  returning saldo into v_saldo;

  insert into public.prospeccao_movimentos (
    dono, lista_id, tipo, movimento, saldo_apos, descricao
  ) values (
    v_dono, v_lista, 'busca', -p_quantidade, v_saldo,
    'Reserva para a lista ' || v_nome
  );

  return v_lista;
end;
$$;

create function public.prospeccao_concluir_lista(
  p_lista uuid,
  p_leads jsonb,
  p_provedores jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_reservados integer;
  v_status text;
  v_inseridos integer := 0;
  v_linhas integer;
  v_estorno integer;
  v_saldo integer;
  v_item record;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if jsonb_typeof(coalesce(p_leads, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_leads, '[]'::jsonb)) > 50
    or jsonb_typeof(coalesce(p_provedores, '{}'::jsonb)) <> 'object' then
    raise exception 'resultados_invalidos' using errcode = '22023';
  end if;

  select creditos_reservados, status
  into v_reservados, v_status
  from public.prospeccao_listas
  where id = p_lista and dono = v_dono
  for update;

  if not found then
    raise exception 'lista_nao_encontrada' using errcode = 'P0002';
  end if;
  if v_status <> 'processando' then
    select creditos_consumidos into v_inseridos
    from public.prospeccao_listas where id = p_lista and dono = v_dono;
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
      v_dono,
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
  where id = p_lista and dono = v_dono;

  if v_estorno > 0 then
    update public.prospeccao_carteiras
    set saldo = saldo + v_estorno
    where dono = v_dono
    returning saldo into v_saldo;

    insert into public.prospeccao_movimentos (
      dono, lista_id, tipo, movimento, saldo_apos, descricao
    ) values (
      v_dono, p_lista, 'estorno', v_estorno, v_saldo,
      'Creditos nao utilizados pela busca'
    );
  end if;

  return v_inseridos;
end;
$$;

create function public.prospeccao_falhar_lista(p_lista uuid, p_erro text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_reservados integer;
  v_status text;
  v_saldo integer;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select creditos_reservados, status
  into v_reservados, v_status
  from public.prospeccao_listas
  where id = p_lista and dono = v_dono
  for update;

  if not found or v_status <> 'processando' then
    return false;
  end if;

  update public.prospeccao_carteiras
  set saldo = saldo + v_reservados
  where dono = v_dono
  returning saldo into v_saldo;

  update public.prospeccao_listas
  set
    status = 'falhou',
    erro = left(nullif(btrim(coalesce(p_erro, '')), ''), 500),
    concluido_em = now()
  where id = p_lista and dono = v_dono;

  insert into public.prospeccao_movimentos (
    dono, lista_id, tipo, movimento, saldo_apos, descricao
  ) values (
    v_dono, p_lista, 'estorno', v_reservados, v_saldo,
    'Estorno integral de busca nao concluida'
  );

  return true;
end;
$$;

create function public.prospeccao_enviar_lead_crm(p_lead uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_lead public.prospeccao_leads%rowtype;
  v_existente uuid;
  v_empresa uuid;
  v_contato uuid;
  v_oportunidade uuid;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select * into v_lead
  from public.prospeccao_leads
  where id = p_lead and dono = v_dono
  for update;

  if not found then
    raise exception 'lead_nao_encontrado' using errcode = 'P0002';
  end if;
  if v_lead.crm_oportunidade_id is not null then
    return v_lead.crm_oportunidade_id;
  end if;

  select crm_oportunidade_id into v_existente
  from public.prospeccao_leads
  where dono = v_dono
    and chave_externa = v_lead.chave_externa
    and crm_oportunidade_id is not null
  order by enviado_crm_em desc nulls last
  limit 1;

  if v_existente is not null then
    update public.prospeccao_leads
    set crm_oportunidade_id = v_existente, enviado_crm_em = now()
    where id = p_lead and dono = v_dono;
    return v_existente;
  end if;

  insert into public.crm_empresas (
    dono, nome, dominio, setor, cidade, estado, resumo, enriquecimento
  ) values (
    v_dono,
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
  values (v_dono, v_empresa, 'Contato a identificar', v_lead.telefone)
  returning id into v_contato;

  insert into public.crm_oportunidades (
    dono, empresa_id, contato_principal_id, titulo, etapa, origem
  ) values (
    v_dono, v_empresa, v_contato, 'Projeto de IA para ' || v_lead.nome,
    'novo_lead', 'prospeccao'
  ) returning id into v_oportunidade;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id, tipo, titulo,
    descricao, dados, fonte, fonte_id
  ) values (
    v_dono, v_empresa, v_contato, v_oportunidade, 'lead_criado',
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
  where id = p_lead and dono = v_dono;

  return v_oportunidade;
end;
$$;

comment on table public.prospeccao_carteiras is
  'Saldo de creditos da prospeccao, privado e imutavel fora das RPCs.';
comment on table public.prospeccao_listas is
  'Briefings de busca e estado das listas de empresas encontradas.';
comment on table public.prospeccao_leads is
  'Empresas candidatas antes de entrarem no CRM. Enriquecimento profundo ocorre no CRM.';
comment on function public.prospeccao_enviar_lead_crm(uuid) is
  'Cria empresa, contato, oportunidade e fato do CRM em uma unica transacao.';

revoke execute on function public.prospeccao_obter_saldo() from public, anon;
revoke execute on function public.prospeccao_criar_lista(text, text, text, text[], integer, jsonb)
  from public, anon;
revoke execute on function public.prospeccao_concluir_lista(uuid, jsonb, jsonb)
  from public, anon;
revoke execute on function public.prospeccao_falhar_lista(uuid, text) from public, anon;
revoke execute on function public.prospeccao_enviar_lead_crm(uuid) from public, anon;

grant execute on function public.prospeccao_obter_saldo() to authenticated;
grant execute on function public.prospeccao_criar_lista(text, text, text, text[], integer, jsonb)
  to authenticated;
grant execute on function public.prospeccao_concluir_lista(uuid, jsonb, jsonb)
  to authenticated;
grant execute on function public.prospeccao_falhar_lista(uuid, text) to authenticated;
grant execute on function public.prospeccao_enviar_lead_crm(uuid) to authenticated;

-- O produto deixa de oferecer Diagnosticos. O historico permanece preservado no
-- banco, mas nenhuma sessao autenticada consegue iniciar ou alterar o modulo.
revoke all on public.diagnosticos_atendimento from authenticated;
revoke execute on function public.diagnostico_iniciar(
  uuid, public.diagnostico_atendimento_canal, text, text, text, boolean
) from authenticated;
revoke execute on function public.diagnostico_aplicar_proxima_acao(uuid) from authenticated;
