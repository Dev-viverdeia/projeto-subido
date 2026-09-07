-- Dados isolados, revertidos. Não executa provedores nem consome créditos reais.
begin;
do $$
declare
  u uuid := gen_random_uuid(); outro uuid := gen_random_uuid(); pedido uuid := gen_random_uuid();
  a uuid; b uuid; saldo integer; job uuid; execucao public.operacoes_jobs;
begin
  insert into auth.users(id,email,raw_app_meta_data,created_at,updated_at)
    values(u,'qa-busca-'||u||'@example.invalid','{"plano_subido":"pro"}',now(),now()),
          (outro,'qa-busca-'||outro||'@example.invalid','{"plano_subido":"pro"}',now(),now());
  a := public.prospeccao_sistema_solicitar_lista(u,pedido,'Clínicas','Recife',5);
  select id into job from public.operacoes_jobs where dono=u and referencia_id=a and tipo='prospeccao';
  if job is null then raise exception 'QA: reserva sem fila'; end if;
  select c.saldo into saldo from public.prospeccao_carteiras c where dono=u;
  b := public.prospeccao_sistema_solicitar_lista(u,pedido,'Clínicas','Recife',5);
  if a <> b then raise exception 'QA: reenvio criou outra lista'; end if;
  if (select count(*) from public.prospeccao_movimentos where dono=u and tipo='busca') <> 1
    then raise exception 'QA: duas cobranças'; end if;
  if (select count(*) from public.operacoes_jobs where dono=u and referencia_id=a) <> 1
    then raise exception 'QA: duas execuções'; end if;
  if (select c.saldo from public.prospeccao_carteiras c where dono=u) <> saldo
    then raise exception 'QA: saldo mudou no reenvio'; end if;
  begin
    perform public.prospeccao_sistema_solicitar_lista(u,pedido,'Clínicas','Olinda',5);
    raise exception 'QA: mesma chave aceitou recorte diferente';
  exception when sqlstate '22023' then
    if sqlerrm <> 'solicitacao_divergente' then raise; end if;
  end;
  -- Resultado encerrado continua recuperável sem reservar outra vez.
  perform public.prospeccao_sistema_falhar_lista(u,a,'QA falha controlada');
  b := public.prospeccao_sistema_solicitar_lista(u,pedido,'Clínicas','Recife',5);
  if a <> b then raise exception 'QA: falha criou nova busca'; end if;
  perform public.prospeccao_sistema_falhar_lista(u,a,'QA falha repetida');
  if (select c.saldo from public.prospeccao_carteiras c where dono=u) <> saldo+5
    then raise exception 'QA: estorno incorreto ou repetido'; end if;
  b := public.prospeccao_sistema_solicitar_lista(outro,pedido,'Clínicas','Recife',5);
  if a=b then raise exception 'QA: pedido atravessou conta'; end if;
  b := public.prospeccao_sistema_solicitar_lista(u,gen_random_uuid(),'Clínicas','Recife',5);
  if a=b then raise exception 'QA: nova busca intencional foi bloqueada'; end if;
  select c.saldo into saldo from public.prospeccao_carteiras c where dono=u;
  update public.operacoes_jobs set max_tentativas=2 where dono=u and referencia_id=b;
  select * into execucao from public.operacoes_sistema_reivindicar(
    1,'qa',array['prospeccao']::public.operacao_tipo[],
    (select id from public.operacoes_jobs where dono=u and referencia_id=b)
  );
  perform public.operacoes_sistema_falhar(execucao.id,execucao.bloqueio_id,'qa','QA falha transitória');
  if (select c.saldo from public.prospeccao_carteiras c where dono=u) <> saldo
    then raise exception 'QA: falha transitória estornou antes da retomada'; end if;
  update public.operacoes_jobs set disponivel_em=now() where id=execucao.id;
  select * into execucao from public.operacoes_sistema_reivindicar(1,'qa',array['prospeccao']::public.operacao_tipo[],execucao.id);
  perform public.operacoes_sistema_falhar(execucao.id,execucao.bloqueio_id,'qa','QA falha definitiva');
  if (select status from public.prospeccao_listas where id=b) <> 'falhou'
    then raise exception 'QA: falha definitiva deixou lista aberta'; end if;
  if (select c.saldo from public.prospeccao_carteiras c where dono=u) <> saldo+5
    then raise exception 'QA: falha definitiva não devolveu créditos'; end if;
  -- Compatibilidade com o worker anterior: repetir o estorno não devolve em dobro.
  perform public.prospeccao_sistema_falhar_lista(u,b,'QA estorno repetido');
  if (select c.saldo from public.prospeccao_carteiras c where dono=u) <> saldo+5
    then raise exception 'QA: devolução duplicada'; end if;
  if has_function_privilege('authenticated','public.prospeccao_sistema_solicitar_lista(uuid,uuid,text,text,integer)','EXECUTE')
     or has_function_privilege('anon','public.prospeccao_sistema_solicitar_lista(uuid,uuid,text,text,integer)','EXECUTE')
    then raise exception 'QA: reserva exposta ao cliente'; end if;
  b := public.prospeccao_sistema_solicitar_lista(u,gen_random_uuid(),'Clínicas','Recife',5);
  select c.saldo into saldo from public.prospeccao_carteiras c where dono=u;
  update public.operacoes_jobs set max_tentativas=1 where dono=u and referencia_id=b;
  select * into execucao from public.operacoes_sistema_reivindicar(
    1,'qa',array['prospeccao']::public.operacao_tipo[],
    (select id from public.operacoes_jobs where dono=u and referencia_id=b)
  );
  update public.operacoes_jobs set bloqueado_ate=now()-interval '1 second' where id=execucao.id;
  if exists(select 1 from public.operacoes_sistema_reivindicar(1,'qa',array['prospeccao']::public.operacao_tipo[],execucao.id))
    then raise exception 'QA: interrupção repetiu além do limite'; end if;
  if (select status from public.prospeccao_listas where id=b) <> 'falhou'
    or (select c.saldo from public.prospeccao_carteiras c where dono=u) <> saldo+5
    then raise exception 'QA: interrupção não encerrou nem estornou'; end if;
end;
$$;
select 'ok: reserva, fila, reenvio, conflito, estorno, contas e nova busca' as resultado;
rollback;
