-- =============================================================================
-- MUDANCAS NO ESCOPO DO PROJETO
--
-- Correcoes de uma entrega continuam em projeto_tarefas.cliente_status. Esta
-- estrutura registra somente pedidos que alteram o combinado geral do projeto.
-- A proposta aceita permanece imutavel; valores adicionais ficam neste livro
-- de aditivos e o prazo so muda depois da aprovacao explicita do cliente.
-- =============================================================================

begin;

create table public.projeto_mudancas_escopo (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  projeto_execucao_id uuid not null,
  titulo text not null,
  descricao text not null,
  solicitado_por text not null default 'cliente',
  status text not null default 'em_analise',
  classificacao text,
  resposta text,
  impacto_prazo_dias integer,
  impacto_valor_centavos bigint,
  criado_em timestamptz not null default now(),
  analisado_em timestamptz,
  decidido_em timestamptz,
  atualizado_em timestamptz not null default now(),

  constraint projeto_mudancas_escopo_projeto_fk
    foreign key (dono, projeto_execucao_id)
    references public.projetos_execucao (dono, id)
    on delete cascade,
  constraint projeto_mudancas_escopo_titulo_tamanho
    check (char_length(btrim(titulo)) between 3 and 160),
  constraint projeto_mudancas_escopo_descricao_tamanho
    check (char_length(btrim(descricao)) between 10 and 4000),
  constraint projeto_mudancas_escopo_solicitante_valido
    check (solicitado_por in ('cliente', 'prestador')),
  constraint projeto_mudancas_escopo_status_valido
    check (status in (
      'em_analise',
      'incluida',
      'aguardando_cliente',
      'aprovada',
      'recusada',
      'cancelada'
    )),
  constraint projeto_mudancas_escopo_classificacao_valida
    check (classificacao is null or classificacao in ('dentro_escopo', 'fora_escopo')),
  constraint projeto_mudancas_escopo_resposta_tamanho
    check (resposta is null or char_length(btrim(resposta)) between 5 and 4000),
  constraint projeto_mudancas_escopo_prazo_valido
    check (impacto_prazo_dias is null or impacto_prazo_dias between 0 and 365),
  constraint projeto_mudancas_escopo_valor_valido
    check (
      impacto_valor_centavos is null
      or impacto_valor_centavos between 0 and 100000000000
    ),
  constraint projeto_mudancas_escopo_estado_coerente
    check (
      (status = 'em_analise' and classificacao is null and resposta is null)
      or (
        status = 'incluida'
        and classificacao = 'dentro_escopo'
        and resposta is not null
      )
      or (
        status in ('aguardando_cliente', 'aprovada', 'recusada')
        and classificacao = 'fora_escopo'
        and resposta is not null
        and (coalesce(impacto_prazo_dias, 0) > 0 or coalesce(impacto_valor_centavos, 0) > 0)
      )
      or status = 'cancelada'
    )
);

comment on table public.projeto_mudancas_escopo is
  'Livro de mudancas do combinado geral do projeto. Nao substitui ajustes de entregas.';
comment on column public.projeto_mudancas_escopo.impacto_valor_centavos is
  'Valor adicional aprovado, separado do snapshot imutavel da proposta original.';

create index projeto_mudancas_escopo_projeto_idx
  on public.projeto_mudancas_escopo (dono, projeto_execucao_id, criado_em desc);

create unique index projeto_mudancas_escopo_ativa_unica_idx
  on public.projeto_mudancas_escopo (projeto_execucao_id)
  where status in ('em_analise', 'aguardando_cliente');

create trigger projeto_mudancas_escopo_atualizado_em
  before update on public.projeto_mudancas_escopo
  for each row execute function private.tocar_atualizado_em();

alter table public.projeto_mudancas_escopo enable row level security;

create policy projeto_mudancas_escopo_select on public.projeto_mudancas_escopo
  for select to authenticated
  using (dono = (select auth.uid()));

revoke all on table public.projeto_mudancas_escopo from anon, authenticated;
grant select on table public.projeto_mudancas_escopo to authenticated;

alter table public.projeto_portal_eventos
  add column mudanca_escopo_id uuid
    references public.projeto_mudancas_escopo (id) on delete set null;

create index projeto_portal_eventos_mudanca_escopo_idx
  on public.projeto_portal_eventos (mudanca_escopo_id)
  where mudanca_escopo_id is not null;

alter table public.projeto_portal_eventos
  drop constraint projeto_portal_eventos_tipo_valido,
  add constraint projeto_portal_eventos_tipo_valido
    check (tipo in (
      'portal_ativado',
      'portal_desativado',
      'link_rotacionado',
      'aprovacao_solicitada',
      'entrega_aprovada',
      'ajustes_solicitados',
      'arquivo_liberado',
      'arquivo_retirado',
      'pendencia_concluida',
      'mudanca_escopo_solicitada',
      'mudanca_escopo_incluida',
      'mudanca_escopo_proposta',
      'mudanca_escopo_aprovada',
      'mudanca_escopo_recusada'
    ));

create function public.projeto_portal_solicitar_mudanca_escopo(
  p_codigo uuid,
  p_titulo text,
  p_descricao text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_projeto public.projetos_execucao%rowtype;
  v_mudanca_id uuid;
begin
  select * into v_projeto
  from public.projetos_execucao
  where portal_codigo = p_codigo
    and portal_ativo = true;

  if not found then
    return null;
  end if;

  insert into public.projeto_mudancas_escopo (
    dono,
    projeto_execucao_id,
    titulo,
    descricao,
    solicitado_por
  ) values (
    v_projeto.dono,
    v_projeto.id,
    nullif(btrim(coalesce(p_titulo, '')), ''),
    nullif(btrim(coalesce(p_descricao, '')), ''),
    'cliente'
  )
  returning id into v_mudanca_id;

  insert into public.projeto_portal_eventos (
    dono,
    projeto_execucao_id,
    mudanca_escopo_id,
    tipo,
    autor,
    comentario
  ) values (
    v_projeto.dono,
    v_projeto.id,
    v_mudanca_id,
    'mudanca_escopo_solicitada',
    'cliente',
    nullif(btrim(coalesce(p_titulo, '')), '')
  );

  return v_mudanca_id;
exception
  when unique_violation then
    raise exception 'mudanca_ativa_existente' using errcode = '23505';
end;
$$;

revoke all on function public.projeto_portal_solicitar_mudanca_escopo(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.projeto_portal_solicitar_mudanca_escopo(uuid, text, text)
  to service_role;

create function public.projeto_mudanca_escopo_analisar(
  p_mudanca_id uuid,
  p_classificacao text,
  p_resposta text,
  p_impacto_prazo_dias integer default null,
  p_impacto_valor_centavos bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mudanca public.projeto_mudancas_escopo%rowtype;
  v_status text;
  v_tipo text;
  v_evento_id uuid;
begin
  if auth.uid() is null then
    raise exception 'sessao_invalida' using errcode = '42501';
  end if;

  if p_classificacao not in ('dentro_escopo', 'fora_escopo') then
    raise exception 'classificacao_invalida' using errcode = '22023';
  end if;

  select * into v_mudanca
  from public.projeto_mudancas_escopo
  where id = p_mudanca_id
    and dono = auth.uid()
    and status = 'em_analise'
  for update;

  if not found then
    return null;
  end if;

  v_status := case when p_classificacao = 'dentro_escopo' then 'incluida' else 'aguardando_cliente' end;
  v_tipo := case when p_classificacao = 'dentro_escopo' then 'mudanca_escopo_incluida' else 'mudanca_escopo_proposta' end;

  update public.projeto_mudancas_escopo
  set
    status = v_status,
    classificacao = p_classificacao,
    resposta = nullif(btrim(coalesce(p_resposta, '')), ''),
    impacto_prazo_dias = case when p_classificacao = 'fora_escopo' then coalesce(p_impacto_prazo_dias, 0) else null end,
    impacto_valor_centavos = case when p_classificacao = 'fora_escopo' then coalesce(p_impacto_valor_centavos, 0) else null end,
    analisado_em = now()
  where id = v_mudanca.id;

  insert into public.projeto_portal_eventos (
    dono,
    projeto_execucao_id,
    mudanca_escopo_id,
    tipo,
    autor,
    comentario
  ) values (
    v_mudanca.dono,
    v_mudanca.projeto_execucao_id,
    v_mudanca.id,
    v_tipo,
    'prestador',
    nullif(btrim(coalesce(p_resposta, '')), '')
  ) returning id into v_evento_id;

  return v_evento_id;
end;
$$;

revoke all on function public.projeto_mudanca_escopo_analisar(uuid, text, text, integer, bigint)
  from public, anon;
grant execute on function public.projeto_mudanca_escopo_analisar(uuid, text, text, integer, bigint)
  to authenticated;

create function public.projeto_portal_decidir_mudanca_escopo(
  p_codigo uuid,
  p_mudanca_id uuid,
  p_decisao text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_projeto public.projetos_execucao%rowtype;
  v_mudanca public.projeto_mudancas_escopo%rowtype;
  v_status text;
  v_tipo text;
  v_evento_id uuid;
begin
  if p_decisao not in ('aprovada', 'recusada') then
    raise exception 'decisao_invalida' using errcode = '22023';
  end if;

  select * into v_projeto
  from public.projetos_execucao
  where portal_codigo = p_codigo
    and portal_ativo = true;

  if not found then
    return null;
  end if;

  select * into v_mudanca
  from public.projeto_mudancas_escopo
  where id = p_mudanca_id
    and dono = v_projeto.dono
    and projeto_execucao_id = v_projeto.id
    and status = 'aguardando_cliente'
  for update;

  if not found then
    return null;
  end if;

  v_status := p_decisao;
  v_tipo := case when p_decisao = 'aprovada' then 'mudanca_escopo_aprovada' else 'mudanca_escopo_recusada' end;

  update public.projeto_mudancas_escopo
  set status = v_status, decidido_em = now()
  where id = v_mudanca.id;

  if p_decisao = 'aprovada' and coalesce(v_mudanca.impacto_prazo_dias, 0) > 0 then
    update public.projetos_execucao
    set prazo_em = case
      when prazo_em is null then null
      else prazo_em + make_interval(days => v_mudanca.impacto_prazo_dias)
    end
    where id = v_projeto.id and dono = v_projeto.dono;
  end if;

  insert into public.projeto_portal_eventos (
    dono,
    projeto_execucao_id,
    mudanca_escopo_id,
    tipo,
    autor,
    comentario
  ) values (
    v_projeto.dono,
    v_projeto.id,
    v_mudanca.id,
    v_tipo,
    'cliente',
    v_mudanca.titulo
  ) returning id into v_evento_id;

  return v_evento_id;
end;
$$;

revoke all on function public.projeto_portal_decidir_mudanca_escopo(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.projeto_portal_decidir_mudanca_escopo(uuid, uuid, text)
  to service_role;

commit;
