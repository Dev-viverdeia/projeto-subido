-- Corrige a leitura do saldo na sincronizacao sem credito. `saldo` tambem e o
-- nome de uma coluna do retorno da funcao, portanto a tabela precisa de alias.

create or replace function public.billing_sistema_sincronizar_assinatura(
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
    select carteira.saldo into v_saldo
    from public.prospeccao_carteiras as carteira
    where carteira.dono = p_usuario;
  end if;

  return query select v_plano_efetivo, v_saldo;
end;
$$;
