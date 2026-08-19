-- =============================================================================
-- CREDITOS · REGISTRO INICIAL NAO DEPENDE DO SALDO ATUAL
--
-- A carteira nasce com 30 creditos, mas o movimento inicial podia ser tentado
-- apenas depois que o usuario ja havia consumido todo o saldo. Nesse caso o
-- sistema tentava gravar um movimento de valor zero e violava a propria regra
-- do extrato. O extrato passa a registrar o credito concedido originalmente,
-- sem alterar o saldo atual da carteira.
-- =============================================================================

begin;

create or replace function public.prospeccao_obter_saldo()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_saldo integer;
  v_credito_inicial constant integer := 30;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  insert into public.prospeccao_carteiras (dono)
  values (v_dono)
  on conflict (dono) do nothing;

  select saldo into v_saldo
  from public.prospeccao_carteiras
  where dono = v_dono;

  insert into public.prospeccao_movimentos (
    dono, tipo, movimento, saldo_apos, descricao
  ) values (
    v_dono,
    'credito_inicial',
    v_credito_inicial,
    v_credito_inicial,
    'Saldo inicial da prospeccao'
  ) on conflict (dono, tipo) where tipo = 'credito_inicial' do nothing;

  return v_saldo;
end;
$$;

create or replace function public.prospeccao_sistema_obter_saldo(p_dono uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_saldo integer;
  v_credito_inicial constant integer := 30;
begin
  if p_dono is null then
    raise exception 'dono_necessario' using errcode = '22023';
  end if;

  insert into public.prospeccao_carteiras (dono)
  values (p_dono)
  on conflict (dono) do nothing;

  select saldo into v_saldo
  from public.prospeccao_carteiras
  where dono = p_dono;

  insert into public.prospeccao_movimentos (
    dono, tipo, movimento, saldo_apos, descricao
  ) values (
    p_dono,
    'credito_inicial',
    v_credito_inicial,
    v_credito_inicial,
    'Saldo inicial da prospeccao'
  ) on conflict (dono, tipo) where tipo = 'credito_inicial' do nothing;

  return v_saldo;
end;
$$;

create or replace function public.crm_iniciar_enriquecimento(p_oportunidade uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_empresa uuid;
  v_contato uuid;
  v_dominio text;
  v_linkedin text;
  v_id uuid;
  v_saldo integer;
  v_custo constant integer := 3;
  v_credito_inicial constant integer := 30;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select
    oportunidade.empresa_id,
    oportunidade.contato_principal_id,
    nullif(lower(btrim(empresa.dominio)), ''),
    nullif(btrim(contato.linkedin_url), '')
  into v_empresa, v_contato, v_dominio, v_linkedin
  from public.crm_oportunidades oportunidade
  join public.crm_empresas empresa
    on empresa.id = oportunidade.empresa_id
    and empresa.dono = oportunidade.dono
  left join public.crm_contatos contato
    on contato.id = oportunidade.contato_principal_id
    and contato.empresa_id = oportunidade.empresa_id
    and contato.dono = oportunidade.dono
  where oportunidade.id = p_oportunidade
    and oportunidade.dono = v_dono;

  if not found then
    raise exception 'oportunidade_nao_encontrada' using errcode = 'P0002';
  end if;

  insert into public.crm_enriquecimentos (
    dono,
    empresa_id,
    contato_id,
    oportunidade_id,
    dominio,
    linkedin_url,
    contexto
  ) values (
    v_dono,
    v_empresa,
    v_contato,
    p_oportunidade,
    v_dominio,
    v_linkedin,
    null
  ) returning id into v_id;

  insert into public.prospeccao_carteiras (dono)
  values (v_dono)
  on conflict (dono) do nothing;

  select saldo into v_saldo
  from public.prospeccao_carteiras
  where dono = v_dono
  for update;

  insert into public.prospeccao_movimentos (
    dono, tipo, movimento, saldo_apos, descricao
  ) values (
    v_dono,
    'credito_inicial',
    v_credito_inicial,
    v_credito_inicial,
    'Saldo inicial da plataforma'
  ) on conflict (dono, tipo) where tipo = 'credito_inicial' do nothing;

  if v_saldo < v_custo then
    raise exception 'creditos_insuficientes' using errcode = 'P0001';
  end if;

  update public.prospeccao_carteiras
  set saldo = saldo - v_custo
  where dono = v_dono
  returning saldo into v_saldo;

  insert into public.prospeccao_movimentos (
    dono,
    enriquecimento_id,
    tipo,
    movimento,
    saldo_apos,
    descricao
  ) values (
    v_dono,
    v_id,
    'enriquecimento',
    -v_custo,
    v_saldo,
    'Enriquecimento da ficha do cliente'
  );

  return v_id;
exception
  when unique_violation then
    raise exception 'enriquecimento_em_andamento' using errcode = '55000';
end;
$$;

revoke execute on function public.prospeccao_obter_saldo() from public, anon, authenticated;
revoke execute on function public.prospeccao_sistema_obter_saldo(uuid)
  from public, anon, authenticated;
grant execute on function public.prospeccao_sistema_obter_saldo(uuid) to service_role;

revoke execute on function public.crm_iniciar_enriquecimento(uuid) from public, anon;
grant execute on function public.crm_iniciar_enriquecimento(uuid) to authenticated;

commit;
