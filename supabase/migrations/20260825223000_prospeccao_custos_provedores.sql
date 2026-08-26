begin;

create table public.prospeccao_custos_provedores (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  dono uuid references auth.users(id) on delete set null,
  lista_id uuid references public.prospeccao_listas(id) on delete set null,
  provedor text not null,
  operacao text not null,
  status text not null default 'concluido',
  unidades numeric(14, 3) not null default 0,
  unidade text not null,
  creditos_provedor numeric(14, 3) not null default 0,
  custo_usd_micros bigint not null default 0,
  latencia_ms integer,
  cache_hit boolean not null default false,
  metadados jsonb not null default '{}'::jsonb,
  constraint prospeccao_custos_provedor_valido
    check (provedor in ('apify', 'firecrawl', 'perplexity', 'serpapi', 'openai')),
  constraint prospeccao_custos_status_valido
    check (status in ('concluido', 'parcial', 'falhou')),
  constraint prospeccao_custos_valores_validos
    check (
      unidades >= 0
      and creditos_provedor >= 0
      and custo_usd_micros >= 0
      and (latencia_ms is null or latencia_ms >= 0)
    )
);

create index prospeccao_custos_provedores_criado_idx
  on public.prospeccao_custos_provedores (criado_em desc);

create index prospeccao_custos_provedores_lista_idx
  on public.prospeccao_custos_provedores (lista_id, criado_em desc)
  where lista_id is not null;

alter table public.prospeccao_custos_provedores enable row level security;

revoke all on table public.prospeccao_custos_provedores from public, anon, authenticated;
grant select, insert on table public.prospeccao_custos_provedores to service_role;

comment on table public.prospeccao_custos_provedores is
  'Ledger interno e imutavel de consumo e custo dos provedores usados na prospeccao.';

comment on column public.prospeccao_custos_provedores.custo_usd_micros is
  'Custo conhecido em milionesimos de dolar. Custos de assinatura por credito permanecem em creditos_provedor e sao simulados no admin.';

commit;
