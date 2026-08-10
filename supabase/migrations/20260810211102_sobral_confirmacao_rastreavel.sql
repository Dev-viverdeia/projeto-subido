-- =============================================================================
-- COMPROVANTE RASTREÁVEL DO SOBRAL AI
--
-- A confirmação deixa de editar a mensagem com privilégio elevado. Ela passa a
-- viver numa tabela própria, protegida por RLS, e toda a operação pode rodar
-- como SECURITY INVOKER com os privilégios normais do usuário autenticado.
-- =============================================================================

begin;

create table public.sobral_acoes_crm (
  mensagem_id uuid primary key references public.consultor_mensagens (id) on delete cascade,
  dono uuid not null references auth.users (id) on delete cascade,
  oportunidade_id uuid not null references public.crm_oportunidades (id) on delete cascade,
  acao text not null,
  quando timestamptz,
  confirmada_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint sobral_acoes_crm_acao_tamanho
    check (char_length(btrim(acao)) between 3 and 500),
  unique (dono, mensagem_id)
);

comment on table public.sobral_acoes_crm is
  'Comprovante da orientação do Sobral AI que o profissional revisou e confirmou no CRM.';
comment on column public.sobral_acoes_crm.mensagem_id is
  'Mantém a confirmação presa à resposta e ao lead que estavam em contexto quando ela foi gerada.';

create index sobral_acoes_crm_dono_confirmada_idx
  on public.sobral_acoes_crm (dono, confirmada_em desc);

create trigger sobral_acoes_crm_atualizado_em
  before update on public.sobral_acoes_crm
  for each row execute function private.tocar_atualizado_em();

alter table public.sobral_acoes_crm enable row level security;

create policy sobral_acoes_crm_select on public.sobral_acoes_crm
  for select to authenticated
  using (dono = (select auth.uid()));

create policy sobral_acoes_crm_insert on public.sobral_acoes_crm
  for insert to authenticated
  with check (
    dono = (select auth.uid())
    and exists (
      select 1
      from public.consultor_mensagens mensagem
      join public.consultor_threads thread on thread.id = mensagem.thread_id
      where mensagem.id = mensagem_id
        and mensagem.papel = 'consultor'
        and thread.dono = (select auth.uid())
        and mensagem.direcao #>> '{contexto_acao,oportunidade_id}' = oportunidade_id::text
    )
  );

create policy sobral_acoes_crm_update on public.sobral_acoes_crm
  for update to authenticated
  using (dono = (select auth.uid()))
  with check (
    dono = (select auth.uid())
    and exists (
      select 1
      from public.consultor_mensagens mensagem
      join public.consultor_threads thread on thread.id = mensagem.thread_id
      where mensagem.id = mensagem_id
        and mensagem.papel = 'consultor'
        and thread.dono = (select auth.uid())
        and mensagem.direcao #>> '{contexto_acao,oportunidade_id}' = oportunidade_id::text
    )
  );

revoke all on table public.sobral_acoes_crm from anon;
revoke all on table public.sobral_acoes_crm from authenticated;
grant select, insert, update on table public.sobral_acoes_crm to authenticated;

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

  insert into public.sobral_acoes_crm (
    mensagem_id, dono, oportunidade_id, acao, quando
  ) values (
    p_mensagem, v_dono, v_oportunidade, v_acao, p_quando
  )
  on conflict (mensagem_id)
  do update set
    acao = excluded.acao,
    quando = excluded.quando,
    confirmada_em = now();

  return true;
end;
$$;

comment on function public.sobral_confirmar_acao_crm(uuid, text, timestamptz) is
  'Confirma como usuário autenticado uma orientação revisada no CRM, no Plano Vivo e no comprovante da conversa.';

commit;
