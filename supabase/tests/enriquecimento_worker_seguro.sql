-- Isolado: usuários, crédito e segredo de teste desaparecem no ROLLBACK.
begin;
insert into private.crm_worker_credencial(id,hash)
values (true,extensions.digest(repeat('a',64),'sha256'))
on conflict(id) do update set hash=excluded.hash;
insert into auth.users(id,email,created_at,raw_app_meta_data,raw_user_meta_data)
values ('11111111-8888-4888-8888-111111111119','qa-enrichment-rollback@example.invalid',now(),'{}','{}');
update auth.users set raw_app_meta_data='{"plano_subido":"pro"}'
where id='11111111-8888-4888-8888-111111111119';
insert into public.crm_empresas(id,dono,nome)
values ('22222222-8888-4888-8888-111111111119','11111111-8888-4888-8888-111111111119','QA rollback');
insert into public.crm_oportunidades(id,dono,empresa_id,titulo)
values ('33333333-8888-4888-8888-111111111119','11111111-8888-4888-8888-111111111119',
  '22222222-8888-4888-8888-111111111119','QA rollback');
insert into public.prospeccao_carteiras(dono,saldo)
values ('11111111-8888-4888-8888-111111111119',30) on conflict(dono) do update set saldo=30;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-8888-4888-8888-111111111119","role":"authenticated"}',true);
do $$
declare
  v_id uuid;
  v_op uuid := '33333333-8888-4888-8888-111111111119';
  v_resultado jsonb := '{"resumo":"QA rollback","fatos":[],"hipoteses":[]}';
  v_key text := repeat('a',64);
begin
  begin perform public.crm_worker_iniciar(v_op,null); raise exception 'aceitou_prova_ausente';
  exception when insufficient_privilege then null; end;
  begin perform public.crm_worker_iniciar(v_op,repeat('b',64)); raise exception 'aceitou_prova_invalida';
  exception when insufficient_privilege then null; end;
  begin perform public.crm_iniciar_enriquecimento(v_op); raise exception 'inicio_sem_worker';
  exception when insufficient_privilege then null; end;
  begin perform 1 from private.crm_worker_credencial; raise exception 'hash_publico';
  exception when insufficient_privilege then null; end;
  assert (select saldo=30 from public.prospeccao_carteiras), 'prova_invalida_cobrou';
  v_id := public.crm_worker_iniciar(v_op,v_key);
  perform set_config('qa.enriquecimento_id',v_id::text,true);
  begin perform public.crm_worker_iniciar(v_op,v_key); raise exception 'duplicou_inicio';
  exception when object_not_in_prerequisite_state then null; end;
  assert (select saldo=27 from public.prospeccao_carteiras), 'cobrou_duas_vezes';
  begin update public.crm_enriquecimentos set status='falhou' where id=v_id; raise exception 'patch_status_aceito';
  exception when insufficient_privilege then null; end;
  begin update public.crm_enriquecimentos set resultado=v_resultado,solicitado_em=now()-interval '1 day' where id=v_id;
    raise exception 'patch_resultado_aceito'; exception when insufficient_privilege then null; end;
  begin perform public.crm_worker_avancar(v_id,repeat('b',64),'concluido',v_resultado); raise exception 'finalizou_sem_prova';
  exception when insufficient_privilege then null; end;
  assert not public.crm_worker_avancar(v_id,v_key,'concluido',v_resultado), 'pulou_etapas';
  perform set_config('request.jwt.claims','{"sub":"99999999-8888-4888-8888-111111111119","role":"authenticated"}',true);
  assert (select count(*)=0 from public.crm_enriquecimentos), 'leitura_outro_dono';
  begin perform public.crm_worker_avancar(v_id,v_key,'ler_contexto'); raise exception 'escrita_outro_dono';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims','{"sub":"11111111-8888-4888-8888-111111111119","role":"authenticated"}',true);
  assert public.crm_worker_avancar(v_id,v_key,'ler_contexto');
  assert not public.crm_worker_avancar(v_id,v_key,'ler_contexto'), 'claim_duplicado';
  assert public.crm_worker_avancar(v_id,v_key,'ler_site');
  assert public.crm_worker_avancar(v_id,v_key,'gerar_dossie');
  assert public.crm_worker_avancar(v_id,v_key,'concluido',v_resultado,'[]','qa');
  assert not public.crm_worker_avancar(v_id,v_key,'concluido',v_resultado), 'conclusao_duplicada';
  assert not public.crm_worker_avancar(v_id,v_key,'falhou'), 'reabriu_sucesso';
  assert (select count(*)=1 from public.crm_eventos where fonte='enriquecimento' and fonte_id=v_id::text), 'publicacao_duplicada';
  assert (select saldo=27 from public.prospeccao_carteiras), 'estornou_sucesso';
  assert (select enriquecimento=v_resultado from public.crm_empresas), 'nao_publicou';
  v_id := public.crm_worker_iniciar(v_op,v_key);
  assert public.crm_worker_avancar(v_id,v_key,'falhou',null,'[]',null,'Falha de teste');
  assert not public.crm_worker_avancar(v_id,v_key,'falhou'), 'falha_duplicada';
  assert not public.crm_worker_avancar(v_id,v_key,'concluido',v_resultado), 'reabriu_falha';
  assert (select saldo=27 from public.prospeccao_carteiras), 'estorno_incorreto';
  assert (select count(*)=1 from public.prospeccao_movimentos where tipo='estorno_enriquecimento'), 'estorno_duplicado';
  v_id := public.crm_worker_iniciar(v_op,v_key);
  perform set_config('qa.enriquecimento_abandonado',v_id::text,true);
end;
$$;
reset role;
update public.crm_enriquecimentos set solicitado_em=now()-interval '11 minutes'
where id=current_setting('qa.enriquecimento_abandonado')::uuid;
-- Mesmo watchdog de produção; apenas a fixture está antiga nesta transação.
-- Não invocar o watchdog global: a simulação usa seu mesmo predicado na fixture.
update public.crm_enriquecimentos set status='falhou',concluido_em=now(),erro='QA watchdog'
where id=current_setting('qa.enriquecimento_abandonado')::uuid
  and status='na_fila' and solicitado_em<now()-interval '10 minutes';
set local role authenticated;
do $$
begin
  assert not public.crm_worker_avancar(current_setting('qa.enriquecimento_abandonado')::uuid,repeat('a',64),'concluido','{}'), 'worker_tardio';
  assert (select saldo=27 from public.prospeccao_carteiras), 'watchdog_sem_estorno';
end;
$$;
reset role;
-- Histórico anterior à cobrança não pode criar saldo por uma falha.
insert into public.crm_enriquecimentos(dono,empresa_id,oportunidade_id)
values ('11111111-8888-4888-8888-111111111119','22222222-8888-4888-8888-111111111119','33333333-8888-4888-8888-111111111119');
set local role authenticated;
do $$
begin
  perform public.crm_worker_avancar(id,repeat('a',64),'falhou') from public.crm_enriquecimentos where status='na_fila';
  assert (select saldo=27 from public.prospeccao_carteiras), 'credito_sem_debito';
end;
$$;
reset role;
update auth.users set raw_app_meta_data='{"plano_subido":"starter"}' where id='11111111-8888-4888-8888-111111111119';
set local role authenticated;
do $$ begin
  begin perform public.crm_worker_iniciar('33333333-8888-4888-8888-111111111119',repeat('a',64)); raise exception 'starter_aceito';
  exception when insufficient_privilege then null; end;
end; $$;
select 'OK: permissões, isolamento, sequência, duplicação, estorno e resposta tardia' as resultado;
rollback;
