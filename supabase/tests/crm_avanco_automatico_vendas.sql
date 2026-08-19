-- Teste transacional do metodo comercial. Nada persiste: empresas, calls,
-- propostas, eventos e mudancas de etapa sao desfeitos pelo rollback final.
begin;

do $$
declare
  v_dono uuid;
  v_empresa uuid;
  v_oportunidade uuid;
  v_call_descoberta uuid;
  v_call_proposta uuid;
  v_proposta_recusada uuid;
  v_proposta_aceita uuid;
  v_etapa public.crm_etapa;
  v_motivo text;
  v_ganha_em timestamptz;
begin
  select id into v_dono
  from auth.users
  order by created_at
  limit 1;

  if v_dono is null then
    raise exception 'teste_precisa_de_um_usuario_existente';
  end if;

  insert into public.crm_empresas (dono, nome)
  values (v_dono, 'Empresa de teste do CRM automatico')
  returning id into v_empresa;

  insert into public.crm_oportunidades (dono, empresa_id, titulo)
  values (v_dono, v_empresa, 'Projeto de IA de teste')
  returning id into v_oportunidade;

  insert into public.calls_reunioes (
    dono, empresa_id, oportunidade_id, titulo, tipo, agendada_para
  ) values (
    v_dono, v_empresa, v_oportunidade, 'Descoberta de teste', 'descoberta', now()
  )
  returning id into v_call_descoberta;

  select etapa into v_etapa
  from public.crm_oportunidades
  where id = v_oportunidade;
  if v_etapa <> 'novo_lead' then
    raise exception 'agendar_call_avancou_a_oportunidade';
  end if;

  update public.calls_reunioes
  set status = 'ao_vivo', iniciada_em = now()
  where id = v_call_descoberta;

  select etapa into v_etapa
  from public.crm_oportunidades
  where id = v_oportunidade;
  if v_etapa <> 'descoberta' then
    raise exception 'call_iniciada_nao_avancou_para_descoberta';
  end if;

  update public.crm_oportunidades
  set etapa = 'proposta'
  where id = v_oportunidade;

  update public.calls_reunioes
  set status = 'concluida', encerrada_em = now()
  where id = v_call_descoberta;

  select etapa into v_etapa
  from public.crm_oportunidades
  where id = v_oportunidade;
  if v_etapa <> 'proposta' then
    raise exception 'call_antiga_rebaixou_a_oportunidade';
  end if;

  update public.crm_oportunidades
  set etapa = 'novo_lead'
  where id = v_oportunidade;

  insert into public.calls_reunioes (
    dono, empresa_id, oportunidade_id, titulo, tipo, agendada_para
  ) values (
    v_dono, v_empresa, v_oportunidade, 'Apresentacao de teste', 'proposta', now()
  )
  returning id into v_call_proposta;

  update public.calls_reunioes
  set status = 'ao_vivo', iniciada_em = now()
  where id = v_call_proposta;

  select etapa into v_etapa
  from public.crm_oportunidades
  where id = v_oportunidade;
  if v_etapa <> 'proposta' then
    raise exception 'call_de_proposta_nao_avancou_para_propor';
  end if;

  update public.crm_oportunidades
  set etapa = 'novo_lead'
  where id = v_oportunidade;

  insert into public.propostas (
    dono, empresa_id, oportunidade_id, titulo, documento
  ) values (
    v_dono, v_empresa, v_oportunidade, 'Proposta recusada de teste', '{}'::jsonb
  )
  returning id into v_proposta_recusada;

  select etapa into v_etapa
  from public.crm_oportunidades
  where id = v_oportunidade;
  if v_etapa <> 'novo_lead' then
    raise exception 'rascunho_de_proposta_avancou_a_oportunidade';
  end if;

  update public.propostas set status = 'pronta' where id = v_proposta_recusada;
  update public.propostas set status = 'apresentada' where id = v_proposta_recusada;

  select etapa into v_etapa
  from public.crm_oportunidades
  where id = v_oportunidade;
  if v_etapa <> 'proposta' then
    raise exception 'proposta_apresentada_nao_avancou_para_propor';
  end if;

  update public.propostas set status = 'recusada' where id = v_proposta_recusada;

  select etapa, motivo_perda
  into v_etapa, v_motivo
  from public.crm_oportunidades
  where id = v_oportunidade;
  if v_etapa <> 'perdido' or v_motivo <> 'proposta_recusada' then
    raise exception 'recusa_nao_registrou_o_desfecho';
  end if;

  update public.crm_oportunidades
  set
    etapa = 'novo_lead',
    ganha_em = null,
    perdida_em = null,
    motivo_perda = null
  where id = v_oportunidade;

  insert into public.propostas (
    dono, empresa_id, oportunidade_id, titulo, documento
  ) values (
    v_dono, v_empresa, v_oportunidade, 'Proposta aceita de teste', '{}'::jsonb
  )
  returning id into v_proposta_aceita;

  update public.propostas set status = 'pronta' where id = v_proposta_aceita;
  update public.propostas set status = 'apresentada' where id = v_proposta_aceita;
  update public.propostas set status = 'aceita' where id = v_proposta_aceita;

  select etapa, ganha_em
  into v_etapa, v_ganha_em
  from public.crm_oportunidades
  where id = v_oportunidade;
  if v_etapa <> 'ganho' or v_ganha_em is null then
    raise exception 'aceite_nao_registrou_a_venda';
  end if;

  update public.calls_reunioes
  set status = 'processando'
  where id = v_call_proposta;

  select etapa into v_etapa
  from public.crm_oportunidades
  where id = v_oportunidade;
  if v_etapa <> 'ganho' then
    raise exception 'call_rebaixou_uma_venda_ganha';
  end if;
end;
$$;

rollback;
