-- =============================================================================
-- CRM FACTUAL
--
-- Primeira fundação operacional do produto: empresa, contato, oportunidade e
-- uma linha do tempo imutável. O CRM não é uma agenda separada — cada mudança
-- relevante grava um fato que poderá alimentar calls, propostas e Sobral AI.
--
-- DECISÕES IMPORTANTES
--
-- 1. O DONO PARTICIPA DAS CHAVES ESTRANGEIRAS.
--    RLS controla quem lê, mas uma FK simples por id ainda aceitaria, no insert,
--    o UUID de uma empresa pertencente a outra pessoa. As FKs compostas
--    (dono, ...) tornam vínculos entre contas estruturalmente impossíveis.
--
-- 2. EVENTOS NÃO TÊM UPDATE NEM DELETE.
--    Uma linha do tempo que pode ser reescrita deixa de ser factual. Correções
--    futuras entram como novo evento; exclusão da conta continua removendo tudo
--    por cascade, como exige a jornada de privacidade.
--
-- 3. AS PRIMEIRAS MUTAÇÕES SÃO RPCS ATÔMICAS.
--    Criar um lead gera quatro linhas; mover uma oportunidade gera a mudança e o
--    evento. Se qualquer parte falhar, a transação inteira volta — nunca existe
--    card sem empresa ou mudança de etapa sem histórico.
-- =============================================================================

create type public.crm_etapa as enum (
  'novo_lead',
  'qualificacao',
  'descoberta',
  'proposta',
  'negociacao',
  'ganho',
  'perdido'
);

create table public.crm_empresas (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  dominio text,
  setor text,
  porte text,
  cidade text,
  estado text,
  resumo text,
  enriquecimento jsonb not null default '{}'::jsonb,
  enriquecido_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint crm_empresas_nome_tamanho check (char_length(btrim(nome)) between 1 and 160),
  constraint crm_empresas_resumo_tamanho check (resumo is null or char_length(resumo) <= 3000),
  unique (dono, id)
);

comment on table public.crm_empresas is
  'Empresas do CRM do profissional. Dados privados, isolados por dono.';
comment on column public.crm_empresas.enriquecimento is
  'Fatos estruturados de enriquecimento com suas fontes. Nunca substitui os campos confirmados pelo profissional.';

create table public.crm_contatos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  nome text not null,
  email text,
  telefone text,
  cargo text,
  linkedin_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint crm_contatos_nome_tamanho check (char_length(btrim(nome)) between 1 and 160),
  constraint crm_contatos_email_tamanho check (email is null or char_length(email) <= 320),
  constraint crm_contatos_empresa_fk
    foreign key (dono, empresa_id)
    references public.crm_empresas (dono, id)
    on delete cascade,
  unique (dono, empresa_id, id)
);

comment on table public.crm_contatos is
  'Pessoas ligadas a empresas do CRM. A FK composta impede associação entre contas.';

create table public.crm_oportunidades (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  contato_principal_id uuid,
  titulo text not null,
  etapa public.crm_etapa not null default 'novo_lead',
  valor_centavos bigint check (valor_centavos is null or valor_centavos >= 0),
  probabilidade smallint check (probabilidade is null or probabilidade between 0 and 100),
  origem text not null default 'manual',
  proxima_acao text,
  proxima_acao_em timestamptz,
  ordem bigint not null default (extract(epoch from clock_timestamp()) * 1000)::bigint,
  ganha_em timestamptz,
  perdida_em timestamptz,
  motivo_perda text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint crm_oportunidades_titulo_tamanho check (char_length(btrim(titulo)) between 1 and 180),
  constraint crm_oportunidades_proxima_acao_tamanho
    check (proxima_acao is null or char_length(proxima_acao) <= 500),
  constraint crm_oportunidades_empresa_fk
    foreign key (dono, empresa_id)
    references public.crm_empresas (dono, id)
    on delete cascade,
  constraint crm_oportunidades_contato_fk
    foreign key (dono, empresa_id, contato_principal_id)
    references public.crm_contatos (dono, empresa_id, id)
    on delete restrict,
  unique (dono, empresa_id, id)
);

comment on table public.crm_oportunidades is
  'Negociações do pipeline comercial. O estado atual fica aqui; toda transição também vira crm_eventos.';

create table public.crm_eventos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  contato_id uuid,
  oportunidade_id uuid not null,
  tipo text not null,
  titulo text not null,
  descricao text,
  dados jsonb not null default '{}'::jsonb,
  fonte text not null default 'plataforma',
  fonte_id text,
  ocorrido_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),

  constraint crm_eventos_tipo_tamanho check (char_length(btrim(tipo)) between 1 and 80),
  constraint crm_eventos_titulo_tamanho check (char_length(btrim(titulo)) between 1 and 180),
  constraint crm_eventos_descricao_tamanho check (descricao is null or char_length(descricao) <= 10000),
  constraint crm_eventos_empresa_fk
    foreign key (dono, empresa_id)
    references public.crm_empresas (dono, id)
    on delete cascade,
  constraint crm_eventos_contato_fk
    foreign key (dono, empresa_id, contato_id)
    references public.crm_contatos (dono, empresa_id, id)
    on delete restrict,
  constraint crm_eventos_oportunidade_fk
    foreign key (dono, empresa_id, oportunidade_id)
    references public.crm_oportunidades (dono, empresa_id, id)
    on delete cascade
);

comment on table public.crm_eventos is
  'Linha do tempo factual e imutável do CRM. Não há policy nem grant de update/delete.';

-- Índices das telas reais: pipeline por dono/etapa e timeline por oportunidade.
create index crm_empresas_dono_nome_idx on public.crm_empresas (dono, nome);
create index crm_contatos_dono_empresa_idx on public.crm_contatos (dono, empresa_id, criado_em desc);
create index crm_oportunidades_pipeline_idx
  on public.crm_oportunidades (dono, etapa, ordem desc, atualizado_em desc);
create index crm_eventos_timeline_idx
  on public.crm_eventos (dono, oportunidade_id, ocorrido_em desc, criado_em desc);

create trigger crm_empresas_atualizado_em
  before update on public.crm_empresas
  for each row execute function private.tocar_atualizado_em();
create trigger crm_contatos_atualizado_em
  before update on public.crm_contatos
  for each row execute function private.tocar_atualizado_em();
create trigger crm_oportunidades_atualizado_em
  before update on public.crm_oportunidades
  for each row execute function private.tocar_atualizado_em();

-- RLS continua sendo a segunda barreira, inclusive dentro das RPCs.
alter table public.crm_empresas enable row level security;
alter table public.crm_contatos enable row level security;
alter table public.crm_oportunidades enable row level security;
alter table public.crm_eventos enable row level security;

create policy crm_empresas_select on public.crm_empresas
  for select to authenticated using (dono = (select auth.uid()));
create policy crm_empresas_insert on public.crm_empresas
  for insert to authenticated with check (dono = (select auth.uid()));
create policy crm_empresas_update on public.crm_empresas
  for update to authenticated using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

create policy crm_contatos_select on public.crm_contatos
  for select to authenticated using (dono = (select auth.uid()));
create policy crm_contatos_insert on public.crm_contatos
  for insert to authenticated with check (dono = (select auth.uid()));
create policy crm_contatos_update on public.crm_contatos
  for update to authenticated using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

create policy crm_oportunidades_select on public.crm_oportunidades
  for select to authenticated using (dono = (select auth.uid()));
create policy crm_oportunidades_insert on public.crm_oportunidades
  for insert to authenticated with check (dono = (select auth.uid()));
create policy crm_oportunidades_update on public.crm_oportunidades
  for update to authenticated using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

create policy crm_eventos_select on public.crm_eventos
  for select to authenticated using (dono = (select auth.uid()));
create policy crm_eventos_insert on public.crm_eventos
  for insert to authenticated with check (dono = (select auth.uid()));

-- A pessoa lê diretamente. Escritas entram pelas RPCs abaixo, para preservar a
-- atomicidade e impedir a edição direta da linha do tempo.
grant select on public.crm_empresas, public.crm_contatos, public.crm_oportunidades, public.crm_eventos
  to authenticated;

create function public.crm_criar_lead(
  p_empresa_nome text,
  p_contato_nome text,
  p_contato_email text default null,
  p_oportunidade_titulo text default null
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
  v_oportunidade uuid;
  v_empresa_nome text := btrim(coalesce(p_empresa_nome, ''));
  v_contato_nome text := btrim(coalesce(p_contato_nome, ''));
  v_email text := nullif(lower(btrim(coalesce(p_contato_email, ''))), '');
  v_titulo text := nullif(btrim(coalesce(p_oportunidade_titulo, '')), '');
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if char_length(v_empresa_nome) not between 1 and 160 then
    raise exception 'empresa_invalida' using errcode = '22023';
  end if;
  if char_length(v_contato_nome) not between 1 and 160 then
    raise exception 'contato_invalido' using errcode = '22023';
  end if;
  if v_email is not null and char_length(v_email) > 320 then
    raise exception 'email_invalido' using errcode = '22023';
  end if;

  insert into public.crm_empresas (dono, nome)
  values (v_dono, v_empresa_nome)
  returning id into v_empresa;

  insert into public.crm_contatos (dono, empresa_id, nome, email)
  values (v_dono, v_empresa, v_contato_nome, v_email)
  returning id into v_contato;

  insert into public.crm_oportunidades (
    dono, empresa_id, contato_principal_id, titulo, etapa, origem
  ) values (
    v_dono,
    v_empresa,
    v_contato,
    coalesce(v_titulo, 'Projeto de IA para ' || v_empresa_nome),
    'novo_lead',
    'manual'
  )
  returning id into v_oportunidade;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id, tipo, titulo, dados
  ) values (
    v_dono,
    v_empresa,
    v_contato,
    v_oportunidade,
    'lead_criado',
    'Lead adicionado ao CRM',
    jsonb_build_object('etapa', 'novo_lead', 'origem', 'manual')
  );

  return v_oportunidade;
end;
$$;

comment on function public.crm_criar_lead(text, text, text, text) is
  'Cria empresa, contato, oportunidade e primeiro evento em uma única transação.';

create function public.crm_mover_oportunidade(
  p_oportunidade uuid,
  p_etapa public.crm_etapa
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_empresa uuid;
  v_contato uuid;
  v_etapa_anterior public.crm_etapa;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select empresa_id, contato_principal_id, etapa
  into v_empresa, v_contato, v_etapa_anterior
  from public.crm_oportunidades
  where id = p_oportunidade and dono = v_dono
  for update;

  if not found then
    return false;
  end if;
  if v_etapa_anterior = p_etapa then
    return false;
  end if;

  update public.crm_oportunidades
  set
    etapa = p_etapa,
    ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint,
    ganha_em = case when p_etapa = 'ganho' then now() else ganha_em end,
    perdida_em = case when p_etapa = 'perdido' then now() else perdida_em end
  where id = p_oportunidade and dono = v_dono;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id, tipo, titulo, dados
  ) values (
    v_dono,
    v_empresa,
    v_contato,
    p_oportunidade,
    'etapa_alterada',
    'Etapa do pipeline alterada',
    jsonb_build_object('de', v_etapa_anterior, 'para', p_etapa)
  );

  return true;
end;
$$;

comment on function public.crm_mover_oportunidade(uuid, public.crm_etapa) is
  'Move uma oportunidade e registra a transição factual na mesma transação.';

-- Funções públicas nascem executáveis por PUBLIC no Postgres. Fechamos antes de
-- conceder somente a quem tem sessão.
revoke execute on function public.crm_criar_lead(text, text, text, text) from public;
revoke execute on function public.crm_criar_lead(text, text, text, text) from anon;
grant execute on function public.crm_criar_lead(text, text, text, text) to authenticated;

revoke execute on function public.crm_mover_oportunidade(uuid, public.crm_etapa) from public;
revoke execute on function public.crm_mover_oportunidade(uuid, public.crm_etapa) from anon;
grant execute on function public.crm_mover_oportunidade(uuid, public.crm_etapa) to authenticated;
