-- =============================================================================
-- DIAGNÓSTICO DE ATENDIMENTO
--
-- Cada diagnóstico pertence a uma oportunidade real do CRM. A coleta automática
-- é somente da jornada pública do site; conversas e relatos privados só entram
-- quando o profissional confirma que tem autorização para usar aqueles dados.
-- O resultado preserva a fronteira entre evidência, hipótese e lacuna.
-- =============================================================================

create type public.diagnostico_atendimento_status as enum (
  'na_fila',
  'processando',
  'concluido',
  'falhou'
);

create type public.diagnostico_atendimento_canal as enum (
  'site',
  'whatsapp',
  'instagram',
  'chat',
  'email',
  'telefone',
  'outro'
);

create table public.diagnosticos_atendimento (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  contato_id uuid,
  oportunidade_id uuid not null,
  status public.diagnostico_atendimento_status not null default 'na_fila',
  canal public.diagnostico_atendimento_canal not null,
  site_url text,
  cenario text not null,
  evidencia_informada text,
  confirmou_autorizacao boolean not null default false,
  resultado jsonb,
  fontes jsonb not null default '[]'::jsonb,
  nota_geral smallint,
  erro text,
  modelo text,
  resposta_id text,
  solicitado_em timestamptz not null default now(),
  iniciado_em timestamptz,
  concluido_em timestamptz,
  atualizado_em timestamptz not null default now(),

  constraint diagnosticos_atendimento_empresa_fk
    foreign key (dono, empresa_id)
    references public.crm_empresas (dono, id)
    on delete cascade,
  constraint diagnosticos_atendimento_contato_fk
    foreign key (dono, empresa_id, contato_id)
    references public.crm_contatos (dono, empresa_id, id)
    on delete restrict,
  constraint diagnosticos_atendimento_oportunidade_fk
    foreign key (dono, empresa_id, oportunidade_id)
    references public.crm_oportunidades (dono, empresa_id, id)
    on delete cascade,
  constraint diagnosticos_atendimento_site_tamanho
    check (site_url is null or char_length(site_url) <= 1000),
  constraint diagnosticos_atendimento_cenario_tamanho
    check (char_length(btrim(cenario)) between 20 and 4000),
  constraint diagnosticos_atendimento_evidencia_tamanho
    check (evidencia_informada is null or char_length(evidencia_informada) <= 50000),
  constraint diagnosticos_atendimento_evidencia_autorizada
    check (evidencia_informada is null or confirmou_autorizacao),
  constraint diagnosticos_atendimento_resultado_objeto
    check (resultado is null or jsonb_typeof(resultado) = 'object'),
  constraint diagnosticos_atendimento_resultado_tamanho
    check (resultado is null or octet_length(resultado::text) <= 240000),
  constraint diagnosticos_atendimento_fontes_array
    check (jsonb_typeof(fontes) = 'array'),
  constraint diagnosticos_atendimento_nota_faixa
    check (nota_geral is null or nota_geral between 0 and 100),
  constraint diagnosticos_atendimento_erro_tamanho
    check (erro is null or char_length(erro) <= 3000),
  constraint diagnosticos_atendimento_modelo_tamanho
    check (modelo is null or char_length(modelo) between 2 and 120),
  constraint diagnosticos_atendimento_resposta_tamanho
    check (resposta_id is null or char_length(resposta_id) <= 200),
  unique (dono, id)
);

comment on table public.diagnosticos_atendimento is
  'Auditorias privadas da jornada de atendimento, ligadas a uma oportunidade factual do CRM.';
comment on column public.diagnosticos_atendimento.evidencia_informada is
  'Transcrição ou relato fornecido pelo profissional; exige confirmação explícita de autorização.';
comment on column public.diagnosticos_atendimento.resultado is
  'Relatório estruturado que separa evidências, hipóteses, lacunas e plano de correção.';

create index diagnosticos_atendimento_lista_idx
  on public.diagnosticos_atendimento (dono, solicitado_em desc);
create index diagnosticos_atendimento_oportunidade_idx
  on public.diagnosticos_atendimento (dono, oportunidade_id, solicitado_em desc);
create index diagnosticos_atendimento_empresa_fk_idx
  on public.diagnosticos_atendimento (dono, empresa_id);
create index diagnosticos_atendimento_contato_fk_idx
  on public.diagnosticos_atendimento (dono, empresa_id, contato_id);
create index diagnosticos_atendimento_oportunidade_fk_idx
  on public.diagnosticos_atendimento (dono, empresa_id, oportunidade_id);
create unique index diagnosticos_atendimento_um_ativo_idx
  on public.diagnosticos_atendimento (dono, oportunidade_id)
  where status in ('na_fila', 'processando');

create trigger diagnosticos_atendimento_atualizado_em
  before update on public.diagnosticos_atendimento
  for each row execute function private.tocar_atualizado_em();

alter table public.diagnosticos_atendimento enable row level security;

create policy diagnosticos_atendimento_select on public.diagnosticos_atendimento
  for select to authenticated
  using (dono = (select auth.uid()));

revoke all on public.diagnosticos_atendimento from anon, authenticated;
grant select on public.diagnosticos_atendimento to authenticated;
grant select, insert, update on public.diagnosticos_atendimento to service_role;

-- O cliente escolhe somente a oportunidade e o material do teste. Empresa,
-- contato e dono são derivados do CRM dentro da transação.
create function public.diagnostico_iniciar(
  p_oportunidade uuid,
  p_canal public.diagnostico_atendimento_canal,
  p_site_url text,
  p_cenario text,
  p_evidencia text default null,
  p_confirmou_autorizacao boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_empresa uuid;
  v_contato uuid;
  v_site text := nullif(btrim(coalesce(p_site_url, '')), '');
  v_cenario text := btrim(coalesce(p_cenario, ''));
  v_evidencia text := nullif(btrim(coalesce(p_evidencia, '')), '');
  v_id uuid;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if char_length(v_cenario) not between 20 and 4000 then
    raise exception 'cenario_invalido' using errcode = '22023';
  end if;
  if v_site is null and v_evidencia is null then
    raise exception 'fonte_necessaria' using errcode = '22023';
  end if;
  if char_length(coalesce(v_site, '')) > 1000
    or char_length(coalesce(v_evidencia, '')) > 50000 then
    raise exception 'entrada_muito_longa' using errcode = '22023';
  end if;
  if v_evidencia is not null and not p_confirmou_autorizacao then
    raise exception 'autorizacao_necessaria' using errcode = '42501';
  end if;

  select empresa_id, contato_principal_id
  into v_empresa, v_contato
  from public.crm_oportunidades
  where id = p_oportunidade and dono = v_dono;

  if not found then
    raise exception 'oportunidade_nao_encontrada' using errcode = 'P0002';
  end if;

  insert into public.diagnosticos_atendimento (
    dono, empresa_id, contato_id, oportunidade_id, canal, site_url,
    cenario, evidencia_informada, confirmou_autorizacao
  ) values (
    v_dono, v_empresa, v_contato, p_oportunidade, p_canal, v_site,
    v_cenario, v_evidencia, p_confirmou_autorizacao
  ) returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'diagnostico_em_andamento' using errcode = '55000';
end;
$$;

comment on function public.diagnostico_iniciar(
  uuid, public.diagnostico_atendimento_canal, text, text, text, boolean
) is 'Inicia um diagnóstico ligado a uma oportunidade do próprio usuário.';

revoke execute on function public.diagnostico_iniciar(
  uuid, public.diagnostico_atendimento_canal, text, text, text, boolean
) from public, anon;
grant execute on function public.diagnostico_iniciar(
  uuid, public.diagnostico_atendimento_canal, text, text, text, boolean
) to authenticated;

-- Retry do modelo ou da função não pode publicar o mesmo relatório duas vezes.
create unique index crm_eventos_diagnostico_unico_idx
  on public.crm_eventos (dono, fonte, fonte_id, tipo)
  where fonte = 'diagnosticos'
    and tipo = 'diagnostico_atendimento_concluido'
    and fonte_id is not null;

create function private.diagnostico_publicar_no_crm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id,
    tipo, titulo, descricao, dados, fonte, fonte_id, ocorrido_em
  ) values (
    new.dono,
    new.empresa_id,
    new.contato_id,
    new.oportunidade_id,
    'diagnostico_atendimento_concluido',
    'Diagnóstico de atendimento concluído',
    nullif(new.resultado ->> 'resumo', ''),
    jsonb_build_object(
      'diagnostico_id', new.id,
      'canal', new.canal,
      'nota_geral', new.nota_geral,
      'cobertura', new.resultado ->> 'cobertura',
      'falhas', jsonb_array_length(coalesce(new.resultado -> 'falhas', '[]'::jsonb)),
      'projeto_sugerido', new.resultado #>> '{oportunidades,0,projeto_titulo}'
    ),
    'diagnosticos',
    new.id::text,
    coalesce(new.concluido_em, now())
  )
  on conflict do nothing;

  return new;
end;
$$;

revoke execute on function private.diagnostico_publicar_no_crm() from public, anon, authenticated;

create trigger diagnostico_publicado_no_crm
  after update of status on public.diagnosticos_atendimento
  for each row
  when (
    old.status is distinct from new.status
    and new.status = 'concluido'
    and new.resultado is not null
  )
  execute function private.diagnostico_publicar_no_crm();

-- A recomendação só vira fato depois que o profissional escolhe aplicá-la.
create function public.diagnostico_aplicar_proxima_acao(p_diagnostico uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_oportunidade uuid;
  v_acao text;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select oportunidade_id, nullif(resultado #>> '{proxima_acao_comercial,acao}', '')
  into v_oportunidade, v_acao
  from public.diagnosticos_atendimento
  where id = p_diagnostico
    and dono = v_dono
    and status = 'concluido';

  if not found or v_acao is null then
    return false;
  end if;

  update public.crm_oportunidades
  set proxima_acao = left(v_acao, 500), proxima_acao_em = null
  where id = v_oportunidade and dono = v_dono;

  return found;
end;
$$;

revoke execute on function public.diagnostico_aplicar_proxima_acao(uuid) from public, anon;
grant execute on function public.diagnostico_aplicar_proxima_acao(uuid) to authenticated;
