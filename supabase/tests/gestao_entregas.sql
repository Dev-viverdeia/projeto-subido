-- Fixtures isoladas, nenhuma conta real alterada; rollback integral.
begin;
insert into auth.users(id,email,created_at,raw_app_meta_data,raw_user_meta_data) values
('11111111-9999-4999-8999-111111111111','qa-entregas-a@example.invalid',now(),'{"plano_subido":"pro"}','{}'),
('22222222-9999-4999-8999-222222222222','qa-entregas-b@example.invalid',now(),'{"plano_subido":"pro"}','{}');
update auth.users set raw_app_meta_data='{"plano_subido":"pro"}'
where id in ('11111111-9999-4999-8999-111111111111','22222222-9999-4999-8999-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-9999-4999-8999-111111111111","role":"authenticated"}',true);
do $$
declare v_op uuid; v_emp uuid; v_prop uuid; v_proj uuid; v_tarefa uuid; v_acao uuid := gen_random_uuid(); v_versao timestamptz; v_fim timestamptz; v_eventos integer;
begin
  v_op := public.crm_criar_lead('QA entrega','QA contato',null,'QA projeto');
  select empresa_id into v_emp from public.crm_oportunidades where id=v_op;
  insert into public.propostas(dono,empresa_id,oportunidade_id,titulo,documento)
    values(auth.uid(),v_emp,v_op,'QA proposta','{}') returning id into v_prop;
  insert into public.projetos_execucao(dono,empresa_id,oportunidade_id,proposta_id,titulo,documento)
    values(auth.uid(),v_emp,v_op,v_prop,'QA entrega','{}') returning id,atualizado_em into v_proj,v_versao;
  insert into public.projeto_tarefas(dono,projeto_execucao_id,fase_id,fase_titulo,passo_id,titulo,acao,concluido_quando,entregavel,ordem)
    values(auth.uid(),v_proj,'entregar','Entregar','teste','Teste final','Verificar a operação','Operação testada','Relatório',1) returning id into v_tarefa;
  perform set_config('qa.entrega',v_proj::text,true);
  assert exists(select 1 from public.projetos_execucao where id=v_proj and tipo_servico='pontual'), 'legado_nao_pontual';
  begin perform public.projeto_gerenciar_entrega(v_proj,'concluir',v_versao,false); raise exception 'ignorou_pendencias';
  exception when invalid_parameter_value then null; end;
  begin perform public.projeto_gerenciar_entrega(v_proj,'recorrente',v_versao-interval '1 hour'); raise exception 'ignorou_concorrencia';
  exception when serialization_failure then null; end;
  assert public.projeto_gerenciar_entrega(v_proj,'concluir',v_versao,true);
  select encerramento_manual_em into v_fim from public.projetos_execucao where id=v_proj;
  assert v_fim is not null;
  assert exists(select 1 from public.projeto_tarefas where id=v_tarefa and status='pendente' and cliente_status='nao_solicitada'), 'fabricou_conclusao_ou_aceite';
  assert not exists(select 1 from public.projeto_encerramentos where projeto_execucao_id=v_proj), 'fabricou_garantia';
  select count(*) into v_eventos from public.crm_eventos where oportunidade_id=v_op;
  assert public.projeto_gerenciar_entrega(v_proj,'concluir',v_versao,true);
  assert (select count(*) from public.crm_eventos where oportunidade_id=v_op)=v_eventos, 'duplicou_historico';
  assert (select encerramento_manual_em from public.projetos_execucao where id=v_proj)=v_fim, 'alterou_data_repetida';
  update public.projeto_tarefas set status='concluida', evidencia='QA validou a operação.' where id=v_tarefa;
  assert exists(select 1 from public.projetos_execucao where id=v_proj and status='concluido' and encerramento_manual_em=v_fim), 'checklist_reabriu_entrega_manual';
  select atualizado_em into v_versao from public.projetos_execucao where id=v_proj;
  assert public.projeto_gerenciar_entrega(v_proj,'recorrente',v_versao);
  assert public.projeto_agendar_acompanhamento(v_proj,v_acao,'Revisar indicadores','2026-09-20');
  assert public.projeto_agendar_acompanhamento(v_proj,v_acao,'Revisar indicadores','2026-09-20');
  assert (select count(*) from public.projeto_acoes where id=v_acao)=1;
  assert exists(select 1 from public.projeto_acoes where id=v_acao and not visivel_cliente and prazo_em='2026-09-20T15:00:00Z'), 'publicou_acao_ou_fuso_incorreto';
  begin perform public.projeto_agendar_acompanhamento(v_proj,v_acao,'Outra intenção','2026-09-21'); raise exception 'sobrescreveu_acao';
  exception when serialization_failure then null; end;
  select atualizado_em into v_versao from public.projetos_execucao where id=v_proj;
  begin perform public.projeto_gerenciar_entrega(v_proj,'encerrar_recorrencia',v_versao,false); raise exception 'encerrou_sem_ciencia';
  exception when invalid_parameter_value then null; end;
  assert public.projeto_gerenciar_entrega(v_proj,'encerrar_recorrencia',v_versao,true);
  assert exists(select 1 from public.projetos_execucao where id=v_proj and status='concluido' and recorrencia_encerrada_em is not null);
  begin perform public.projeto_agendar_acompanhamento(v_proj,gen_random_uuid(),'Não pode agendar','2026-09-21'); raise exception 'agendou_encerrado';
  exception when invalid_parameter_value then null; end;
  select atualizado_em into v_versao from public.projetos_execucao where id=v_proj;
  assert public.projeto_gerenciar_entrega(v_proj,'retomar_recorrencia',v_versao);
  assert exists(select 1 from public.projetos_execucao where id=v_proj and status='concluido' and recorrencia_encerrada_em is null);
  select atualizado_em into v_versao from public.projetos_execucao where id=v_proj;
  assert public.projeto_gerenciar_entrega(v_proj,'reabrir',v_versao);
  assert exists(select 1 from public.projetos_execucao where id=v_proj and status='em_execucao' and encerramento_manual_em is null and concluido_em is null);
  perform set_config('request.jwt.claims','{"sub":"22222222-9999-4999-8999-222222222222","role":"authenticated"}',true);
  begin perform public.projeto_gerenciar_entrega(v_proj,'concluir',v_versao,true); raise exception 'outra_conta_alterou';
  exception when no_data_found then null; end;
  begin perform public.projeto_agendar_acompanhamento(v_proj,gen_random_uuid(),'Não pode agendar','2026-09-21'); raise exception 'outra_conta_agendou';
  exception when no_data_found then null; end;
  assert not exists(select 1 from public.projetos_execucao where id=v_proj), 'projeto_exposto';
  assert not exists(select 1 from public.crm_eventos where oportunidade_id=v_op), 'historico_exposto';
end;
$$;
reset role;
set local role anon;
do $$ begin
  begin perform public.projeto_gerenciar_entrega(current_setting('qa.entrega')::uuid,'concluir',now(),true); raise exception 'anon_alterou';
  exception when insufficient_privilege then null; end;
  begin perform public.projeto_agendar_acompanhamento(current_setting('qa.entrega')::uuid,gen_random_uuid(),'Anon agendou','2026-09-21'); raise exception 'anon_agendou';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
rollback;
select 'OK: conclusão, pendências, recorrência, retomada, auditoria, repetição, conflito, fuso e isolamento; rollback integral' as resultado;
