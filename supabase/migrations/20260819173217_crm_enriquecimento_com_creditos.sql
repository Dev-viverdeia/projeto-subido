-- =============================================================================
-- CRM · ENRIQUECIMENTO AUTOMATICO COM CREDITOS
--
-- A confirmacao envia somente a oportunidade. Empresa, contato, historico,
-- calls e site sao lidos do banco. A cobranca acontece na mesma transacao que
-- cria a execucao; se o processamento falhar, o saldo volta automaticamente.
-- =============================================================================

begin;

alter table public.prospeccao_movimentos
  add column enriquecimento_id uuid;

alter table public.prospeccao_movimentos
  add constraint prospeccao_movimentos_enriquecimento_fk
  foreign key (dono, enriquecimento_id)
  references public.crm_enriquecimentos (dono, id)
  on delete restrict;

alter table public.prospeccao_movimentos
  drop constraint prospeccao_movimentos_tipo_valido;

alter table public.prospeccao_movimentos
  add constraint prospeccao_movimentos_tipo_valido
  check (
    tipo in (
      'credito_inicial',
      'busca',
      'estorno',
      'compra',
      'ajuste',
      'enriquecimento',
      'estorno_enriquecimento'
    )
  );

create unique index prospeccao_movimentos_enriquecimento_idx
  on public.prospeccao_movimentos (dono, enriquecimento_id, tipo)
  where enriquecimento_id is not null;

drop function if exists public.crm_iniciar_enriquecimento(uuid, text, text, text);

create function public.crm_iniciar_enriquecimento(p_oportunidade uuid)
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

  -- A restricao de uma execucao ativa impede uma segunda cobranca enquanto a
  -- primeira ainda esta em andamento. Qualquer erro abaixo desfaz o insert.
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
  )
  returning id into v_id;

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
    v_dono, 'credito_inicial', v_saldo, v_saldo, 'Saldo inicial da plataforma'
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
  'Cria e cobra um enriquecimento usando somente os dados salvos na oportunidade do usuario.';

revoke execute on function public.crm_iniciar_enriquecimento(uuid) from public;
revoke execute on function public.crm_iniciar_enriquecimento(uuid) from anon;
grant execute on function public.crm_iniciar_enriquecimento(uuid) to authenticated;

create function private.crm_estornar_enriquecimento_falho()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_custo constant integer := 3;
  v_saldo integer;
begin
  if exists (
    select 1
    from public.prospeccao_movimentos
    where dono = new.dono
      and enriquecimento_id = new.id
      and tipo = 'estorno_enriquecimento'
  ) then
    return new;
  end if;

  update public.prospeccao_carteiras
  set saldo = saldo + v_custo
  where dono = new.dono
  returning saldo into v_saldo;

  if v_saldo is not null then
    insert into public.prospeccao_movimentos (
      dono,
      enriquecimento_id,
      tipo,
      movimento,
      saldo_apos,
      descricao
    ) values (
      new.dono,
      new.id,
      'estorno_enriquecimento',
      v_custo,
      v_saldo,
      'Estorno de enriquecimento nao concluido'
    );
  end if;

  return new;
end;
$$;

comment on function private.crm_estornar_enriquecimento_falho() is
  'Devolve automaticamente os creditos quando o enriquecimento termina com falha.';

revoke execute on function private.crm_estornar_enriquecimento_falho() from public;
revoke execute on function private.crm_estornar_enriquecimento_falho() from anon;
revoke execute on function private.crm_estornar_enriquecimento_falho() from authenticated;

create trigger crm_enriquecimento_falho_estorna_creditos
  after update of status on public.crm_enriquecimentos
  for each row
  when (
    old.status is distinct from new.status
    and new.status = 'falhou'
  )
  execute function private.crm_estornar_enriquecimento_falho();

comment on table public.prospeccao_carteiras is
  'Saldo de creditos da plataforma usado em prospeccao e enriquecimento.';

commit;
