-- Plano atual do usuário, sem confiar em JWT anterior a upgrade/downgrade.
-- Não altera planos, saldos ou cobranças existentes.
begin;

create or replace function public.plano_subido_atual()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_plano text;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  select raw_app_meta_data ->> 'plano_subido' into v_plano
  from auth.users where id = v_dono;
  return case when v_plano in ('pro', 'enterprise') then v_plano else 'starter' end;
end;
$$;
revoke execute on function public.plano_subido_atual() from public, anon;
grant execute on function public.plano_subido_atual() to authenticated;

create or replace function public.crm_iniciar_enriquecimento(p_oportunidade uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_plano text := public.plano_subido_atual();
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

  if v_plano not in ('pro', 'enterprise') then
    raise exception 'recurso_indisponivel_no_plano' using errcode = '42501';
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

comment on function public.crm_iniciar_enriquecimento(uuid) is
  'Cria e cobra enriquecimento somente para usuarios com modulo comercial.';

revoke execute on function public.crm_iniciar_enriquecimento(uuid) from public, anon;
grant execute on function public.crm_iniciar_enriquecimento(uuid) to authenticated;

create or replace function public.calls_agendar_reuniao_starter(
  p_empresa_nome text,
  p_contato_nome text,
  p_contato_email text,
  p_tipo public.calls_tipo,
  p_agendada_para timestamptz,
  p_duracao_minutos smallint default 45,
  p_titulo text default null,
  p_live_coach_ativo boolean default true
)
returns table (reuniao_id uuid, codigo_publico uuid, oportunidade_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plano text := public.plano_subido_atual();
  v_oportunidade uuid;
begin
  if v_plano <> 'starter' then
    raise exception 'fluxo_exclusivo_starter' using errcode = '42501';
  end if;

  v_oportunidade := public.crm_criar_lead(
    p_empresa_nome,
    p_contato_nome,
    p_contato_email,
    coalesce(nullif(btrim(coalesce(p_titulo, '')), ''), 'Projeto de IA para ' || btrim(p_empresa_nome))
  );

  return query
  select
    reuniao.reuniao_id,
    reuniao.codigo_publico,
    v_oportunidade
  from public.calls_agendar_reuniao(
    v_oportunidade,
    p_tipo,
    p_agendada_para,
    p_duracao_minutos,
    p_titulo,
    p_live_coach_ativo
  ) as reuniao;
end;
$$;

comment on function public.calls_agendar_reuniao_starter(
  text, text, text, public.calls_tipo, timestamptz, smallint, text, boolean
) is 'Agenda no Starter considerando o plano atual, mesmo com uma sessão antiga.';

-- A criação e a reserva de créditos pertencem somente à RPC transacional.
revoke insert on public.crm_enriquecimentos from authenticated;
drop policy if exists crm_enriquecimentos_insert on public.crm_enriquecimentos;

commit;
