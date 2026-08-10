-- =============================================================================
-- CICLO DE VIDA DAS AÇÕES DO SOBRAL AI
--
-- A confirmação deixa de ser um recibo estático: a própria conversa pode
-- concluir, remarcar ou substituir a ação. Cada movimento gera um evento
-- imutável e uma conversa antiga nunca sobrescreve uma ação mais recente.
-- =============================================================================

begin;

alter table public.sobral_acoes_crm
  add column status text not null default 'pendente',
  add column concluida_em timestamptz,
  add constraint sobral_acoes_crm_status_valido
    check (status in ('pendente', 'concluida')),
  add constraint sobral_acoes_crm_conclusao_consistente
    check (
      (status = 'pendente' and concluida_em is null)
      or (status = 'concluida' and concluida_em is not null)
    );

create table public.sobral_acoes_crm_eventos (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid not null,
  dono uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  acao_anterior text,
  acao_nova text not null,
  quando_anterior timestamptz,
  quando_novo timestamptz,
  criado_em timestamptz not null default now(),

  constraint sobral_acoes_crm_eventos_acao_tamanho
    check (
      (acao_anterior is null or char_length(btrim(acao_anterior)) between 3 and 500)
      and char_length(btrim(acao_nova)) between 3 and 500
    ),
  constraint sobral_acoes_crm_eventos_tipo_valido
    check (tipo in ('confirmada', 'remarcada', 'substituida', 'concluida')),
  constraint sobral_acoes_crm_eventos_acao_fk
    foreign key (dono, mensagem_id)
    references public.sobral_acoes_crm (dono, mensagem_id)
    on delete cascade
);

comment on table public.sobral_acoes_crm_eventos is
  'Histórico imutável das confirmações, remarcações, substituições e conclusões feitas na conversa do Sobral AI.';

create index sobral_acoes_crm_eventos_mensagem_idx
  on public.sobral_acoes_crm_eventos (mensagem_id, criado_em desc);
create index sobral_acoes_crm_eventos_dono_idx
  on public.sobral_acoes_crm_eventos (dono, criado_em desc);
create unique index sobral_acoes_crm_eventos_confirmacao_unica_idx
  on public.sobral_acoes_crm_eventos (mensagem_id)
  where tipo = 'confirmada';

alter table public.sobral_acoes_crm_eventos enable row level security;

create policy sobral_acoes_crm_eventos_select on public.sobral_acoes_crm_eventos
  for select to authenticated
  using (dono = (select auth.uid()));

create policy sobral_acoes_crm_eventos_insert on public.sobral_acoes_crm_eventos
  for insert to authenticated
  with check (
    sobral_acoes_crm_eventos.dono = (select auth.uid())
    and exists (
      select 1
      from public.sobral_acoes_crm acao
      where acao.mensagem_id = sobral_acoes_crm_eventos.mensagem_id
        and acao.dono = (select auth.uid())
    )
  );

revoke all on table public.sobral_acoes_crm_eventos from anon;
revoke all on table public.sobral_acoes_crm_eventos from authenticated;
grant select, insert on table public.sobral_acoes_crm_eventos to authenticated;

insert into public.sobral_acoes_crm_eventos (
  mensagem_id,
  dono,
  tipo,
  acao_anterior,
  acao_nova,
  quando_anterior,
  quando_novo,
  criado_em
)
select
  acao.mensagem_id,
  acao.dono,
  'confirmada',
  null,
  acao.acao,
  null,
  acao.quando,
  acao.confirmada_em
from public.sobral_acoes_crm acao
on conflict do nothing;

create or replace function public.sobral_confirmar_acao_crm(
  p_mensagem uuid,
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
  v_oportunidade_texto text;
  v_oportunidade uuid;
  v_empresa uuid;
  v_projeto uuid;
  v_acao text := btrim(coalesce(p_acao, ''));
  v_inseridas integer;
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

  select mensagem.direcao #>> '{contexto_acao,oportunidade_id}'
  into v_oportunidade_texto
  from public.consultor_mensagens mensagem
  join public.consultor_threads thread on thread.id = mensagem.thread_id
  where mensagem.id = p_mensagem
    and mensagem.papel = 'consultor'
    and thread.dono = v_dono;

  if not found
    or v_oportunidade_texto is null
    or v_oportunidade_texto !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return false;
  end if;

  v_oportunidade := v_oportunidade_texto::uuid;

  select empresa_id
  into v_empresa
  from public.crm_oportunidades
  where id = v_oportunidade
    and dono = v_dono
    and etapa not in ('ganho', 'perdido')
  for update;

  if not found then
    return false;
  end if;

  insert into public.sobral_acoes_crm (
    mensagem_id, dono, oportunidade_id, acao, quando, status, concluida_em
  ) values (
    p_mensagem, v_dono, v_oportunidade, v_acao, p_quando, 'pendente', null
  )
  on conflict (mensagem_id) do nothing;

  get diagnostics v_inseridas = row_count;
  if v_inseridas = 0 then
    return false;
  end if;

  update public.crm_oportunidades
  set
    proxima_acao = v_acao,
    proxima_acao_em = p_quando,
    ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
  where id = v_oportunidade
    and dono = v_dono;

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
    reuniao_id, titulo, prazo_em, status, origem, categoria, chave_origem
  ) values (
    v_dono, v_empresa, v_oportunidade, v_projeto,
    null, v_acao, p_quando, 'pendente', 'crm', 'proxima_acao', 'principal'
  )
  on conflict (dono, oportunidade_id, origem)
    where origem = 'crm' and reuniao_id is null
  do update set
    titulo = excluded.titulo,
    prazo_em = excluded.prazo_em,
    status = 'pendente',
    categoria = 'proxima_acao',
    chave_origem = 'principal',
    projeto_execucao_id = coalesce(
      excluded.projeto_execucao_id,
      public.projeto_acoes.projeto_execucao_id
    );

  insert into public.sobral_acoes_crm_eventos (
    mensagem_id, dono, tipo, acao_anterior, acao_nova,
    quando_anterior, quando_novo
  ) values (
    p_mensagem, v_dono, 'confirmada', null, v_acao, null, p_quando
  )
  on conflict do nothing;

  return true;
end;
$$;

comment on function public.sobral_confirmar_acao_crm(uuid, text, timestamptz) is
  'Confirma uma única vez a orientação revisada no CRM, no Plano Vivo e no histórico da conversa.';

create function public.sobral_gerenciar_acao_crm(
  p_mensagem uuid,
  p_operacao text,
  p_acao text default null,
  p_quando timestamptz default null
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_oportunidade uuid;
  v_empresa uuid;
  v_projeto uuid;
  v_acao_anterior text;
  v_quando_anterior timestamptz;
  v_status text;
  v_acao_atual text;
  v_quando_atual timestamptz;
  v_acao_nova text;
  v_quando_novo timestamptz;
  v_tipo text;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if p_operacao is null or p_operacao not in ('concluir', 'remarcar', 'substituir') then
    raise exception 'operacao_invalida' using errcode = '22023';
  end if;

  select acao.oportunidade_id, acao.acao, acao.quando, acao.status
  into v_oportunidade, v_acao_anterior, v_quando_anterior, v_status
  from public.sobral_acoes_crm acao
  where acao.mensagem_id = p_mensagem
    and acao.dono = v_dono
  for update;

  if not found then
    return 'nao_encontrada';
  end if;
  if v_status = 'concluida' then
    return 'ja_concluida';
  end if;

  select oportunidade.empresa_id, oportunidade.proxima_acao, oportunidade.proxima_acao_em
  into v_empresa, v_acao_atual, v_quando_atual
  from public.crm_oportunidades oportunidade
  where oportunidade.id = v_oportunidade
    and oportunidade.dono = v_dono
    and oportunidade.etapa not in ('ganho', 'perdido')
  for update;

  if not found then
    return 'indisponivel';
  end if;
  if v_acao_atual is distinct from v_acao_anterior
    or v_quando_atual is distinct from v_quando_anterior
  then
    return 'desatualizada';
  end if;

  if p_operacao = 'concluir' then
    update public.crm_oportunidades
    set
      proxima_acao = null,
      proxima_acao_em = null,
      ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
    where id = v_oportunidade
      and dono = v_dono;

    update public.projeto_acoes
    set status = 'concluida'
    where dono = v_dono
      and oportunidade_id = v_oportunidade
      and origem = 'crm'
      and reuniao_id is null
      and status = 'pendente'
      and titulo = v_acao_anterior
      and prazo_em is not distinct from v_quando_anterior;

    update public.sobral_acoes_crm
    set status = 'concluida', concluida_em = now()
    where mensagem_id = p_mensagem
      and dono = v_dono;

    insert into public.sobral_acoes_crm_eventos (
      mensagem_id, dono, tipo, acao_anterior, acao_nova,
      quando_anterior, quando_novo
    ) values (
      p_mensagem, v_dono, 'concluida', v_acao_anterior, v_acao_anterior,
      v_quando_anterior, v_quando_anterior
    );

    return 'concluida';
  end if;

  if p_operacao = 'remarcar' then
    if p_quando is null then
      raise exception 'data_necessaria' using errcode = '22023';
    end if;
    v_acao_nova := v_acao_anterior;
    v_quando_novo := p_quando;
    v_tipo := 'remarcada';
  else
    v_acao_nova := btrim(coalesce(p_acao, ''));
    if char_length(v_acao_nova) not between 3 and 500 then
      raise exception 'acao_invalida' using errcode = '22023';
    end if;
    v_quando_novo := p_quando;
    v_tipo := 'substituida';
  end if;

  if v_quando_novo is not null and (
    v_quando_novo < date_trunc('day', now())
    or v_quando_novo > now() + interval '2 years'
  ) then
    raise exception 'data_invalida' using errcode = '22023';
  end if;

  if v_acao_nova is not distinct from v_acao_anterior
    and v_quando_novo is not distinct from v_quando_anterior
  then
    return 'sem_alteracao';
  end if;

  update public.crm_oportunidades
  set
    proxima_acao = v_acao_nova,
    proxima_acao_em = v_quando_novo,
    ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
  where id = v_oportunidade
    and dono = v_dono;

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
    reuniao_id, titulo, prazo_em, status, origem, categoria, chave_origem
  ) values (
    v_dono, v_empresa, v_oportunidade, v_projeto,
    null, v_acao_nova, v_quando_novo, 'pendente', 'crm', 'proxima_acao', 'principal'
  )
  on conflict (dono, oportunidade_id, origem)
    where origem = 'crm' and reuniao_id is null
  do update set
    titulo = excluded.titulo,
    prazo_em = excluded.prazo_em,
    status = 'pendente',
    categoria = 'proxima_acao',
    chave_origem = 'principal',
    projeto_execucao_id = coalesce(
      excluded.projeto_execucao_id,
      public.projeto_acoes.projeto_execucao_id
    );

  update public.sobral_acoes_crm
  set acao = v_acao_nova, quando = v_quando_novo
  where mensagem_id = p_mensagem
    and dono = v_dono;

  insert into public.sobral_acoes_crm_eventos (
    mensagem_id, dono, tipo, acao_anterior, acao_nova,
    quando_anterior, quando_novo
  ) values (
    p_mensagem, v_dono, v_tipo, v_acao_anterior, v_acao_nova,
    v_quando_anterior, v_quando_novo
  );

  return v_tipo;
end;
$$;

comment on function public.sobral_gerenciar_acao_crm(uuid, text, text, timestamptz) is
  'Conclui, remarca ou substitui uma ação confirmada somente se ela ainda for a ação atual do CRM.';

revoke execute on function public.sobral_gerenciar_acao_crm(uuid, text, text, timestamptz)
  from public;
revoke execute on function public.sobral_gerenciar_acao_crm(uuid, text, text, timestamptz)
  from anon;
grant execute on function public.sobral_gerenciar_acao_crm(uuid, text, text, timestamptz)
  to authenticated;

commit;
