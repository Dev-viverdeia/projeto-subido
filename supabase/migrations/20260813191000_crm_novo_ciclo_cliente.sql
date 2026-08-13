-- Um projeto entregue não encerra a relação com o cliente. Esta RPC abre uma
-- nova oportunidade usando a mesma empresa e o mesmo contato, sem duplicar o
-- cadastro. Se a pessoa clicar duas vezes, a oportunidade recorrente já aberta
-- é devolvida em vez de criar duas negociações.

create function public.crm_iniciar_novo_ciclo(p_oportunidade uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_empresa uuid;
  v_contato uuid;
  v_empresa_nome text;
  v_nova_oportunidade uuid;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select oportunidade.empresa_id, oportunidade.contato_principal_id, empresa.nome
  into v_empresa, v_contato, v_empresa_nome
  from public.crm_oportunidades oportunidade
  join public.crm_empresas empresa
    on empresa.dono = oportunidade.dono
   and empresa.id = oportunidade.empresa_id
  where oportunidade.id = p_oportunidade
    and oportunidade.dono = v_dono
    and oportunidade.etapa = 'ganho'
  for update of oportunidade;

  if not found then
    return null;
  end if;

  select oportunidade.id
  into v_nova_oportunidade
  from public.crm_oportunidades oportunidade
  where oportunidade.dono = v_dono
    and oportunidade.empresa_id = v_empresa
    and oportunidade.etapa not in ('ganho', 'perdido')
    and oportunidade.origem = 'cliente_recorrente'
  order by oportunidade.atualizado_em desc
  limit 1;

  if v_nova_oportunidade is not null then
    return v_nova_oportunidade;
  end if;

  insert into public.crm_oportunidades (
    dono,
    empresa_id,
    contato_principal_id,
    titulo,
    etapa,
    origem,
    proxima_acao
  ) values (
    v_dono,
    v_empresa,
    v_contato,
    'Novo projeto para ' || v_empresa_nome,
    'novo_lead',
    'cliente_recorrente',
    'Definir a próxima oportunidade com o cliente'
  )
  returning id into v_nova_oportunidade;

  return v_nova_oportunidade;
end;
$$;

comment on function public.crm_iniciar_novo_ciclo(uuid) is
  'Abre uma nova oportunidade para um cliente ganho sem duplicar empresa ou contato.';

revoke execute on function public.crm_iniciar_novo_ciclo(uuid) from public;
revoke execute on function public.crm_iniciar_novo_ciclo(uuid) from anon;
grant execute on function public.crm_iniciar_novo_ciclo(uuid) to authenticated;
