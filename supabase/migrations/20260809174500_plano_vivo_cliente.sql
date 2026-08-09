-- =============================================================================
-- PLANO VIVO DO CLIENTE
--
-- Uma decisão confirmada no pós-call deixa de ser apenas o campo atual do CRM:
-- ela vira um compromisso rastreável da jornada. Antes da venda, acompanha a
-- oportunidade. Depois de uma proposta aceita, entra automaticamente na Sala de
-- Entrega sem antecipar a abertura do projeto.
-- =============================================================================

begin;

create type public.projeto_acao_status as enum (
  'pendente',
  'concluida',
  'cancelada'
);

create table public.projeto_acoes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  oportunidade_id uuid not null,
  projeto_execucao_id uuid,
  reuniao_id uuid,
  titulo text not null,
  prazo_em timestamptz,
  status public.projeto_acao_status not null default 'pendente',
  origem text not null default 'call',
  concluida_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint projeto_acoes_titulo_tamanho
    check (char_length(btrim(titulo)) between 3 and 500),
  constraint projeto_acoes_origem_valida
    check (origem in ('call', 'crm', 'manual')),
  constraint projeto_acoes_oportunidade_fk
    foreign key (dono, empresa_id, oportunidade_id)
    references public.crm_oportunidades (dono, empresa_id, id)
    on delete cascade,
  constraint projeto_acoes_execucao_fk
    foreign key (dono, projeto_execucao_id)
    references public.projetos_execucao (dono, id)
    on delete cascade,
  constraint projeto_acoes_reuniao_fk
    foreign key (dono, reuniao_id)
    references public.calls_reunioes (dono, id)
    on delete cascade,
  unique (dono, id)
);

comment on table public.projeto_acoes is
  'Compromissos confirmados da jornada do cliente. Podem nascer na venda e acompanhar a entrega real depois da proposta aceita.';
comment on column public.projeto_acoes.projeto_execucao_id is
  'Permanece nulo antes da venda. Uma Sala de Entrega aceita vincula automaticamente as ações pendentes da oportunidade.';

create unique index projeto_acoes_reuniao_unica_idx
  on public.projeto_acoes (dono, reuniao_id)
  where reuniao_id is not null;
create index projeto_acoes_oportunidade_abertas_idx
  on public.projeto_acoes (dono, oportunidade_id, status, prazo_em, atualizado_em desc);
create index projeto_acoes_execucao_abertas_idx
  on public.projeto_acoes (dono, projeto_execucao_id, status, prazo_em, atualizado_em desc);

create function private.projeto_acao_preparar_estado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.concluida_em := case when new.status = 'concluida' then now() else null end;
  end if;
  return new;
end;
$$;

revoke execute on function private.projeto_acao_preparar_estado() from public;
revoke execute on function private.projeto_acao_preparar_estado() from authenticated;

create trigger projeto_acoes_preparar_estado
  before update of status on public.projeto_acoes
  for each row execute function private.projeto_acao_preparar_estado();

create trigger projeto_acoes_atualizado_em
  before update on public.projeto_acoes
  for each row execute function private.tocar_atualizado_em();

alter table public.projeto_acoes enable row level security;

create policy projeto_acoes_select on public.projeto_acoes
  for select to authenticated using (dono = (select auth.uid()));
create policy projeto_acoes_insert on public.projeto_acoes
  for insert to authenticated with check (dono = (select auth.uid()));
create policy projeto_acoes_update on public.projeto_acoes
  for update to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));
create policy projeto_acoes_delete on public.projeto_acoes
  for delete to authenticated using (dono = (select auth.uid()));

revoke all on table public.projeto_acoes from anon;
revoke all on table public.projeto_acoes from authenticated;
grant select, insert, update, delete on table public.projeto_acoes to authenticated;

-- A mesma confirmação mantém o estado atual no CRM e atualiza o compromisso
-- rastreável da call. O upsert torna reenvios idempotentes.
create or replace function public.calls_aplicar_proxima_acao(
  p_reuniao uuid,
  p_acao text,
  p_quando timestamptz default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_oportunidade uuid;
  v_empresa uuid;
  v_projeto uuid;
  v_acao text := btrim(coalesce(p_acao, ''));
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if char_length(v_acao) not between 3 and 500 then
    raise exception 'acao_invalida' using errcode = '22023';
  end if;
  if p_quando is not null and (
    p_quando < date_trunc('day', now())
    or p_quando > now() + interval '2 years'
  ) then
    raise exception 'data_invalida' using errcode = '22023';
  end if;

  select oportunidade_id, empresa_id
  into v_oportunidade, v_empresa
  from public.calls_reunioes
  where id = p_reuniao and dono = v_dono;

  if not found then
    return false;
  end if;

  update public.crm_oportunidades
  set
    proxima_acao = v_acao,
    proxima_acao_em = p_quando,
    ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
  where id = v_oportunidade
    and dono = v_dono
    and (
      proxima_acao is distinct from v_acao
      or proxima_acao_em is distinct from p_quando
    );

  select id
  into v_projeto
  from public.projetos_execucao
  where dono = v_dono
    and oportunidade_id = v_oportunidade
    and status <> 'concluido'
  order by atualizado_em desc
  limit 1;

  insert into public.projeto_acoes (
    dono, empresa_id, oportunidade_id, projeto_execucao_id,
    reuniao_id, titulo, prazo_em, status, origem
  ) values (
    v_dono, v_empresa, v_oportunidade, v_projeto,
    p_reuniao, v_acao, p_quando, 'pendente', 'call'
  )
  on conflict (dono, reuniao_id) where reuniao_id is not null
  do update set
    titulo = excluded.titulo,
    prazo_em = excluded.prazo_em,
    status = 'pendente',
    projeto_execucao_id = coalesce(
      excluded.projeto_execucao_id,
      public.projeto_acoes.projeto_execucao_id
    );

  return true;
end;
$$;

comment on function public.calls_aplicar_proxima_acao(uuid, text, timestamptz) is
  'Confirma a próxima ação no CRM e a mantém como compromisso rastreável do plano do cliente.';

revoke execute on function public.calls_aplicar_proxima_acao(uuid, text, timestamptz) from public;
revoke execute on function public.calls_aplicar_proxima_acao(uuid, text, timestamptz) from anon;
grant execute on function public.calls_aplicar_proxima_acao(uuid, text, timestamptz) to authenticated;

-- A Sala nasce somente depois da proposta aceita. Ao nascer, recolhe os
-- compromissos comerciais ainda abertos daquela oportunidade.
create function private.projeto_acoes_vincular_execucao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.projeto_acoes
  set projeto_execucao_id = new.id
  where dono = new.dono
    and oportunidade_id = new.oportunidade_id
    and projeto_execucao_id is null
    and status = 'pendente';
  return new;
end;
$$;

revoke execute on function private.projeto_acoes_vincular_execucao() from public;
revoke execute on function private.projeto_acoes_vincular_execucao() from authenticated;

create trigger projeto_execucao_vincular_acoes
  after insert on public.projetos_execucao
  for each row execute function private.projeto_acoes_vincular_execucao();

commit;
