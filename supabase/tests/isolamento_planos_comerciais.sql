-- Duas contas sintéticas; nenhuma chamada ao Calendar ou a outro provedor.
begin;
insert into auth.users(id,email,created_at,raw_app_meta_data,raw_user_meta_data) values
('11111111-7777-4777-8777-111111111111','qa-plano-a@example.invalid',now(),'{}','{}'),
('22222222-7777-4777-8777-222222222222','qa-plano-b@example.invalid',now(),'{}','{}');
-- O provisionamento insere Starter: simular o upgrade somente depois dele.
update auth.users set raw_app_meta_data='{"plano_subido":"pro"}'
where id in('11111111-7777-4777-8777-111111111111','22222222-7777-4777-8777-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-7777-4777-8777-111111111111","role":"authenticated","app_metadata":{"plano_subido":"pro"}}',true);
do $$
declare v_op uuid; v_empresa uuid; v_proposta uuid; v_afetados integer;
begin
  v_op := public.crm_criar_lead('QA empresa','QA contato','qa-contato@example.invalid','QA venda');
  select empresa_id into v_empresa from public.crm_oportunidades where id=v_op;
  perform set_config('qa.op',v_op::text,true);
  perform set_config('qa.empresa',v_empresa::text,true);
  assert public.crm_definir_proxima_acao(v_op,'Enviar escopo',now()+interval '2 days');
  insert into public.propostas(dono,empresa_id,oportunidade_id,titulo,documento)
  values(auth.uid(),v_empresa,v_op,'QA proposta','{}') returning id into v_proposta;
  update public.propostas set titulo='QA proposta editada' where id=v_proposta;
  get diagnostics v_afetados=row_count; assert v_afetados=1, 'pro_nao_edita_proposta';
  perform set_config('qa.proposta',v_proposta::text,true);
  perform set_config('request.jwt.claims','{"sub":"22222222-7777-4777-8777-222222222222","role":"authenticated"}',true);
  assert not exists(select 1 from public.crm_oportunidades where id=v_op), 'outra_conta_le_crm';
  assert not exists(select 1 from public.propostas where id=v_proposta), 'outra_conta_le_proposta';
  update public.crm_oportunidades set titulo='invasao' where id=v_op;
  get diagnostics v_afetados=row_count; assert v_afetados=0, 'outra_conta_edita_crm';
  begin perform public.crm_definir_proxima_acao(v_op,'Acao indevida'); raise exception 'rpc_outra_conta';
  exception when no_data_found then null; end;
end;
$$;
reset role;
-- Entrega histórica concluída antes do downgrade, com expansão já registrada.
do $$ declare v_proposta uuid; v_projeto uuid; begin
  insert into public.propostas(dono,empresa_id,oportunidade_id,titulo,documento,status)
  values('11111111-7777-4777-8777-111111111111',current_setting('qa.empresa')::uuid,
    current_setting('qa.op')::uuid,'QA entrega anterior','{}','aceita') returning id into v_proposta;
  insert into public.projetos_execucao(dono,proposta_id,empresa_id,oportunidade_id,titulo,documento,status)
  values('11111111-7777-4777-8777-111111111111',v_proposta,current_setting('qa.empresa')::uuid,
    current_setting('qa.op')::uuid,'QA entrega concluída','{}','concluido') returning id into v_projeto;
  insert into public.projeto_evolucoes(dono,projeto_execucao_id,status,revisao_em,resultado_observado,
    decisao,proximo_passo,registrada_em)
  values('11111111-7777-4777-8777-111111111111',v_projeto,'registrada',current_date,
    'Resultado confirmado no QA','expandir','Revisar novo escopo',now());
  perform set_config('qa.projeto',v_projeto::text,true);
end; $$;
update auth.users set raw_app_meta_data='{"plano_subido":"starter"}' where id='11111111-7777-4777-8777-111111111111';
set local role authenticated;
-- JWT antigo continua dizendo Pro: a autorização deve usar o banco atual.
select set_config('request.jwt.claims','{"sub":"11111111-7777-4777-8777-111111111111","role":"authenticated","app_metadata":{"plano_subido":"pro"}}',true);
do $$
declare
  v_op uuid := current_setting('qa.op')::uuid;
  v_empresa uuid := current_setting('qa.empresa')::uuid;
  v_reuniao uuid; v_interna uuid; v_afetados integer;
begin
  assert public.plano_subido_atual()='starter', 'confiou_no_jwt_antigo';
  assert exists(select 1 from public.projetos_execucao where id=current_setting('qa.projeto')::uuid), 'downgrade_ocultou_entrega';
  begin perform public.projeto_evolucao_iniciar_continuidade(current_setting('qa.projeto')::uuid);
    raise exception 'starter_criou_continuidade_comercial';
  exception when insufficient_privilege then null; end;
  begin perform public.crm_criar_lead('Bypass','QA',null,'Venda indevida'); raise exception 'starter_criou_lead';
  exception when insufficient_privilege then null; end;
  begin insert into public.crm_empresas(dono,nome) values(auth.uid(),'Bypass'); raise exception 'starter_inseriu_empresa';
  exception when insufficient_privilege then null; end;
  begin insert into public.crm_contatos(dono,empresa_id,nome) values(auth.uid(),v_empresa,'Bypass'); raise exception 'starter_inseriu_contato';
  exception when insufficient_privilege then null; end;
  begin insert into public.crm_oportunidades(dono,empresa_id,titulo) values(auth.uid(),v_empresa,'Bypass'); raise exception 'starter_inseriu_oportunidade';
  exception when insufficient_privilege then null; end;
  begin insert into public.propostas(dono,empresa_id,oportunidade_id,titulo,documento)
    values(auth.uid(),v_empresa,v_op,'Bypass','{}'); raise exception 'starter_inseriu_proposta';
  exception when insufficient_privilege then null; end;
  begin
    update public.crm_empresas set nome='Bypass' where id=v_empresa;
    get diagnostics v_afetados=row_count; assert v_afetados=0, 'starter_editou_empresa';
  exception when insufficient_privilege then null; end;
  begin
    update public.crm_contatos set nome='Bypass' where empresa_id=v_empresa;
    get diagnostics v_afetados=row_count; assert v_afetados=0, 'starter_editou_contato';
  exception when insufficient_privilege then null; end;
  update public.crm_oportunidades set titulo='Bypass' where id=v_op;
  get diagnostics v_afetados=row_count; assert v_afetados=0, 'starter_editou_oportunidade';
  update public.propostas set titulo='Bypass' where id=current_setting('qa.proposta')::uuid;
  get diagnostics v_afetados=row_count; assert v_afetados=0, 'starter_editou_proposta';
  delete from public.propostas where id=current_setting('qa.proposta')::uuid;
  get diagnostics v_afetados=row_count; assert v_afetados=0, 'starter_excluiu_proposta';
  begin perform public.crm_definir_proxima_acao(v_op,'Bypass'); raise exception 'starter_alterou_por_rpc';
  exception when no_data_found then null; end;

  -- Starter continua agendando e usando o contexto da sua própria reunião.
  select reuniao_id,oportunidade_id into v_reuniao,v_interna
  from public.calls_agendar_reuniao_starter('QA Starter','QA pessoa','qa-starter@example.invalid',
    'descoberta',now()+interval '2 days',45::smallint,'QA reunião',true);
  assert v_reuniao is not null, 'starter_nao_agendou';
  assert exists(select 1 from public.calls_reunioes where id=v_reuniao and dono=auth.uid() and live_coach_ativo), 'starter_sem_live_coach';
  assert exists(select 1 from public.crm_oportunidades where id=v_interna and dono=auth.uid()), 'starter_sem_contexto';
  update public.calls_reunioes set agendada_para=now()+interval '3 days' where id=v_reuniao;
  get diagnostics v_afetados=row_count; assert v_afetados=1, 'starter_nao_reagenda';
  assert exists(select 1 from public.crm_eventos where oportunidade_id=v_interna and titulo='Reunião reagendada'), 'starter_sem_historico';
  assert not (public.calls_aplicar_plano(v_reuniao,'Bypass',null,'proposta','{}')->>'aplicado')::boolean, 'starter_aplicou_plano_comercial';
end;
$$;
reset role;
update auth.users set raw_app_meta_data='{"plano_subido":"enterprise"}' where id='11111111-7777-4777-8777-111111111111';
set local role authenticated;
do $$ declare v_afetados integer; v_continuidade uuid; begin
  assert public.plano_subido_atual()='enterprise';
  assert public.crm_criar_lead('QA Enterprise','QA',null,'QA venda') is not null;
  v_continuidade := public.projeto_evolucao_iniciar_continuidade(current_setting('qa.projeto')::uuid);
  assert v_continuidade is not null, 'enterprise_sem_continuidade';
  assert public.projeto_evolucao_iniciar_continuidade(current_setting('qa.projeto')::uuid)=v_continuidade, 'continuidade_duplicada';
  delete from public.propostas where id=current_setting('qa.proposta')::uuid;
  get diagnostics v_afetados=row_count; assert v_afetados=1, 'enterprise_nao_exclui_rascunho';
end; $$;
select 'OK: Pro, Enterprise, isolamento, downgrade com JWT antigo, Starter com reunião e Live Coach' as resultado;
rollback;
