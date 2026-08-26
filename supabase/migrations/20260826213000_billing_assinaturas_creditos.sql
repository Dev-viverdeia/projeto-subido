-- =============================================================================
-- BILLING · ASSINATURAS E PACOTES DE CREDITOS
--
-- A Stripe confirma dinheiro; o banco concede acesso e creditos. Nenhuma tela
-- de sucesso participa do fulfillment. As RPCs abaixo sao exclusivas do
-- service_role, idempotentes por evento, fatura e sessao de Checkout.
-- =============================================================================

begin;

create table public.billing_clientes (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint billing_clientes_customer_valido
    check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$')
);

create table public.billing_assinaturas (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  plano text not null,
  status text not null,
  stripe_price_id text,
  creditos_por_ciclo integer not null default 0,
  cancela_ao_fim_do_periodo boolean not null default false,
  periodo_atual_termina_em timestamptz,
  ultima_fatura_id text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint billing_assinaturas_subscription_valida
    check (stripe_subscription_id ~ '^sub_[A-Za-z0-9]+$'),
  constraint billing_assinaturas_customer_valido
    check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),
  constraint billing_assinaturas_plano_valido
    check (plano in ('starter', 'pro')),
  constraint billing_assinaturas_status_valido
    check (
      status in (
        'active', 'trialing', 'past_due', 'canceled', 'unpaid',
        'incomplete', 'incomplete_expired', 'paused'
      )
    ),
  constraint billing_assinaturas_price_valido
    check (stripe_price_id is null or stripe_price_id ~ '^price_[A-Za-z0-9]+$'),
  constraint billing_assinaturas_creditos_validos
    check (creditos_por_ciclo between 0 and 100000),
  constraint billing_assinaturas_fatura_valida
    check (ultima_fatura_id is null or ultima_fatura_id ~ '^in_[A-Za-z0-9]+$')
);

create index billing_assinaturas_status_idx
  on public.billing_assinaturas (status, atualizado_em desc);

create table public.billing_pedidos_creditos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  pacote_id text not null,
  creditos integer not null,
  valor_total integer,
  moeda text,
  status text not null default 'pendente',
  criado_em timestamptz not null default now(),
  pago_em timestamptz,
  atualizado_em timestamptz not null default now(),

  constraint billing_pedidos_session_valida
    check (stripe_checkout_session_id ~ '^cs_[A-Za-z0-9_]+$'),
  constraint billing_pedidos_payment_intent_valido
    check (
      stripe_payment_intent_id is null
      or stripe_payment_intent_id ~ '^pi_[A-Za-z0-9]+$'
    ),
  constraint billing_pedidos_pacote_valido
    check (pacote_id in ('essencial', 'crescimento', 'escala')),
  constraint billing_pedidos_creditos_validos
    check (creditos between 1 and 100000),
  constraint billing_pedidos_valor_valido
    check (valor_total is null or valor_total >= 0),
  constraint billing_pedidos_moeda_valida
    check (moeda is null or moeda ~ '^[a-z]{3}$'),
  constraint billing_pedidos_status_valido
    check (status in ('pendente', 'pago', 'falhou', 'reembolsado'))
);

create index billing_pedidos_usuario_idx
  on public.billing_pedidos_creditos (usuario_id, criado_em desc);

create table public.billing_webhook_eventos (
  stripe_evento_id text primary key,
  tipo text not null,
  status text not null default 'processando',
  tentativas integer not null default 1,
  erro text,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz,
  atualizado_em timestamptz not null default now(),

  constraint billing_webhook_evento_valido
    check (stripe_evento_id ~ '^evt_[A-Za-z0-9]+$'),
  constraint billing_webhook_status_valido
    check (status in ('processando', 'processado', 'falhou')),
  constraint billing_webhook_tentativas_validas
    check (tentativas between 1 and 100)
);

create index billing_webhook_status_idx
  on public.billing_webhook_eventos (status, atualizado_em desc);

alter table public.billing_clientes enable row level security;
alter table public.billing_assinaturas enable row level security;
alter table public.billing_pedidos_creditos enable row level security;
alter table public.billing_webhook_eventos enable row level security;

create policy billing_clientes_ler_proprio
  on public.billing_clientes for select to authenticated
  using (usuario_id = (select auth.uid()));

create policy billing_assinaturas_ler_propria
  on public.billing_assinaturas for select to authenticated
  using (usuario_id = (select auth.uid()));

create policy billing_pedidos_ler_proprios
  on public.billing_pedidos_creditos for select to authenticated
  using (usuario_id = (select auth.uid()));

revoke all on public.billing_clientes from public, anon, authenticated;
revoke all on public.billing_assinaturas from public, anon, authenticated;
revoke all on public.billing_pedidos_creditos from public, anon, authenticated;
revoke all on public.billing_webhook_eventos from public, anon, authenticated;

grant select on public.billing_clientes to authenticated;
grant select on public.billing_assinaturas to authenticated;
grant select on public.billing_pedidos_creditos to authenticated;
grant select, insert, update, delete on public.billing_clientes to service_role;
grant select, insert, update, delete on public.billing_assinaturas to service_role;
grant select, insert, update, delete on public.billing_pedidos_creditos to service_role;
grant select, insert, update, delete on public.billing_webhook_eventos to service_role;

create function public.billing_sistema_reservar_evento(
  p_evento text,
  p_tipo text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservado boolean := false;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'operacao_nao_autorizada' using errcode = '42501';
  end if;
  if p_evento !~ '^evt_[A-Za-z0-9]+$' or coalesce(btrim(p_tipo), '') = '' then
    raise exception 'evento_invalido' using errcode = '22023';
  end if;

  insert into public.billing_webhook_eventos (stripe_evento_id, tipo)
  values (p_evento, left(p_tipo, 160))
  on conflict (stripe_evento_id) do update set
    status = 'processando',
    tentativas = public.billing_webhook_eventos.tentativas + 1,
    erro = null,
    atualizado_em = now()
  where public.billing_webhook_eventos.status = 'falhou'
     or (
       public.billing_webhook_eventos.status = 'processando'
       and public.billing_webhook_eventos.atualizado_em < now() - interval '5 minutes'
     )
  returning true into v_reservado;

  return coalesce(v_reservado, false);
end;
$$;

create function public.billing_sistema_concluir_evento(p_evento text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'operacao_nao_autorizada' using errcode = '42501';
  end if;

  update public.billing_webhook_eventos
  set status = 'processado', processado_em = now(), atualizado_em = now(), erro = null
  where stripe_evento_id = p_evento;
end;
$$;

create function public.billing_sistema_falhar_evento(p_evento text, p_erro text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'operacao_nao_autorizada' using errcode = '42501';
  end if;

  update public.billing_webhook_eventos
  set
    status = 'falhou',
    erro = left(coalesce(nullif(btrim(p_erro), ''), 'falha_sem_detalhe'), 500),
    atualizado_em = now()
  where stripe_evento_id = p_evento;
end;
$$;

create function public.billing_sistema_sincronizar_assinatura(
  p_usuario uuid,
  p_customer text,
  p_subscription text,
  p_plano text,
  p_status text,
  p_price text default null,
  p_creditos integer default 0,
  p_cancela_ao_fim boolean default false,
  p_periodo_termina_em timestamptz default null,
  p_fatura text default null,
  p_creditar_fatura boolean default false
)
returns table (plano_efetivo text, saldo integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plano_efetivo text;
  v_saldo integer;
  v_metadata jsonb;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'operacao_nao_autorizada' using errcode = '42501';
  end if;
  if p_usuario is null
     or p_customer !~ '^cus_[A-Za-z0-9]+$'
     or p_subscription !~ '^sub_[A-Za-z0-9]+$'
     or p_plano not in ('starter', 'pro')
     or p_status not in (
       'active', 'trialing', 'past_due', 'canceled', 'unpaid',
       'incomplete', 'incomplete_expired', 'paused'
     )
     or p_creditos < 0
     or p_creditos > 100000
  then
    raise exception 'assinatura_invalida' using errcode = '22023';
  end if;

  insert into public.billing_clientes (usuario_id, stripe_customer_id)
  values (p_usuario, p_customer)
  on conflict (usuario_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    atualizado_em = now();

  insert into public.billing_assinaturas (
    usuario_id,
    stripe_subscription_id,
    stripe_customer_id,
    plano,
    status,
    stripe_price_id,
    creditos_por_ciclo,
    cancela_ao_fim_do_periodo,
    periodo_atual_termina_em,
    ultima_fatura_id
  ) values (
    p_usuario,
    p_subscription,
    p_customer,
    p_plano,
    p_status,
    p_price,
    p_creditos,
    p_cancela_ao_fim,
    p_periodo_termina_em,
    p_fatura
  )
  on conflict (usuario_id) do update set
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_customer_id = excluded.stripe_customer_id,
    plano = excluded.plano,
    status = excluded.status,
    stripe_price_id = excluded.stripe_price_id,
    creditos_por_ciclo = excluded.creditos_por_ciclo,
    cancela_ao_fim_do_periodo = excluded.cancela_ao_fim_do_periodo,
    periodo_atual_termina_em = excluded.periodo_atual_termina_em,
    ultima_fatura_id = coalesce(excluded.ultima_fatura_id, public.billing_assinaturas.ultima_fatura_id),
    atualizado_em = now();

  v_plano_efetivo := case
    when p_status in ('active', 'trialing', 'past_due') then p_plano
    else 'starter'
  end;

  select coalesce(raw_app_meta_data, '{}'::jsonb)
  into v_metadata
  from auth.users
  where id = p_usuario
  for update;

  if not found then
    raise exception 'usuario_inexistente' using errcode = 'P0002';
  end if;

  update auth.users
  set raw_app_meta_data = jsonb_set(v_metadata, '{plano_subido}', to_jsonb(v_plano_efetivo), true)
  where id = p_usuario;

  if p_creditar_fatura then
    if p_fatura !~ '^in_[A-Za-z0-9]+$' or p_creditos < 1 then
      raise exception 'credito_de_fatura_invalido' using errcode = '22023';
    end if;

    v_saldo := public.creditos_sistema_conceder(
      p_usuario,
      p_creditos,
      'assinatura',
      'stripe-fatura:' || p_fatura,
      'Créditos do plano ' || case when p_plano = 'pro' then 'Pro' else 'Starter' end
    );
  else
    select saldo into v_saldo
    from public.prospeccao_carteiras
    where dono = p_usuario;
  end if;

  return query select v_plano_efetivo, v_saldo;
end;
$$;

create function public.billing_sistema_criar_pedido(
  p_usuario uuid,
  p_session text,
  p_pacote text,
  p_creditos integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'operacao_nao_autorizada' using errcode = '42501';
  end if;
  if p_usuario is null
     or p_session !~ '^cs_[A-Za-z0-9_]+$'
     or p_pacote not in ('essencial', 'crescimento', 'escala')
     or p_creditos < 1
     or p_creditos > 100000
  then
    raise exception 'pedido_invalido' using errcode = '22023';
  end if;

  insert into public.billing_pedidos_creditos (
    usuario_id, stripe_checkout_session_id, pacote_id, creditos
  ) values (
    p_usuario, p_session, p_pacote, p_creditos
  )
  on conflict (stripe_checkout_session_id) do update set atualizado_em = now()
  returning id into v_id;

  return v_id;
end;
$$;

create function public.billing_sistema_pagar_pacote(
  p_usuario uuid,
  p_session text,
  p_payment_intent text,
  p_pacote text,
  p_creditos integer,
  p_valor_total integer,
  p_moeda text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_saldo integer;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'operacao_nao_autorizada' using errcode = '42501';
  end if;
  if p_usuario is null
     or p_session !~ '^cs_[A-Za-z0-9_]+$'
     or p_payment_intent !~ '^pi_[A-Za-z0-9]+$'
     or p_pacote not in ('essencial', 'crescimento', 'escala')
     or p_creditos < 1
     or p_creditos > 100000
     or p_valor_total < 0
     or p_moeda !~ '^[a-z]{3}$'
  then
    raise exception 'pagamento_invalido' using errcode = '22023';
  end if;

  insert into public.billing_pedidos_creditos (
    usuario_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    pacote_id,
    creditos,
    valor_total,
    moeda,
    status,
    pago_em
  ) values (
    p_usuario,
    p_session,
    p_payment_intent,
    p_pacote,
    p_creditos,
    p_valor_total,
    lower(p_moeda),
    'pago',
    now()
  )
  on conflict (stripe_checkout_session_id) do update set
    stripe_payment_intent_id = excluded.stripe_payment_intent_id,
    valor_total = excluded.valor_total,
    moeda = excluded.moeda,
    status = 'pago',
    pago_em = coalesce(public.billing_pedidos_creditos.pago_em, now()),
    atualizado_em = now();

  v_saldo := public.creditos_sistema_conceder(
    p_usuario,
    p_creditos,
    'pacote',
    'stripe-checkout:' || p_session,
    'Pacote de ' || p_creditos || ' créditos'
  );

  return v_saldo;
end;
$$;

create function public.billing_sistema_marcar_pedido(
  p_session text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'operacao_nao_autorizada' using errcode = '42501';
  end if;
  if p_session !~ '^cs_[A-Za-z0-9_]+$'
     or p_status not in ('falhou', 'reembolsado')
  then
    raise exception 'estado_de_pedido_invalido' using errcode = '22023';
  end if;

  update public.billing_pedidos_creditos
  set status = p_status, atualizado_em = now()
  where stripe_checkout_session_id = p_session;
end;
$$;

revoke execute on function public.billing_sistema_reservar_evento(text, text)
  from public, anon, authenticated;
revoke execute on function public.billing_sistema_concluir_evento(text)
  from public, anon, authenticated;
revoke execute on function public.billing_sistema_falhar_evento(text, text)
  from public, anon, authenticated;
revoke execute on function public.billing_sistema_sincronizar_assinatura(
  uuid, text, text, text, text, text, integer, boolean, timestamptz, text, boolean
) from public, anon, authenticated;
revoke execute on function public.billing_sistema_criar_pedido(uuid, text, text, integer)
  from public, anon, authenticated;
revoke execute on function public.billing_sistema_pagar_pacote(
  uuid, text, text, text, integer, integer, text
) from public, anon, authenticated;
revoke execute on function public.billing_sistema_marcar_pedido(text, text)
  from public, anon, authenticated;

grant execute on function public.billing_sistema_reservar_evento(text, text) to service_role;
grant execute on function public.billing_sistema_concluir_evento(text) to service_role;
grant execute on function public.billing_sistema_falhar_evento(text, text) to service_role;
grant execute on function public.billing_sistema_sincronizar_assinatura(
  uuid, text, text, text, text, text, integer, boolean, timestamptz, text, boolean
) to service_role;
grant execute on function public.billing_sistema_criar_pedido(uuid, text, text, integer)
  to service_role;
grant execute on function public.billing_sistema_pagar_pacote(
  uuid, text, text, text, integer, integer, text
) to service_role;
grant execute on function public.billing_sistema_marcar_pedido(text, text) to service_role;

comment on table public.billing_assinaturas is
  'Espelho operacional da assinatura Stripe. Acesso efetivo continua no app_metadata assinado.';
comment on table public.billing_pedidos_creditos is
  'Compras de pacotes fixos. Creditos sao concedidos somente depois de webhook pago.';
comment on table public.billing_webhook_eventos is
  'Ledger idempotente dos eventos Stripe, sem armazenar o payload ou dados de pagamento.';
comment on function public.billing_sistema_sincronizar_assinatura(
  uuid, text, text, text, text, text, integer, boolean, timestamptz, text, boolean
) is 'Sincroniza assinatura, acesso e franquia mensal em uma transacao idempotente.';

commit;
