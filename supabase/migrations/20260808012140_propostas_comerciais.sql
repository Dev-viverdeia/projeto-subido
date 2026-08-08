-- =============================================================================
-- PROPOSTAS COMERCIAIS
--
-- A proposta é um documento versionado e privado do profissional. Ela nasce de
-- uma oportunidade do CRM e pode usar como base um Projeto do catálogo OU um
-- projeto personalizado do Estúdio. O JSONB é o retrato apresentado ao cliente:
-- se CRM, Projeto ou Estúdio mudarem depois, a proposta antiga não muda junto.
-- =============================================================================

create type public.proposta_status as enum (
  'rascunho',
  'pronta',
  'apresentada',
  'aceita',
  'recusada'
);

create table public.propostas (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  oportunidade_id uuid not null,
  projeto_id uuid references public.solucoes (id) on delete set null,
  builder_solucao_id uuid references public.builder_solucoes (id) on delete set null,
  titulo text not null,
  documento jsonb not null,
  status public.proposta_status not null default 'rascunho',
  versao integer not null default 1,
  apresentada_em timestamptz,
  aceita_em timestamptz,
  recusada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint propostas_titulo_tamanho
    check (char_length(btrim(titulo)) between 3 and 180),
  constraint propostas_documento_objeto
    check (jsonb_typeof(documento) = 'object'),
  constraint propostas_documento_tamanho
    check (octet_length(documento::text) <= 250000),
  constraint propostas_versao_positiva check (versao > 0),
  constraint propostas_origem_unica
    check (num_nonnulls(projeto_id, builder_solucao_id) <= 1),
  constraint propostas_oportunidade_fk
    foreign key (dono, empresa_id, oportunidade_id)
    references public.crm_oportunidades (dono, empresa_id, id)
    on delete cascade,
  unique (dono, id)
);

comment on table public.propostas is
  'Propostas comerciais privadas, versionadas e ligadas a uma oportunidade factual do CRM.';
comment on column public.propostas.documento is
  'Snapshot completo da proposta na forma validada por src/lib/propostas/schema.ts.';

create index propostas_dono_atualizado_idx
  on public.propostas (dono, atualizado_em desc);
create index propostas_oportunidade_idx
  on public.propostas (dono, empresa_id, oportunidade_id, atualizado_em desc);
create index propostas_projeto_fk_idx
  on public.propostas (projeto_id) where projeto_id is not null;
create index propostas_builder_fk_idx
  on public.propostas (builder_solucao_id) where builder_solucao_id is not null;

-- O vínculo com o Estúdio precisa respeitar o mesmo dono. A FK simples garante
-- existência e o trigger impede um UUID de outra conta, mesmo que seja adivinhado.
create function private.proposta_validar_vinculos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
    new.dono is distinct from old.dono
    or new.empresa_id is distinct from old.empresa_id
    or new.oportunidade_id is distinct from old.oportunidade_id
  ) then
    raise exception 'identidade_da_proposta_imutavel' using errcode = '22023';
  end if;

  if new.projeto_id is not null
    and (tg_op = 'INSERT' or new.projeto_id is distinct from old.projeto_id)
    and not exists (
      select 1 from public.solucoes s
      where s.id = new.projeto_id and s.status = 'publicado'
    )
  then
    raise exception 'projeto_indisponivel' using errcode = '22023';
  end if;

  if new.builder_solucao_id is not null
    and (tg_op = 'INSERT' or new.builder_solucao_id is distinct from old.builder_solucao_id)
    and not exists (
      select 1 from public.builder_solucoes b
      where b.id = new.builder_solucao_id
        and b.dono = new.dono
        and b.status = 'pronta'
    )
  then
    raise exception 'projeto_personalizado_indisponivel' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke execute on function private.proposta_validar_vinculos() from public;
revoke execute on function private.proposta_validar_vinculos() from authenticated;

create trigger propostas_validar_vinculos
  before insert or update of dono, empresa_id, oportunidade_id, projeto_id, builder_solucao_id
  on public.propostas
  for each row execute function private.proposta_validar_vinculos();

-- Cada salvamento explícito produz uma versão. Editar algo que já foi
-- apresentado reabre como rascunho: o PDF novo nunca se passa pela versão que o
-- cliente viu, e o histórico anterior continua na linha do tempo do CRM.
create function private.proposta_versionar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.versao := old.versao + 1;

  if new.documento is distinct from old.documento
    and old.status in ('apresentada', 'aceita', 'recusada')
  then
    new.status := 'rascunho';
  end if;

  if new.status is distinct from old.status then
    if new.status = 'apresentada' then
      new.apresentada_em := now();
    elsif new.status = 'aceita' then
      new.aceita_em := now();
    elsif new.status = 'recusada' then
      new.recusada_em := now();
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function private.proposta_versionar() from public;
revoke execute on function private.proposta_versionar() from authenticated;

create trigger propostas_versionar
  before update on public.propostas
  for each row execute function private.proposta_versionar();

create trigger propostas_atualizado_em
  before update on public.propostas
  for each row execute function private.tocar_atualizado_em();

-- O documento alimenta o CRM sem depender de a interface lembrar de criar o
-- evento. A mudança para a etapa Proposta só acontece quando a pessoa declara
-- que apresentou; criar ou baixar um rascunho não altera o pipeline.
create function private.proposta_registrar_fato()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tipo text;
  v_titulo text;
begin
  if tg_op = 'INSERT' then
    v_tipo := 'proposta_criada';
    v_titulo := 'Proposta comercial criada';
  elsif new.status is distinct from old.status then
    v_tipo := 'proposta_' || new.status::text;
    v_titulo := case new.status
      when 'rascunho' then 'Nova versão da proposta iniciada'
      when 'pronta' then 'Proposta comercial pronta'
      when 'apresentada' then 'Proposta comercial apresentada'
      when 'aceita' then 'Proposta comercial aceita'
      when 'recusada' then 'Proposta comercial recusada'
    end;
  else
    return new;
  end if;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id,
    tipo, titulo, descricao, dados, fonte, fonte_id
  )
  select
    new.dono,
    new.empresa_id,
    o.contato_principal_id,
    new.oportunidade_id,
    v_tipo,
    v_titulo,
    new.titulo,
    jsonb_build_object(
      'proposta_id', new.id,
      'status', new.status,
      'versao', new.versao
    ),
    'propostas',
    new.id::text
  from public.crm_oportunidades o
  where o.id = new.oportunidade_id and o.dono = new.dono;

  if new.status = 'apresentada' then
    update public.crm_oportunidades
    set etapa = 'proposta',
        ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
    where id = new.oportunidade_id
      and dono = new.dono
      and etapa in ('novo_lead', 'qualificacao', 'descoberta');
  end if;

  return new;
end;
$$;

revoke execute on function private.proposta_registrar_fato() from public;
revoke execute on function private.proposta_registrar_fato() from authenticated;

create trigger propostas_fato_criada
  after insert on public.propostas
  for each row execute function private.proposta_registrar_fato();
create trigger propostas_fato_status
  after update on public.propostas
  for each row
  when (old.status is distinct from new.status)
  execute function private.proposta_registrar_fato();

alter table public.propostas enable row level security;

create policy propostas_select on public.propostas
  for select to authenticated using (dono = (select auth.uid()));
create policy propostas_insert on public.propostas
  for insert to authenticated with check (dono = (select auth.uid()));
create policy propostas_update on public.propostas
  for update to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));
create policy propostas_delete on public.propostas
  for delete to authenticated using (dono = (select auth.uid()));

revoke all on public.propostas from anon;
revoke all on public.propostas from authenticated;
grant select, insert, update, delete on public.propostas to authenticated;
