-- Isolamento, repetição, concorrência e resultado financeiro. Rollback integral.
begin;
insert into auth.users(id,email,created_at,raw_app_meta_data,raw_user_meta_data) values
('11111111-8888-4888-8888-111111111111','qa-fluxo-a@example.invalid',now(),'{}','{}'),
('22222222-8888-4888-8888-222222222222','qa-fluxo-b@example.invalid',now(),'{}','{}');
update auth.users set raw_app_meta_data='{"plano_subido":"pro"}'
  where id in ('11111111-8888-4888-8888-111111111111','22222222-8888-4888-8888-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-8888-4888-8888-111111111111","role":"authenticated"}',true);
do $$
declare v_op uuid; v_empresa uuid; v_proposta uuid; v_eventos int;
begin
  v_op := public.crm_criar_lead('QA fluxo','QA contato',null,'QA oportunidade');
  select empresa_id into v_empresa from public.crm_oportunidades where id=v_op;
  perform set_config('qa.fluxo',v_op::text,true);
  assert public.crm_alterar_situacao(v_op,'arquivada','ativa','Retomar depois');
  assert not public.crm_alterar_situacao(v_op,'arquivada','ativa','Retomar depois'), 'repeticao_nao_idempotente';
  select count(*) into v_eventos from public.crm_eventos where oportunidade_id=v_op and tipo='situacao_alterada';
  assert v_eventos=1, 'historico_duplicado';
  assert exists(select 1 from public.crm_oportunidades where id=v_op and etapa='novo_lead' and perdida_em is null and ganha_em is null), 'retirada_alterou_resultado';
  begin perform public.crm_mover_oportunidade_kanban(v_op,'ganho'); raise exception 'moveu_arquivada';
  exception when serialization_failure then null; end;
  begin perform public.crm_alterar_situacao(v_op,'desclassificada','ativa','Sem perfil'); raise exception 'ignorou_conflito';
  exception when serialization_failure then null; end;
  assert public.crm_alterar_situacao(v_op,'ativa','arquivada');
  assert exists(select 1 from public.crm_oportunidades where id=v_op and retirada_em is null and motivo_retirada is null);
  begin perform public.crm_alterar_situacao(v_op,'desclassificada','ativa',' '); raise exception 'aceitou_motivo_vazio';
  exception when invalid_parameter_value then null; end;
  assert public.crm_alterar_situacao(v_op,'desclassificada','ativa','Sem perfil');
  -- Nenhuma reunião é necessária para persistir um rascunho.
  insert into public.propostas(dono,empresa_id,oportunidade_id,titulo,documento)
    values(auth.uid(),v_empresa,v_op,'QA proposta offline','{}') returning id into v_proposta;
  assert exists(select 1 from public.propostas where id=v_proposta and reuniao_id is null);
  update public.propostas set status='aceita' where id=v_proposta;
  assert exists(select 1 from public.crm_oportunidades where id=v_op and etapa='ganho' and situacao='ativa' and retirada_em is null), 'aceite_posterior_bloqueado';
  begin perform public.crm_alterar_situacao(v_op,'desclassificada','ativa','Sem perfil'); raise exception 'desclassificou_ganha';
  exception when check_violation then null; end;
  assert public.crm_alterar_situacao(v_op,'arquivada','ativa','Manter no histórico');
  assert exists(select 1 from public.crm_oportunidades where id=v_op and etapa='ganho' and ganha_em is not null), 'apagou_ganho';
  perform set_config('request.jwt.claims','{"sub":"22222222-8888-4888-8888-222222222222","role":"authenticated"}',true);
  begin perform public.crm_alterar_situacao(v_op,'ativa','arquivada'); raise exception 'outra_conta_restaurou';
  exception when no_data_found then null; end;
  assert not exists(select 1 from public.crm_eventos where oportunidade_id=v_op), 'historico_exposto';
end; $$;
reset role;
update auth.users set raw_app_meta_data='{"plano_subido":"starter"}' where id='11111111-8888-4888-8888-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-8888-4888-8888-111111111111","role":"authenticated","app_metadata":{"plano_subido":"pro"}}',true);
do $$ begin
  begin perform public.crm_alterar_situacao(current_setting('qa.fluxo')::uuid,'ativa','arquivada'); raise exception 'starter_alterou_fluxo';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
set local role anon;
do $$ begin
  begin perform public.crm_alterar_situacao(current_setting('qa.fluxo')::uuid,'ativa','arquivada'); raise exception 'anon_alterou_fluxo';
  exception when insufficient_privilege then null; end;
end; $$;
select 'OK: retirar, restaurar, motivos, idempotência, conflito, aceite offline, isolamento, Starter e anônimo' as resultado;
rollback;
