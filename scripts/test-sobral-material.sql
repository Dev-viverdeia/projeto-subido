-- Executar em uma transação: dados inteiramente fictícios e rollback obrigatório.
begin;
do $$
declare
  u uuid := gen_random_uuid(); outro uuid := gen_random_uuid();
  empresa uuid := gen_random_uuid(); empresa2 uuid := gen_random_uuid();
  oportunidade uuid := gen_random_uuid(); oportunidade2 uuid := gen_random_uuid();
  conversa uuid := gen_random_uuid(); pergunta uuid := gen_random_uuid(); resposta uuid := gen_random_uuid();
  anexo uuid := gen_random_uuid(); sem_origem uuid := gen_random_uuid();
  resumo jsonb := '{"titulo":"QA resumo","escopo":"Triagem com IA.","decisoes":"","tarefas":"Enviar FAQ.","pendencias":"Validar preço."}';
  recibo jsonb; repetido jsonb; antes jsonb; depois jsonb;
begin
  insert into auth.users(id,email,raw_app_meta_data,created_at) values
    (u,'qa-material-'||u||'@example.invalid','{"plano_subido":"pro"}',now()),
    (outro,'qa-material-'||outro||'@example.invalid','{"plano_subido":"pro"}',now());
  -- O provisionamento inicial aplica Starter; a concessão admin ocorre depois.
  update auth.users set raw_app_meta_data='{"plano_subido":"pro"}' where id in(u,outro);
  insert into public.crm_empresas(id,dono,nome) values(empresa,u,'QA exemplo'),(empresa2,outro,'QA outra conta');
  insert into public.crm_oportunidades(id,dono,empresa_id,titulo,proxima_acao) values
    (oportunidade,u,empresa,'QA teste','Não alterar esta ação'),(oportunidade2,outro,empresa2,'QA outro','Outra ação');
  insert into public.consultor_threads(id,dono,titulo) values(conversa,u,'QA material');
  insert into public.consultor_mensagens(id,thread_id,papel,conteudo,direcao) values
    (pergunta,conversa,'usuario','Revisar arquivo',null),
    (resposta,conversa,'consultor','Resumo fictício para testar a revisão.',jsonb_build_object('material',jsonb_build_object('resumo',resumo,'fontes',jsonb_build_array(jsonb_build_object('id',anexo,'nome','reuniao.pdf'))))),
    (sem_origem,conversa,'consultor','Mensagem sem arquivo de origem.',jsonb_build_object('material',jsonb_build_object('resumo',resumo,'fontes',jsonb_build_array(jsonb_build_object('id',anexo,'nome','reuniao.pdf')))));
  insert into public.consultor_anexos(id,mensagem_id,dono,nome,tipo_mime,tamanho_bytes,categoria,caminho_storage)
    values(anexo,pergunta,u,'reuniao.pdf','application/pdf',100,'documento',u||'/'||conversa||'/'||anexo||'-reuniao.pdf');
  insert into public.sobral_geracoes(mensagem_id,thread_id,dono,tentativa,estado,resposta_id)
    values(pergunta,conversa,u,gen_random_uuid(),'concluida',resposta);
  select to_jsonb(o) into antes from public.crm_oportunidades o where id=oportunidade;

  perform set_config('request.jwt.claim.sub',outro::text,true);
  perform set_config('role','authenticated',true);
  begin perform public.sobral_salvar_material(resposta,oportunidade2,resumo); raise exception 'FAIL outra conta';
    exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claim.sub',u::text,true);
  begin perform public.sobral_salvar_material(resposta,oportunidade2,resumo); raise exception 'FAIL ficha alheia';
    exception when insufficient_privilege then null; end;
  begin perform public.sobral_salvar_material(sem_origem,oportunidade,resumo); raise exception 'FAIL sem origem';
    exception when insufficient_privilege then null; end;
  begin perform public.sobral_salvar_material(resposta,oportunidade,resumo||'{"escopo":false}'); raise exception 'FAIL tipo';
    exception when invalid_parameter_value then null; end;
  begin perform public.sobral_salvar_material(resposta,oportunidade,resumo||jsonb_build_object('escopo',repeat('a',1201))); raise exception 'FAIL limite';
    exception when invalid_parameter_value then null; end;

  perform set_config('role','postgres',true);
  update auth.users set raw_app_meta_data='{"plano_subido":"starter"}' where id=u;
  perform set_config('role','authenticated',true);
  begin perform public.sobral_salvar_material(resposta,oportunidade,resumo); raise exception 'FAIL plano';
    exception when insufficient_privilege then null; end;
  perform set_config('role','postgres',true);
  update auth.users set raw_app_meta_data='{"plano_subido":"pro"}' where id=u;
  perform set_config('role','authenticated',true);

  recibo := public.sobral_salvar_material(resposta,oportunidade,resumo);
  repetido := public.sobral_salvar_material(resposta,oportunidade,resumo);
  if recibo is distinct from repetido then raise exception 'FAIL idempotência'; end if;
  if (select count(*) from public.crm_eventos where dono=u and fonte='sobral_material')<>1 then raise exception 'FAIL duplicidade'; end if;
  begin perform public.sobral_salvar_material(resposta,oportunidade,resumo||'{"titulo":"Outra revisão"}'); raise exception 'FAIL conflito';
    exception when sqlstate 'PT409' then null; end;
  begin update public.crm_eventos set descricao='Alterado' where id=(recibo->>'id')::uuid; raise exception 'FAIL nota mutável';
    exception when insufficient_privilege then null; end;
  select to_jsonb(o) into depois from public.crm_oportunidades o where id=oportunidade;
  if antes is distinct from depois then raise exception 'FAIL venda alterada'; end if;
  perform set_config('request.jwt.claim.sub',outro::text,true);
  if exists(select 1 from public.crm_eventos where id=(recibo->>'id')::uuid) then raise exception 'FAIL leitura alheia'; end if;
  perform set_config('request.jwt.claim.sub',u::text,true);
  delete from public.consultor_threads where id=conversa;
  if not exists(select 1 from public.crm_eventos where id=(recibo->>'id')::uuid) then raise exception 'FAIL nota perdida'; end if;
  perform set_config('role','postgres',true);
end $$;
rollback;
select '13 verificações aprovadas; todos os dados fictícios revertidos' as resultado;
