-- =============================================================================
-- SOBRAL AI · PRÓXIMO PASSO APÓS A CONCLUSÃO
--
-- A recomendação é gerada a partir dos fatos atuais do lead, fica separada do
-- CRM até a revisão humana e só então reabre o ciclo da ação. O comprovante da
-- conversa continua sendo a âncora de ownership e de idempotência.
-- =============================================================================

begin;

create table public.sobral_recomendacoes_crm (
  mensagem_id uuid primary key,
  dono uuid not null references auth.users (id) on delete cascade,
  oportunidade_id uuid not null references public.crm_oportunidades (id) on delete cascade,
  acao text not null,
  motivo text not null,
  fatos jsonb not null default '[]'::jsonb,
  quando timestamptz,
  status text not null default 'pendente',
  modelo text not null,
  resposta_id text,
  contexto_hash text not null,
  gerada_em timestamptz not null default now(),
  confirmada_em timestamptz,
  atualizado_em timestamptz not null default now(),

  constraint sobral_recomendacoes_crm_acao_tamanho
    check (char_length(btrim(acao)) between 3 and 500),
  constraint sobral_recomendacoes_crm_motivo_tamanho
    check (char_length(btrim(motivo)) between 20 and 1200),
  constraint sobral_recomendacoes_crm_fatos_validos
    check (
      jsonb_typeof(fatos) = 'array'
      and jsonb_array_length(fatos) between 1 and 4
      and octet_length(fatos::text) <= 8000
    ),
  constraint sobral_recomendacoes_crm_status_valido
    check (status in ('pendente', 'confirmada')),
  constraint sobral_recomendacoes_crm_confirmacao_consistente
    check (
      (status = 'pendente' and confirmada_em is null)
      or (status = 'confirmada' and confirmada_em is not null)
    ),
  constraint sobral_recomendacoes_crm_modelo_tamanho
    check (char_length(btrim(modelo)) between 2 and 120),
  constraint sobral_recomendacoes_crm_hash_tamanho
    check (char_length(contexto_hash) = 64),
  constraint sobral_recomendacoes_crm_acao_fk
    foreign key (dono, mensagem_id)
    references public.sobral_acoes_crm (dono, mensagem_id)
    on delete cascade,
  unique (dono, mensagem_id)
);

comment on table public.sobral_recomendacoes_crm is
  'Próximo movimento sugerido após uma ação concluída. Só entra no CRM depois da revisão do dono.';

create index sobral_recomendacoes_crm_dono_idx
  on public.sobral_recomendacoes_crm (dono, gerada_em desc);
create index sobral_recomendacoes_crm_oportunidade_fk_idx
  on public.sobral_recomendacoes_crm (oportunidade_id);

create trigger sobral_recomendacoes_crm_atualizado_em
  before update on public.sobral_recomendacoes_crm
  for each row execute function private.tocar_atualizado_em();

alter table public.sobral_recomendacoes_crm enable row level security;

create policy sobral_recomendacoes_crm_select on public.sobral_recomendacoes_crm
  for select to authenticated
  using (dono = (select auth.uid()));

create policy sobral_recomendacoes_crm_insert on public.sobral_recomendacoes_crm
  for insert to authenticated
  with check (
    dono = (select auth.uid())
    and exists (
      select 1
      from public.sobral_acoes_crm acao
      where acao.dono = (select auth.uid())
        and acao.mensagem_id = sobral_recomendacoes_crm.mensagem_id
        and acao.oportunidade_id = sobral_recomendacoes_crm.oportunidade_id
        and acao.status = 'concluida'
    )
  );

create policy sobral_recomendacoes_crm_update on public.sobral_recomendacoes_crm
  for update to authenticated
  using (dono = (select auth.uid()))
  with check (
    dono = (select auth.uid())
    and exists (
      select 1
      from public.sobral_acoes_crm acao
      where acao.dono = (select auth.uid())
        and acao.mensagem_id = sobral_recomendacoes_crm.mensagem_id
        and acao.oportunidade_id = sobral_recomendacoes_crm.oportunidade_id
    )
  );

revoke all on table public.sobral_recomendacoes_crm from anon;
revoke all on table public.sobral_recomendacoes_crm from authenticated;
grant select, insert, update on table public.sobral_recomendacoes_crm to authenticated;

alter table public.sobral_acoes_crm_eventos
  drop constraint sobral_acoes_crm_eventos_tipo_valido,
  add constraint sobral_acoes_crm_eventos_tipo_valido
    check (tipo in ('confirmada', 'remarcada', 'substituida', 'concluida', 'reativada'));

create function public.sobral_confirmar_recomendacao_crm(
  p_mensagem uuid,
  p_acao text,
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
  v_acao_nova text := btrim(coalesce(p_acao, ''));
  v_recomendacao_status text;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if char_length(v_acao_nova) not between 3 and 500 then
    raise exception 'acao_invalida' using errcode = '22023';
  end if;
  if p_quando is not null and (
    p_quando < date_trunc('day', now())
    or p_quando > now() + interval '2 years'
  ) then
    raise exception 'data_invalida' using errcode = '22023';
  end if;

  select acao.oportunidade_id, acao.acao, acao.quando
  into v_oportunidade, v_acao_anterior, v_quando_anterior
  from public.sobral_acoes_crm acao
  where acao.mensagem_id = p_mensagem
    and acao.dono = v_dono
    and acao.status = 'concluida'
  for update;

  if not found then
    return 'indisponivel';
  end if;

  select recomendacao.status
  into v_recomendacao_status
  from public.sobral_recomendacoes_crm recomendacao
  where recomendacao.mensagem_id = p_mensagem
    and recomendacao.dono = v_dono
    and recomendacao.oportunidade_id = v_oportunidade
  for update;

  if not found then
    return 'nao_encontrada';
  end if;
  if v_recomendacao_status = 'confirmada' then
    return 'ja_confirmada';
  end if;

  select oportunidade.empresa_id
  into v_empresa
  from public.crm_oportunidades oportunidade
  where oportunidade.id = v_oportunidade
    and oportunidade.dono = v_dono
    and oportunidade.etapa not in ('ganho', 'perdido')
    and oportunidade.proxima_acao is null
    and oportunidade.proxima_acao_em is null
  for update;

  if not found then
    return 'desatualizada';
  end if;

  update public.crm_oportunidades
  set
    proxima_acao = v_acao_nova,
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
    null, v_acao_nova, p_quando, 'pendente', 'crm', 'proxima_acao', 'principal'
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
  set
    acao = v_acao_nova,
    quando = p_quando,
    status = 'pendente',
    concluida_em = null
  where mensagem_id = p_mensagem
    and dono = v_dono;

  update public.sobral_recomendacoes_crm
  set
    acao = v_acao_nova,
    quando = p_quando,
    status = 'confirmada',
    confirmada_em = now()
  where mensagem_id = p_mensagem
    and dono = v_dono;

  insert into public.sobral_acoes_crm_eventos (
    mensagem_id, dono, tipo, acao_anterior, acao_nova,
    quando_anterior, quando_novo
  ) values (
    p_mensagem, v_dono, 'reativada', v_acao_anterior, v_acao_nova,
    v_quando_anterior, p_quando
  );

  return 'confirmada';
end;
$$;

comment on function public.sobral_confirmar_recomendacao_crm(uuid, text, timestamptz) is
  'Confirma o próximo passo sugerido somente se o lead ainda estiver sem outra ação no CRM.';

revoke execute on function public.sobral_confirmar_recomendacao_crm(uuid, text, timestamptz)
  from public;
revoke execute on function public.sobral_confirmar_recomendacao_crm(uuid, text, timestamptz)
  from anon;
grant execute on function public.sobral_confirmar_recomendacao_crm(uuid, text, timestamptz)
  to authenticated;

commit;
