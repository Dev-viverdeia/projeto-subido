begin;
do $$ declare r jsonb; t timestamptz:=now()-interval '30 seconds'; begin
  if has_function_privilege('authenticated','operacoes_atendimento_resumo()','execute')
    or has_function_privilege('anon','operacoes_registrar_pulso(text,timestamptz,boolean)','execute')
    or has_table_privilege('authenticated','operacoes_pulsos','select') then raise exception 'Dados técnicos expostos'; end if;
  if not has_function_privilege('service_role','operacoes_atendimento_resumo()','execute') then raise exception 'Servidor sem acesso'; end if;
  if (operacoes_atendimento_resumo()->'pulsos')<>'[]'::jsonb then raise exception 'Pulso inventado'; end if;
  perform operacoes_registrar_pulso('envio',t,true);
  perform operacoes_registrar_pulso('envio',t,true);
  perform operacoes_registrar_pulso('envio',t-interval '1 second',false);
  if (select falhas_seguidas from operacoes_pulsos where fase='envio')<>1 then raise exception 'Ciclo duplicado/antigo alterou contador'; end if;
  perform operacoes_registrar_pulso('envio',t+interval '1 second',true);
  perform operacoes_registrar_pulso('envio',t+interval '2 seconds',true);
  if (select falhas_seguidas from operacoes_pulsos where fase='envio')<>3 then raise exception 'Falhas não contadas'; end if;
  perform operacoes_registrar_pulso('envio',t+interval '3 seconds',false);
  if (select falhas_seguidas from operacoes_pulsos where fase='envio')<>0 then raise exception 'Recuperação não registrada'; end if;
  update sobral_geracoes set estado='interrompida',parar_em=now();
  insert into suporte_email_recebidos(estado,criado_em) values('pendente',now()-interval '2 days'),('revisao',now()-interval '2 days'),('processado',now());
  delete from suporte_notificacoes;
  insert into suporte_notificacoes(estado,criado_em) values('pendente',now()-interval '2 days'),('enviado',now()),('entregue',now()),('expirado',now()-interval '2 days');
  r:=operacoes_atendimento_resumo();
  if (r#>>'{ia,interrompidas}')::int<>0 then raise exception 'Parada do usuário contada como falha'; end if;
  if (r#>>'{entrada,atrasadas}')::int<>1 or (r#>>'{entrada,revisao}')::int<>1 then raise exception 'Pendência antiga sumiu'; end if;
  if (r#>>'{saida,aceitas}')::int<>1 or (r#>>'{saida,entregues}')::int<>1 or (r#>>'{saida,atrasadas}')::int<>1 or (r#>>'{saida,sem_confirmacao}')::int<>0 then raise exception 'Estados de envio misturados'; end if;
end; $$;
rollback;
