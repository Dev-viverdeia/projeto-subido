-- =============================================================================
-- CREDITOS UNIVERSAIS · MENTORIAS
--
-- A carteira criada para prospeccao passa a ser a unica carteira da plataforma.
-- O nome tecnico permanece por compatibilidade; produto e RPC falam apenas em
-- creditos. Check-in, debito e eventual estorno acontecem na mesma transacao.
-- =============================================================================

begin;

alter table public.mentorias
  add column custo_creditos integer not null default 1,
  add constraint mentorias_custo_creditos_valido
    check (custo_creditos between 0 and 100);

alter table public.mentoria_inscricoes
  add column id uuid not null default gen_random_uuid(),
  add column creditos_usados integer not null default 0,
  add constraint mentoria_inscricoes_id_unico unique (id),
  add constraint mentoria_inscricoes_creditos_validos
    check (creditos_usados between 0 and 100);

alter table public.prospeccao_movimentos
  add column mentoria_id uuid references public.mentorias (id) on delete restrict,
  add column referencia_externa text;

alter table public.prospeccao_movimentos
  drop constraint prospeccao_movimentos_tipo_valido;

alter table public.prospeccao_movimentos
  add constraint prospeccao_movimentos_tipo_valido
  check (
    tipo in (
      'credito_inicial',
      'assinatura',
      'pacote',
      'busca',
      'estorno',
      'compra',
      'ajuste',
      'enriquecimento',
      'estorno_enriquecimento',
      'mentoria',
      'estorno_mentoria'
    )
  );

create index prospeccao_movimentos_mentoria_idx
  on public.prospeccao_movimentos (dono, mentoria_id, criado_em desc)
  where mentoria_id is not null;

create unique index prospeccao_movimentos_referencia_idx
  on public.prospeccao_movimentos (dono, tipo, referencia_externa)
  where referencia_externa is not null;

create or replace function public.creditos_obter_saldo()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  return public.prospeccao_obter_saldo();
end;
$$;

create function public.mentoria_fazer_checkin(p_mentoria uuid)
returns table (saldo integer, custo integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_saldo integer;
  v_custo integer;
  v_titulo text;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.mentoria_inscricoes
    where mentoria_id = p_mentoria and usuario_id = v_dono
  ) then
    raise exception 'checkin_duplicado' using errcode = '23505';
  end if;

  select titulo, custo_creditos
  into v_titulo, v_custo
  from public.mentorias
  where id = p_mentoria
  for update;

  if v_titulo is null then
    raise exception 'mentoria_inexistente' using errcode = '23503';
  end if;

  perform public.prospeccao_obter_saldo();

  select c.saldo
  into v_saldo
  from public.prospeccao_carteiras c
  where c.dono = v_dono
  for update;

  if v_saldo < v_custo then
    raise exception 'creditos_insuficientes' using errcode = 'P0001';
  end if;

  insert into public.mentoria_inscricoes (
    mentoria_id, usuario_id, creditos_usados
  ) values (
    p_mentoria, v_dono, v_custo
  );

  if v_custo > 0 then
    v_saldo := v_saldo - v_custo;

    update public.prospeccao_carteiras
    set saldo = v_saldo
    where dono = v_dono;

    insert into public.prospeccao_movimentos (
      dono, mentoria_id, tipo, movimento, saldo_apos, descricao
    ) values (
      v_dono,
      p_mentoria,
      'mentoria',
      -v_custo,
      v_saldo,
      'Check-in na mentoria ' || v_titulo
    );
  end if;

  return query select v_saldo, v_custo;
end;
$$;

create function public.mentoria_cancelar_checkin(p_mentoria uuid)
returns table (saldo integer, estorno integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_saldo integer;
  v_estorno integer;
  v_inicio timestamptz;
  v_titulo text;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select m.inicio, m.titulo, i.creditos_usados
  into v_inicio, v_titulo, v_estorno
  from public.mentoria_inscricoes i
  join public.mentorias m on m.id = i.mentoria_id
  where i.mentoria_id = p_mentoria and i.usuario_id = v_dono
  for update of i;

  if v_inicio is null then
    raise exception 'checkin_inexistente' using errcode = 'P0002';
  end if;

  if now() >= v_inicio then
    raise exception 'cancelamento_encerrado' using errcode = '23514';
  end if;

  perform public.prospeccao_obter_saldo();

  select c.saldo
  into v_saldo
  from public.prospeccao_carteiras c
  where c.dono = v_dono
  for update;

  delete from public.mentoria_inscricoes
  where mentoria_id = p_mentoria and usuario_id = v_dono;

  if v_estorno > 0 then
    v_saldo := v_saldo + v_estorno;

    update public.prospeccao_carteiras
    set saldo = v_saldo
    where dono = v_dono;

    insert into public.prospeccao_movimentos (
      dono, mentoria_id, tipo, movimento, saldo_apos, descricao
    ) values (
      v_dono,
      p_mentoria,
      'estorno_mentoria',
      v_estorno,
      v_saldo,
      'Estorno do check-in na mentoria ' || v_titulo
    );
  end if;

  return query select v_saldo, v_estorno;
end;
$$;

create function public.creditos_sistema_conceder(
  p_dono uuid,
  p_quantidade integer,
  p_tipo text,
  p_referencia text,
  p_descricao text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_saldo integer;
begin
  if p_dono is null or p_quantidade < 1 or p_quantidade > 100000 then
    raise exception 'concessao_invalida' using errcode = '22023';
  end if;
  if p_tipo not in ('assinatura', 'pacote', 'ajuste') then
    raise exception 'tipo_invalido' using errcode = '22023';
  end if;
  if coalesce(trim(p_referencia), '') = '' or coalesce(trim(p_descricao), '') = '' then
    raise exception 'referencia_invalida' using errcode = '22023';
  end if;

  perform public.prospeccao_sistema_obter_saldo(p_dono);

  if exists (
    select 1
    from public.prospeccao_movimentos
    where dono = p_dono and tipo = p_tipo and referencia_externa = p_referencia
  ) then
    select saldo into v_saldo from public.prospeccao_carteiras where dono = p_dono;
    return v_saldo;
  end if;

  select saldo into v_saldo
  from public.prospeccao_carteiras
  where dono = p_dono
  for update;

  v_saldo := v_saldo + p_quantidade;
  update public.prospeccao_carteiras set saldo = v_saldo where dono = p_dono;

  insert into public.prospeccao_movimentos (
    dono, tipo, referencia_externa, movimento, saldo_apos, descricao
  ) values (
    p_dono, p_tipo, p_referencia, p_quantidade, v_saldo, p_descricao
  );

  return v_saldo;
end;
$$;

revoke execute on function public.creditos_obter_saldo() from public, anon;
grant execute on function public.creditos_obter_saldo() to authenticated;

revoke execute on function public.mentoria_fazer_checkin(uuid) from public, anon;
grant execute on function public.mentoria_fazer_checkin(uuid) to authenticated;

revoke execute on function public.mentoria_cancelar_checkin(uuid) from public, anon;
grant execute on function public.mentoria_cancelar_checkin(uuid) to authenticated;

revoke execute on function public.creditos_sistema_conceder(uuid, integer, text, text, text)
  from public, anon, authenticated;
grant execute on function public.creditos_sistema_conceder(uuid, integer, text, text, text)
  to service_role;

comment on table public.prospeccao_carteiras is
  'Carteira universal de creditos. O nome tecnico e legado; o saldo atende prospeccao, enriquecimento, mentorias e futuros recursos da plataforma.';

comment on function public.creditos_obter_saldo() is
  'Saldo da carteira universal do usuario autenticado.';

comment on function public.mentoria_fazer_checkin(uuid) is
  'Reserva a vaga e consome os creditos da sessao de forma atomica.';

comment on function public.mentoria_cancelar_checkin(uuid) is
  'Cancela antes do inicio e estorna os creditos originalmente usados.';

comment on function public.creditos_sistema_conceder(uuid, integer, text, text, text) is
  'Concede um pacote ou franquia de assinatura com referencia externa idempotente. Uso exclusivo do sistema de cobranca.';

commit;
