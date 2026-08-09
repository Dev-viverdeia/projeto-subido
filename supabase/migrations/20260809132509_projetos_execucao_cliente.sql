-- =============================================================================
-- PROJETOS EM EXECUÇÃO
--
-- O Projeto do catálogo ensina o método; esta estrutura registra a entrega real
-- de um cliente. A Sala de Entrega nasce somente de uma proposta aceita e
-- preserva o documento apresentado como snapshot. Cada tarefa guarda o critério
-- de conclusão, o entregável e a evidência do trabalho.
-- =============================================================================

begin;

create type public.projeto_execucao_status as enum (
  'planejamento',
  'em_execucao',
  'em_validacao',
  'concluido',
  'pausado'
);

create type public.projeto_tarefa_status as enum (
  'pendente',
  'em_andamento',
  'concluida',
  'bloqueada'
);

create table public.projetos_execucao (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  proposta_id uuid not null,
  empresa_id uuid not null,
  oportunidade_id uuid not null,
  projeto_id uuid references public.solucoes (id) on delete set null,
  builder_solucao_id uuid references public.builder_solucoes (id) on delete set null,
  titulo text not null,
  documento jsonb not null,
  status public.projeto_execucao_status not null default 'planejamento',
  inicio_em timestamptz not null default now(),
  prazo_em timestamptz,
  concluido_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint projetos_execucao_titulo_tamanho
    check (char_length(btrim(titulo)) between 3 and 180),
  constraint projetos_execucao_documento_objeto
    check (jsonb_typeof(documento) = 'object'),
  constraint projetos_execucao_documento_tamanho
    check (octet_length(documento::text) <= 250000),
  constraint projetos_execucao_origem_unica
    check (num_nonnulls(projeto_id, builder_solucao_id) <= 1),
  constraint projetos_execucao_proposta_fk
    foreign key (dono, proposta_id)
    references public.propostas (dono, id)
    on delete cascade,
  constraint projetos_execucao_oportunidade_fk
    foreign key (dono, empresa_id, oportunidade_id)
    references public.crm_oportunidades (dono, empresa_id, id)
    on delete cascade,
  unique (proposta_id),
  unique (dono, id)
);

comment on table public.projetos_execucao is
  'Entregas reais dos clientes, iniciadas a partir de propostas aceitas e isoladas por dono.';
comment on column public.projetos_execucao.documento is
  'Snapshot da proposta aceita que originou a entrega. Não acompanha edições futuras da proposta.';

create table public.projeto_tarefas (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  projeto_execucao_id uuid not null,
  fase_id text not null,
  fase_titulo text not null,
  passo_id text not null,
  titulo text not null,
  acao text not null,
  concluido_quando text not null,
  entregavel text not null,
  ordem integer not null,
  status public.projeto_tarefa_status not null default 'pendente',
  evidencia text,
  evidencia_em timestamptz,
  concluida_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint projeto_tarefas_projeto_fk
    foreign key (dono, projeto_execucao_id)
    references public.projetos_execucao (dono, id)
    on delete cascade,
  constraint projeto_tarefas_fase_id_tamanho
    check (char_length(btrim(fase_id)) between 1 and 120),
  constraint projeto_tarefas_fase_titulo_tamanho
    check (char_length(btrim(fase_titulo)) between 2 and 160),
  constraint projeto_tarefas_passo_id_tamanho
    check (char_length(btrim(passo_id)) between 1 and 160),
  constraint projeto_tarefas_titulo_tamanho
    check (char_length(btrim(titulo)) between 2 and 220),
  constraint projeto_tarefas_acao_tamanho
    check (char_length(btrim(acao)) between 5 and 5000),
  constraint projeto_tarefas_conclusao_tamanho
    check (char_length(btrim(concluido_quando)) between 5 and 2000),
  constraint projeto_tarefas_entregavel_tamanho
    check (char_length(btrim(entregavel)) between 2 and 1000),
  constraint projeto_tarefas_evidencia_tamanho
    check (evidencia is null or char_length(evidencia) <= 10000),
  unique (projeto_execucao_id, passo_id)
);

comment on table public.projeto_tarefas is
  'Checklist operacional da entrega. Evidência é texto ou link informado pelo profissional, nunca conclusão presumida pela IA.';

create index projetos_execucao_dono_status_idx
  on public.projetos_execucao (dono, status, atualizado_em desc);
create index projetos_execucao_oportunidade_idx
  on public.projetos_execucao (dono, oportunidade_id, atualizado_em desc);
create index projeto_tarefas_sala_idx
  on public.projeto_tarefas (dono, projeto_execucao_id, ordem);
create index projeto_tarefas_pendentes_idx
  on public.projeto_tarefas (dono, projeto_execucao_id, status, ordem);

create trigger projetos_execucao_atualizado_em
  before update on public.projetos_execucao
  for each row execute function private.tocar_atualizado_em();

create function private.projeto_tarefa_preparar_estado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.concluida_em := case when new.status = 'concluida' then now() else null end;
  end if;

  if new.evidencia is distinct from old.evidencia then
    new.evidencia := nullif(btrim(coalesce(new.evidencia, '')), '');
    new.evidencia_em := case when new.evidencia is null then null else now() end;
  end if;

  return new;
end;
$$;

revoke execute on function private.projeto_tarefa_preparar_estado() from public;
revoke execute on function private.projeto_tarefa_preparar_estado() from authenticated;

create trigger projeto_tarefas_preparar_estado
  before update of status, evidencia on public.projeto_tarefas
  for each row execute function private.projeto_tarefa_preparar_estado();

create trigger projeto_tarefas_atualizado_em
  before update on public.projeto_tarefas
  for each row execute function private.tocar_atualizado_em();

create function private.projeto_sincronizar_progresso()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
  v_concluidas integer;
begin
  select count(*)::integer,
         count(*) filter (where status = 'concluida')::integer
  into v_total, v_concluidas
  from public.projeto_tarefas
  where projeto_execucao_id = new.projeto_execucao_id
    and dono = new.dono;

  update public.projetos_execucao
  set status = case
        when v_total > 0 and v_concluidas = v_total then 'concluido'::public.projeto_execucao_status
        when status in ('planejamento', 'concluido') then 'em_execucao'::public.projeto_execucao_status
        else status
      end,
      concluido_em = case
        when v_total > 0 and v_concluidas = v_total then coalesce(concluido_em, now())
        else null
      end
  where id = new.projeto_execucao_id and dono = new.dono;

  return new;
end;
$$;

revoke execute on function private.projeto_sincronizar_progresso() from public;
revoke execute on function private.projeto_sincronizar_progresso() from authenticated;

create trigger projeto_tarefas_sincronizar_progresso
  after update of status on public.projeto_tarefas
  for each row
  when (old.status is distinct from new.status)
  execute function private.projeto_sincronizar_progresso();

alter table public.projetos_execucao enable row level security;
alter table public.projeto_tarefas enable row level security;

create policy projetos_execucao_select on public.projetos_execucao
  for select to authenticated using (dono = (select auth.uid()));
create policy projetos_execucao_insert on public.projetos_execucao
  for insert to authenticated with check (dono = (select auth.uid()));
create policy projetos_execucao_update on public.projetos_execucao
  for update to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));
create policy projetos_execucao_delete on public.projetos_execucao
  for delete to authenticated using (dono = (select auth.uid()));

create policy projeto_tarefas_select on public.projeto_tarefas
  for select to authenticated using (dono = (select auth.uid()));
create policy projeto_tarefas_insert on public.projeto_tarefas
  for insert to authenticated with check (dono = (select auth.uid()));
create policy projeto_tarefas_update on public.projeto_tarefas
  for update to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));
create policy projeto_tarefas_delete on public.projeto_tarefas
  for delete to authenticated using (dono = (select auth.uid()));

revoke all on table public.projetos_execucao from anon;
revoke all on table public.projetos_execucao from authenticated;
revoke all on table public.projeto_tarefas from anon;
revoke all on table public.projeto_tarefas from authenticated;
grant select, insert, update, delete on table public.projetos_execucao to authenticated;
grant select, insert, update, delete on table public.projeto_tarefas to authenticated;

-- Uma única RPC transforma a proposta aceita e o roteiro em uma sala pronta.
-- SECURITY INVOKER é intencional: selects, inserts e RLS usam o usuário real.
create function public.projeto_iniciar(p_proposta_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
  v_proposta public.propostas%rowtype;
  v_execucao_id uuid;
begin
  if v_dono is null then
    raise exception 'autenticacao_necessaria' using errcode = '28000';
  end if;

  select * into v_proposta
  from public.propostas
  where id = p_proposta_id and dono = v_dono;

  if not found then
    raise exception 'proposta_nao_encontrada' using errcode = 'P0002';
  end if;

  if v_proposta.status <> 'aceita' then
    raise exception 'proposta_precisa_estar_aceita' using errcode = '22023';
  end if;

  insert into public.projetos_execucao (
    dono, proposta_id, empresa_id, oportunidade_id,
    projeto_id, builder_solucao_id, titulo, documento
  ) values (
    v_dono,
    v_proposta.id,
    v_proposta.empresa_id,
    v_proposta.oportunidade_id,
    v_proposta.projeto_id,
    v_proposta.builder_solucao_id,
    coalesce(nullif(v_proposta.documento #>> '{projeto,titulo}', ''), v_proposta.titulo),
    v_proposta.documento
  )
  on conflict (proposta_id) do nothing
  returning id into v_execucao_id;

  if v_execucao_id is null then
    select id into v_execucao_id
    from public.projetos_execucao
    where proposta_id = v_proposta.id and dono = v_dono;
    return v_execucao_id;
  end if;

  if v_proposta.projeto_id is not null then
    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    )
    select
      v_dono,
      v_execucao_id,
      fase.item ->> 'id',
      fase.item ->> 'titulo',
      (fase.item ->> 'id') || ':' || (passo.item ->> 'id'),
      passo.item ->> 'titulo',
      passo.item ->> 'acao',
      passo.item ->> 'concluidoQuando',
      passo.item ->> 'entregavel',
      ((fase.posicao - 1) * 1000 + passo.posicao)::integer
    from public.projeto_roteiros roteiro
    cross join lateral jsonb_array_elements(roteiro.roteiro -> 'fases')
      with ordinality as fase(item, posicao)
    cross join lateral jsonb_array_elements(fase.item -> 'passos')
      with ordinality as passo(item, posicao)
    where roteiro.solucao_id = v_proposta.projeto_id;
  end if;

  -- Projetos personalizados e propostas sem base recebem um roteiro mínimo a
  -- partir do escopo e dos entregáveis que o cliente efetivamente aprovou.
  if not exists (
    select 1 from public.projeto_tarefas where projeto_execucao_id = v_execucao_id
  ) then
    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    ) values (
      v_dono, v_execucao_id, 'preparar', 'Preparar', 'confirmar-contexto',
      'Confirmar escopo, responsáveis e acessos',
      'Revise com o cliente o objetivo aprovado, nomeie os responsáveis e registre os acessos necessários antes de construir.',
      'Escopo, responsáveis, acessos e data de início estão confirmados.',
      'Checklist de kick-off aprovado.',
      1
    );

    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    )
    select
      v_dono,
      v_execucao_id,
      'construir',
      'Construir',
      'escopo-' || item.posicao::text,
      item.valor ->> 'titulo',
      item.valor ->> 'descricao',
      'O item foi construído, testado pelo profissional e está pronto para validação do cliente.',
      item.valor ->> 'titulo',
      (1000 + item.posicao)::integer
    from jsonb_array_elements(v_proposta.documento -> 'escopo')
      with ordinality as item(valor, posicao);

    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    ) values (
      v_dono, v_execucao_id, 'validar', 'Validar', 'validar-cliente',
      'Validar a operação com o cliente',
      'Conduza os testes com situações reais, registre ajustes e peça um aceite explícito antes da publicação final.',
      'O cliente concluiu os cenários combinados e aprovou os ajustes registrados.',
      'Aceite de validação do cliente.',
      2001
    );

    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    )
    select
      v_dono,
      v_execucao_id,
      'entregar',
      'Entregar',
      'entregavel-' || item.posicao::text,
      'Entregar ' || (item.valor #>> '{}'),
      'Organize a versão final, registre onde ela está e apresente ao responsável pela operação.',
      'O cliente recebeu, sabe acessar e existe um responsável pela continuidade.',
      item.valor #>> '{}',
      (3000 + item.posicao)::integer
    from jsonb_array_elements(v_proposta.documento -> 'entregaveis')
      with ordinality as item(valor, posicao);
  end if;

  return v_execucao_id;
end;
$$;

revoke all on function public.projeto_iniciar(uuid) from public;
revoke all on function public.projeto_iniciar(uuid) from anon;
grant execute on function public.projeto_iniciar(uuid) to authenticated;

-- Começar e concluir uma entrega são fatos do relacionamento, não apenas um
-- estado visual da Sala. O trigger grava isso no CRM e marca o negócio ganho.
create function private.projeto_execucao_registrar_fato()
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
    v_tipo := 'projeto_iniciado';
    v_titulo := 'Entrega do projeto iniciada';
  elsif new.status = 'concluido' and old.status <> 'concluido' then
    v_tipo := 'projeto_concluido';
    v_titulo := 'Projeto entregue ao cliente';
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
      'projeto_execucao_id', new.id,
      'proposta_id', new.proposta_id,
      'status', new.status
    ),
    'projetos',
    new.id::text
  from public.crm_oportunidades o
  where o.id = new.oportunidade_id and o.dono = new.dono;

  if tg_op = 'INSERT' then
    update public.crm_oportunidades
    set etapa = 'ganho',
        ganha_em = coalesce(ganha_em, now()),
        ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
    where id = new.oportunidade_id
      and dono = new.dono
      and etapa <> 'perdido';
  end if;

  return new;
end;
$$;

revoke execute on function private.projeto_execucao_registrar_fato() from public;
revoke execute on function private.projeto_execucao_registrar_fato() from authenticated;

create trigger projetos_execucao_fato_inicio
  after insert on public.projetos_execucao
  for each row execute function private.projeto_execucao_registrar_fato();
create trigger projetos_execucao_fato_conclusao
  after update of status on public.projetos_execucao
  for each row
  when (old.status is distinct from new.status)
  execute function private.projeto_execucao_registrar_fato();

commit;
