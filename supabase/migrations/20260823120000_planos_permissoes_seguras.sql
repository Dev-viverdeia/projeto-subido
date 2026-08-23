-- =============================================================================
-- PLANOS E PERMISSOES
--
-- O plano vive em raw_app_meta_data, que somente o backend administra.
-- Contas que ja existiam continuam Pro; cadastros novos entram no Starter.
-- O enriquecimento tambem confere o plano dentro do banco para impedir que a
-- RPC seja chamada diretamente e contorne a interface.
-- =============================================================================

begin;

update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{plano_subido}',
  '"pro"'::jsonb,
  true
)
where raw_app_meta_data ->> 'plano_subido' is null
   or raw_app_meta_data ->> 'plano_subido' not in ('starter', 'pro', 'enterprise');

create or replace function private.definir_plano_inicial_subido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.raw_app_meta_data = jsonb_set(
    coalesce(new.raw_app_meta_data, '{}'::jsonb),
    '{plano_subido}',
    '"starter"'::jsonb,
    true
  );
  return new;
end;
$$;

comment on function private.definir_plano_inicial_subido() is
  'Inclui o plano Starter no app_metadata assinado de todo usuario novo.';

revoke execute on function private.definir_plano_inicial_subido() from public;
revoke execute on function private.definir_plano_inicial_subido() from anon;
revoke execute on function private.definir_plano_inicial_subido() from authenticated;

drop trigger if exists auth_usuario_plano_inicial_subido on auth.users;
create trigger auth_usuario_plano_inicial_subido
  before insert on auth.users
  for each row
  execute function private.definir_plano_inicial_subido();

create or replace function public.crm_iniciar_enriquecimento(p_oportunidade uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_plano text := coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'plano_subido'),
    'pro'
  );
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

commit;
