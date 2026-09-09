-- Ensaio sem efeitos permanentes: tudo, incluindo notificações, termina em ROLLBACK.
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a0000000-0000-4000-8000-000000000001','authenticated','authenticated','qa-cliente@support.invalid',now(),'{"provider":"email"}','{"nome":"QA Cliente"}',now(),now()),
 ('a0000000-0000-4000-8000-000000000002','authenticated','authenticated','qa-agente@support.invalid',now(),'{"provider":"email"}','{"nome":"QA Agente"}',now(),now()),
 ('a0000000-0000-4000-8000-000000000003','authenticated','authenticated','qa-outro@support.invalid',now(),'{"provider":"email"}','{"nome":"QA Outro"}',now(),now());
insert into public.suporte_agentes(usuario,nome,notificar) values('a0000000-0000-4000-8000-000000000002','QA Agente',false);
set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select public.suporte_criar('b0000000-0000-4000-8000-000000000001','QA transacional','reunioes','Preciso conectar a agenda.',null,'{}');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000003',true);
do $$ begin
 if exists(select 1 from public.suporte_atendimentos where id='b0000000-0000-4000-8000-000000000001') then raise exception 'FAIL isolamento';end if;
 begin perform public.suporte_responder_v2('c0000000-0000-4000-8000-000000000099','b0000000-0000-4000-8000-000000000001','Ataque',false,'{}','em_atendimento');raise exception 'FAIL autorizacao';exception when others then if sqlerrm<>'acesso_negado' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
select public.suporte_assumir('b0000000-0000-4000-8000-000000000001');
select public.suporte_responder_v2('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','Estamos investigando.',false,'{}','em_atendimento');
select public.suporte_responder_v2('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','Estamos investigando.',false,'{}','em_atendimento');
select public.suporte_responder_v2('c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','Nota privada.',true,'{}','em_atendimento');
do $$ begin
 if (select status from public.suporte_atendimentos where id='b0000000-0000-4000-8000-000000000001')<>'em_atendimento' then raise exception 'FAIL estado';end if;
 if (select count(*) from public.suporte_mensagens where id='c0000000-0000-4000-8000-000000000001')<>1 then raise exception 'FAIL duplicata';end if;
 if exists(select 1 from public.suporte_notificacoes where evento='c0000000-0000-4000-8000-000000000002') then raise exception 'FAIL nota notificada';end if;
 if exists(select 1 from public.suporte_transicoes where atendimento='b0000000-0000-4000-8000-000000000001' and atual='aguardando_voce') then raise exception 'FAIL transicao fantasma';end if;
 if private.eh_admin() then raise exception 'FAIL papel amplo';end if;
end $$;
select public.suporte_responder_v2('c0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000001','Resolvido.',false,'{}','resolvido');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select public.suporte_marcar_visto('b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001');
do $$ begin
 if exists(select 1 from public.suporte_mensagens where id='c0000000-0000-4000-8000-000000000002') then raise exception 'FAIL nota vazou';end if;
 if exists(select 1 from public.suporte_atendimentos where id='b0000000-0000-4000-8000-000000000001' and status<>'resolvido') then raise exception 'FAIL leitura mudou estado';end if;
 begin perform public.suporte_email_reservar();raise exception 'FAIL worker acessivel';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into public.suporte_email_recebidos(id,estado) values('d0000000-0000-4000-8000-000000000001','processando');
select public.suporte_email_incorporar('d0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','qa-cliente@support.invalid','Ainda preciso de ajuda.','<qa@support.invalid>','[]');
select public.suporte_email_incorporar('d0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','qa-cliente@support.invalid','Ainda preciso de ajuda.','<qa@support.invalid>','[]');
do $$ begin
 if (select reaberturas from public.suporte_atendimentos where id='b0000000-0000-4000-8000-000000000001')<>1 then raise exception 'FAIL reabertura';end if;
 if (select count(*) from public.suporte_mensagens where atendimento='b0000000-0000-4000-8000-000000000001' and canal='email')<>1 then raise exception 'FAIL email duplicado';end if;
end $$;
select 'PASS: isolamento, agente sem admin, nota privada, idempotencia, estado, leitura, worker privado, email e reabertura' as resultado;
rollback;
