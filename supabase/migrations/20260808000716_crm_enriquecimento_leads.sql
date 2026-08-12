-- =============================================================================
-- CRM · ENRIQUECIMENTO DE LEADS
--
-- O enriquecimento não sobrescreve fatos silenciosamente. Cada execução fica
-- guardada, com entrada, fontes, resultado e status; quando conclui, um trigger
-- privado publica o retrato atual na empresa e registra o fato na mesma linha do
-- tempo usada por Calls e pelo pipeline.
-- =============================================================================

create type public.crm_enriquecimento_status as enum (
  'na_fila',
  'processando',
  'concluido',
  'falhou'
);

create table public.crm_enriquecimentos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  contato_id uuid,
  oportunidade_id uuid not null,
  status public.crm_enriquecimento_status not null default 'na_fila',
  dominio text,
  linkedin_url text,
  contexto text,
  resultado jsonb,
  fontes jsonb not null default '[]'::jsonb,
  erro text,
  modelo text,
  solicitado_em timestamptz not null default now(),
  iniciado_em timestamptz,
  concluido_em timestamptz,
  atualizado_em timestamptz not null default now(),

  constraint crm_enriquecimentos_empresa_fk
    foreign key (dono, empresa_id)
    references public.crm_empresas (dono, id)
    on delete cascade,
  constraint crm_enriquecimentos_contato_fk
    foreign key (dono, empresa_id, contato_id)
    references public.crm_contatos (dono, empresa_id, id)
    on delete restrict,
  constraint crm_enriquecimentos_oportunidade_fk
    foreign key (dono, empresa_id, oportunidade_id)
    references public.crm_oportunidades (dono, empresa_id, id)
    on delete cascade,
  constraint crm_enriquecimentos_dominio_tamanho
    check (dominio is null or char_length(dominio) <= 253),
  constraint crm_enriquecimentos_linkedin_tamanho
    check (linkedin_url is null or char_length(linkedin_url) <= 500),
  constraint crm_enriquecimentos_contexto_tamanho
    check (contexto is null or char_length(contexto) <= 4000),
  constraint crm_enriquecimentos_erro_tamanho
    check (erro is null or char_length(erro) <= 3000),
  constraint crm_enriquecimentos_fontes_array
    check (jsonb_typeof(fontes) = 'array'),
  constraint crm_enriquecimentos_resultado_objeto
    check (resultado is null or jsonb_typeof(resultado) = 'object'),
  constraint crm_enriquecimentos_resultado_tamanho
    check (resultado is null or octet_length(resultado::text) <= 200000),
  unique (dono, id)
);

comment on table public.crm_enriquecimentos is
  'Histórico privado dos dossiês gerados por IA para cada oportunidade do CRM.';
comment on column public.crm_enriquecimentos.resultado is
  'Saída estruturada: fatos com origem, hipóteses com validação e recomendações comerciais.';

create index crm_enriquecimentos_oportunidade_idx
  on public.crm_enriquecimentos (dono, oportunidade_id, solicitado_em desc);
create index crm_enriquecimentos_empresa_fk_idx
  on public.crm_enriquecimentos (dono, empresa_id);
create index crm_enriquecimentos_contato_fk_idx
  on public.crm_enriquecimentos (dono, empresa_id, contato_id);
create unique index crm_enriquecimentos_um_ativo_idx
  on public.crm_enriquecimentos (dono, oportunidade_id)
  where status in ('na_fila', 'processando');

create trigger crm_enriquecimentos_atualizado_em
  before update on public.crm_enriquecimentos
  for each row execute function private.tocar_atualizado_em();

alter table public.crm_enriquecimentos enable row level security;

create policy crm_enriquecimentos_select on public.crm_enriquecimentos
  for select to authenticated
  using (dono = (select auth.uid()));
create policy crm_enriquecimentos_insert on public.crm_enriquecimentos
  for insert to authenticated
  with check (dono = (select auth.uid()));
create policy crm_enriquecimentos_update on public.crm_enriquecimentos
  for update to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

revoke all on public.crm_enriquecimentos from anon;
revoke all on public.crm_enriquecimentos from authenticated;
grant select, insert, update on public.crm_enriquecimentos to authenticated;

-- A RPC liga o pedido aos IDs reais da oportunidade. O browser nunca escolhe
-- empresa, contato ou dono separadamente.
create function public.crm_iniciar_enriquecimento(
  p_oportunidade uuid,
  p_dominio text default null,
  p_linkedin_url text default null,
  p_contexto text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_empresa uuid;
  v_contato uuid;
  v_id uuid;
  v_dominio text := nullif(lower(btrim(coalesce(p_dominio, ''))), '');
  v_linkedin text := nullif(btrim(coalesce(p_linkedin_url, '')), '');
  v_contexto text := nullif(btrim(coalesce(p_contexto, '')), '');
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if v_dominio is null and v_contexto is null then
    raise exception 'fonte_necessaria' using errcode = '22023';
  end if;
  if char_length(coalesce(v_dominio, '')) > 253
    or char_length(coalesce(v_linkedin, '')) > 500
    or char_length(coalesce(v_contexto, '')) > 4000 then
    raise exception 'entrada_muito_longa' using errcode = '22023';
  end if;

  select empresa_id, contato_principal_id
  into v_empresa, v_contato
  from public.crm_oportunidades
  where id = p_oportunidade and dono = v_dono;

  if not found then
    raise exception 'oportunidade_nao_encontrada' using errcode = 'P0002';
  end if;

  insert into public.crm_enriquecimentos (
    dono, empresa_id, contato_id, oportunidade_id,
    dominio, linkedin_url, contexto
  ) values (
    v_dono, v_empresa, v_contato, p_oportunidade,
    v_dominio, v_linkedin, v_contexto
  )
  returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'enriquecimento_em_andamento' using errcode = '55000';
end;
$$;

comment on function public.crm_iniciar_enriquecimento(uuid, text, text, text) is
  'Abre um dossiê para uma oportunidade do próprio usuário sem aceitar vínculos arbitrários.';

revoke execute on function public.crm_iniciar_enriquecimento(uuid, text, text, text) from public;
revoke execute on function public.crm_iniciar_enriquecimento(uuid, text, text, text) from anon;
grant execute on function public.crm_iniciar_enriquecimento(uuid, text, text, text) to authenticated;

-- Publica somente um resultado explicitamente concluído. O gatilho é privado e
-- não pode ser chamado pela API; a FK composta já provou que todas as linhas
-- pertencem ao mesmo dono.
create function private.crm_publicar_enriquecimento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fatos integer := jsonb_array_length(coalesce(new.resultado -> 'fatos', '[]'::jsonb));
  v_hipoteses integer := jsonb_array_length(coalesce(new.resultado -> 'hipoteses', '[]'::jsonb));
begin
  update public.crm_empresas
  set
    dominio = coalesce(new.dominio, dominio),
    setor = coalesce(nullif(new.resultado #>> '{empresa,setor}', ''), setor),
    porte = coalesce(nullif(new.resultado #>> '{empresa,porte}', ''), porte),
    cidade = coalesce(nullif(new.resultado #>> '{empresa,cidade}', ''), cidade),
    estado = coalesce(nullif(new.resultado #>> '{empresa,estado}', ''), estado),
    resumo = nullif(new.resultado ->> 'resumo', ''),
    enriquecimento = new.resultado,
    enriquecido_em = coalesce(new.concluido_em, now())
  where id = new.empresa_id and dono = new.dono;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id,
    tipo, titulo, descricao, dados, fonte, fonte_id
  ) values (
    new.dono,
    new.empresa_id,
    new.contato_id,
    new.oportunidade_id,
    'lead_enriquecido',
    'Dossiê do lead atualizado',
    nullif(new.resultado ->> 'resumo', ''),
    jsonb_build_object('fatos', v_fatos, 'hipoteses', v_hipoteses),
    'enriquecimento',
    new.id::text
  );

  return new;
end;
$$;

revoke execute on function private.crm_publicar_enriquecimento() from public;
revoke execute on function private.crm_publicar_enriquecimento() from authenticated;

create trigger crm_enriquecimento_publicado
  after update of status on public.crm_enriquecimentos
  for each row
  when (
    old.status is distinct from new.status
    and new.status = 'concluido'
    and new.resultado is not null
  )
  execute function private.crm_publicar_enriquecimento();

-- Toda mudança real de próxima ação passa a ser um fato, inclusive quando a
-- recomendação do dossiê for aceita pelo profissional.
create function private.crm_registrar_proxima_acao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id, tipo, titulo, dados
  ) values (
    new.dono,
    new.empresa_id,
    new.contato_principal_id,
    new.id,
    'proxima_acao_alterada',
    'Próxima ação atualizada',
    jsonb_build_object('acao', new.proxima_acao, 'quando', new.proxima_acao_em)
  );
  return new;
end;
$$;

revoke execute on function private.crm_registrar_proxima_acao() from public;
revoke execute on function private.crm_registrar_proxima_acao() from authenticated;

create trigger crm_oportunidade_proxima_acao_evento
  after update of proxima_acao, proxima_acao_em on public.crm_oportunidades
  for each row
  when (
    old.proxima_acao is distinct from new.proxima_acao
    or old.proxima_acao_em is distinct from new.proxima_acao_em
  )
  execute function private.crm_registrar_proxima_acao();

create function public.crm_aplicar_proxima_acao(
  p_oportunidade uuid,
  p_enriquecimento uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_acao text;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select nullif(resultado #>> '{proximaAcao,acao}', '')
  into v_acao
  from public.crm_enriquecimentos
  where id = p_enriquecimento
    and oportunidade_id = p_oportunidade
    and dono = v_dono
    and status = 'concluido';

  if not found or v_acao is null then
    return false;
  end if;

  update public.crm_oportunidades
  set proxima_acao = left(v_acao, 500), proxima_acao_em = null
  where id = p_oportunidade and dono = v_dono;

  return found;
end;
$$;

revoke execute on function public.crm_aplicar_proxima_acao(uuid, uuid) from public;
revoke execute on function public.crm_aplicar_proxima_acao(uuid, uuid) from anon;
grant execute on function public.crm_aplicar_proxima_acao(uuid, uuid) to authenticated;
