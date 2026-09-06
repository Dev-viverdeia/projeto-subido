-- Cria somente dados QA dentro desta transação; o rollback remove tudo.
begin;
do $$
declare
  v_dono uuid;
  v_empresa uuid;
  v_oportunidade uuid;
  v_reuniao uuid;
  v_codigo uuid;
  v_horario timestamptz := now() + interval '2 days';
  v_novo timestamptz := now() + interval '3 days';
  v_acao timestamptz;
  v_eventos integer;
begin
  select id into v_dono from auth.users where email = 'rafael@viverdeia.ai';
  if v_dono is null then raise exception 'Conta proprietaria para QA nao encontrada'; end if;
  insert into public.crm_empresas (dono, nome) values (v_dono, 'QA transacional da agenda') returning id into v_empresa;
  insert into public.crm_oportunidades (dono, empresa_id, titulo) values (v_dono, v_empresa, 'QA reagendamento') returning id into v_oportunidade;
  insert into public.calls_reunioes (dono, empresa_id, oportunidade_id, titulo, agendada_para)
    values (v_dono, v_empresa, v_oportunidade, 'QA reagendamento', v_horario)
    returning id, codigo_publico into v_reuniao, v_codigo;
  update public.calls_reunioes set agendada_para = v_novo where id = v_reuniao;
  select proxima_acao_em into v_acao from public.crm_oportunidades where id = v_oportunidade;
  if v_acao is distinct from v_novo then raise exception 'Proxima acao ficou no horario antigo'; end if;
  if not exists (select 1 from public.calls_reunioes where id = v_reuniao and codigo_publico = v_codigo) then
    raise exception 'Reagendamento alterou a sala';
  end if;
  select count(*) into v_eventos from public.crm_eventos where oportunidade_id = v_oportunidade and titulo = 'Reunião reagendada';
  if v_eventos <> 1 then raise exception 'Historico de reagendamento ausente ou duplicado'; end if;
  update public.calls_reunioes set agendada_para = v_novo, google_sync_status = 'sincronizado' where id = v_reuniao;
  select count(*) into v_eventos from public.crm_eventos where oportunidade_id = v_oportunidade and titulo = 'Reunião reagendada';
  if v_eventos <> 1 then raise exception 'Sincronizacao duplicou o historico'; end if;
  update public.crm_oportunidades set proxima_acao = 'Acao manual do usuario', proxima_acao_em = v_novo where id = v_oportunidade;
  update public.calls_reunioes set agendada_para = v_horario where id = v_reuniao;
  select proxima_acao_em into v_acao from public.crm_oportunidades where id = v_oportunidade;
  if v_acao is distinct from v_novo then raise exception 'Reagendamento sobrescreveu acao manual'; end if;
  if has_function_privilege('authenticated', 'private.calls_registrar_reagendamento()', 'execute') then
    raise exception 'Funcao interna exposta';
  end if;
end;
$$;
rollback;
