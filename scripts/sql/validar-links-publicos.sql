-- Somente dados efêmeros, revertidos ao fim. Não envia convites nem chama IA.
begin;
do $$
declare
  v_dono uuid := gen_random_uuid(); v_empresa uuid := gen_random_uuid();
  v_venda uuid := gen_random_uuid(); v_call uuid := gen_random_uuid();
  v_cancelada uuid := gen_random_uuid(); v_proposta uuid := gen_random_uuid();
  v_codigo uuid; v_novo uuid := gen_random_uuid(); v_versao integer;
  v_job uuid; v_status text;
begin
  insert into auth.users(id, email, raw_user_meta_data, created_at, updated_at)
    values(v_dono, 'qa-links-' || v_dono::text || '@example.invalid', '{"nome":"QA descartável"}', now(), now());
  insert into public.crm_empresas(id, dono, nome) values(v_empresa, v_dono, 'QA links descartável');
  insert into public.crm_oportunidades(id, dono, empresa_id, titulo)
    values(v_venda, v_dono, v_empresa, 'QA links descartável');
  insert into public.calls_reunioes(id, dono, empresa_id, oportunidade_id, titulo, agendada_para)
    values(v_call, v_dono, v_empresa, v_venda, 'QA encerramento', now()),
          (v_cancelada, v_dono, v_empresa, v_venda, 'QA cancelamento', now());
  insert into public.calls_participantes(dono, reuniao_id, papel, nome, identidade_provedor, entrou_em)
    values(v_dono, v_call, 'convidado', 'QA', 'guest-qa', now());
  -- Reentrada legítima antes do fim continua disponível.
  update public.calls_participantes set entrou_em=now() where reuniao_id=v_call;
  update public.calls_reunioes set encerramento_solicitado_em=now() where id=v_call;
  select id into v_job from public.operacoes_jobs where dono=v_dono and tipo='encerramento_sala' and referencia_id=v_call;
  if v_job is null then raise exception 'QA: encerramento sem fila'; end if;
  update public.calls_reunioes set encerramento_solicitado_em=now() where id=v_call;
  if (select count(*) from public.operacoes_jobs where dono=v_dono and referencia_id=v_call) <> 1
    then raise exception 'QA: encerramento duplicado'; end if;
  if not exists(select 1 from public.operacoes_sistema_reivindicar(1, 'qa-links', array['encerramento_sala']::public.operacao_tipo[], v_job))
    then raise exception 'QA: fila não reivindica fechamento'; end if;
  begin
    insert into public.calls_participantes(dono,reuniao_id,papel,nome,identidade_provedor,entrou_em)
      values(v_dono,v_call,'convidado','QA','guest-tardio',now());
    raise exception 'QA: entrada tardia permitida' using errcode='P0002';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'reuniao_encerrada' then raise; end if;
  end;
  begin
    update public.calls_reunioes set status='ao_vivo' where id=v_call;
    raise exception 'QA: realtime reabriu sala' using errcode='P0002';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'reuniao_encerrada' then raise; end if;
  end;
  update public.calls_reunioes set status='cancelada' where id=v_cancelada;
  update public.calls_reunioes set status='concluida' where id=v_cancelada;
  if not exists(select 1 from public.calls_reunioes where id=v_cancelada and status='cancelada')
    then raise exception 'QA: retry desfez cancelamento'; end if;
  if not exists(select 1 from public.operacoes_jobs where dono=v_dono and referencia_id=v_cancelada and tipo='encerramento_sala')
    then raise exception 'QA: cancelamento sem fila'; end if;
  insert into public.calls_transcricoes(dono,reuniao_id,status) values(v_dono,v_call,'concluida');
  update public.calls_transcricoes set status='processando' where reuniao_id=v_call;
  if not exists(select 1 from public.calls_transcricoes where reuniao_id=v_call and status='concluida')
    then raise exception 'QA: flush rebaixou transcrição'; end if;

  insert into public.propostas(id,dono,empresa_id,oportunidade_id,titulo,documento)
    values(v_proposta,v_dono,v_empresa,v_venda,'QA proposta','{}');
  update public.propostas set status='apresentada' where id=v_proposta;
  select compartilhamento_codigo, versao into v_codigo, v_versao from public.propostas where id=v_proposta;
  update public.propostas set compartilhamento_ativo=false where id=v_proposta;
  if public.proposta_portal_decidir(v_codigo,'recusada','QA Cliente','qa@example.invalid') is not null
    then raise exception 'QA: decisão com link revogado'; end if;
  if public.proposta_portal_visualizar(v_codigo) then raise exception 'QA: visualização com link revogado'; end if;
  update public.propostas set compartilhamento_codigo=v_novo, compartilhamento_ativo=true where id=v_proposta;
  if public.proposta_portal_decidir(v_codigo,'recusada','QA Cliente','qa@example.invalid') is not null
    then raise exception 'QA: código anterior ainda decide'; end if;
  select status::text into v_status from public.propostas where id=v_proposta and versao=v_versao;
  if v_status is distinct from 'apresentada' then raise exception 'QA: compartilhamento alterou venda'; end if;
  if public.proposta_portal_decidir(v_novo,'recusada','QA Cliente','qa@example.invalid') is null
    then raise exception 'QA: novo link não permite decisão legítima'; end if;
end;
$$;
select 'ok' as resultado, 13 as verificacoes, 'Todos os dados de teste serão revertidos' as limpeza;
rollback;
