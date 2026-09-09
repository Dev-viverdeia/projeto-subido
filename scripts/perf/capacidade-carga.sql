-- Evita que os dados cresçam durante a medição. Cada transação desfaz só seus dados sintéticos.
truncate sobral_geracoes,consultor_mensagens,consultor_threads,consultor_uso cascade;
truncate crm_enriquecimentos,prospeccao_movimentos,suporte_notificacoes;
create function perf.transacao(cliente integer) returns void language plpgsql as $$
declare d uuid;t uuid:=gen_random_uuid();m uuid:=gen_random_uuid();tent uuid:=gen_random_uuid();e uuid;r uuid;
begin
  select dono into d from perf.contas where n=cliente;
  perform set_config('request.jwt.claim.sub',d::text,true);
  insert into consultor_threads(id,dono) values(t,d);
  insert into consultor_mensagens(id,thread_id,papel,conteudo) values(m,t,'usuario','Pergunta sintética');
  perform sobral_iniciar_geracao(d,t,m,tent,false);
  perform sobral_iniciar_geracao(d,t,m,tent,false);
  perform sobral_finalizar_geracao(d,m,tent,'concluida','{"texto":"Resposta sintética do laboratório.","tokens":100}');
  perform sobral_finalizar_geracao(d,m,tent,'concluida','{"texto":"Resposta sintética do laboratório.","tokens":100}');
  e:=crm_worker_iniciar(d,repeat('x',64));
  perform crm_worker_avancar(e,repeat('x',64),'falhou');
  perform crm_worker_avancar(e,repeat('x',64),'falhou');
  insert into suporte_notificacoes(id,evento,destinatario,tipo,criado_em,atualizado_em)
    values(t,t::text,'qa@example.test','usuario',now()-interval '2 minutes',now()-interval '2 minutes');
  for r in select id from suporte_notificacoes_reservar() loop
    update suporte_notificacoes set estado='entregue' where id=r;
  end loop;
  delete from suporte_notificacoes where id=t;
  delete from consultor_threads where id=t;
  delete from prospeccao_movimentos where enriquecimento_id=e;
  delete from crm_enriquecimentos where id=e;
end; $$;
