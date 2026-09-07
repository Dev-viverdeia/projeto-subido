-- Somente fixtures sintéticas. Nenhum arquivo é lido ou enviado a provedores.
-- Todos os usuários e metadados desaparecem no ROLLBACK.
begin;
insert into auth.users(id,email,created_at,raw_app_meta_data,raw_user_meta_data) values
('10101010-7777-4777-8777-101010101010','qa-anexo-a@example.invalid',now(),'{}','{}'),
('20202020-7777-4777-8777-202020202020','qa-anexo-b@example.invalid',now(),'{}','{}');
insert into public.consultor_threads(id,dono,titulo) values
('30303030-7777-4777-8777-303030303030','10101010-7777-4777-8777-101010101010','QA A'),
('40404040-7777-4777-8777-404040404040','20202020-7777-4777-8777-202020202020','QA B');
insert into public.consultor_mensagens(id,thread_id,papel,conteudo) values
('50505050-7777-4777-8777-505050505050','30303030-7777-4777-8777-303030303030','usuario','QA anexo');
insert into storage.objects(bucket_id,name,metadata) values
('sobral-anexos','10101010-7777-4777-8777-101010101010/30303030-7777-4777-8777-303030303030/60606060-7777-4777-8777-606060606060-audio.webm','{"size":12,"mimetype":"audio/webm"}'),
('sobral-anexos','20202020-7777-4777-8777-202020202020/40404040-7777-4777-8777-404040404040/70707070-7777-4777-8777-707070707070-audio.webm','{"size":12,"mimetype":"audio/webm"}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10101010-7777-4777-8777-101010101010","role":"authenticated"}',true);
do $$
declare
  v_dono uuid := '10101010-7777-4777-8777-101010101010';
  v_mensagem uuid := '50505050-7777-4777-8777-505050505050';
  v_id uuid := '60606060-7777-4777-8777-606060606060';
  v_proprio text := '10101010-7777-4777-8777-101010101010/30303030-7777-4777-8777-303030303030/60606060-7777-4777-8777-606060606060-audio.webm';
  v_outro text := '20202020-7777-4777-8777-202020202020/40404040-7777-4777-8777-404040404040/70707070-7777-4777-8777-707070707070-audio.webm';
  v_caminho text;
  v_anexos jsonb;
begin
  assert not exists(select 1 from storage.objects where name=v_outro), 'storage_de_outra_conta_visivel';
  foreach v_caminho in array array[v_outro,v_outro||'#alias',v_proprio||'?alias',
    replace(v_proprio,'audio.webm','%2e%2e/privado'),v_proprio||'/../outro',v_proprio||'#alias',
    replace(v_proprio,'30303030-7777-4777-8777-303030303030','40404040-7777-4777-8777-404040404040')] loop
    begin
      insert into public.consultor_anexos(id,mensagem_id,dono,nome,tipo_mime,tamanho_bytes,categoria,caminho_storage)
      values(v_id,v_mensagem,v_dono,'audio.webm','audio/webm',12,'audio',v_caminho);
      raise exception 'aceitou_caminho_nao_autorizado';
    exception when insufficient_privilege then null; end;
  end loop;
  begin
    insert into public.consultor_anexos(id,mensagem_id,dono,nome,tipo_mime,tamanho_bytes,categoria,caminho_storage)
    values(v_id,v_mensagem,v_dono,'audio.webm','audio/webm',13,'audio',v_proprio);
    raise exception 'aceitou_bytes_falsos';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.consultor_anexos(id,mensagem_id,dono,nome,tipo_mime,tamanho_bytes,categoria,caminho_storage)
    values(v_id,v_mensagem,v_dono,'audio.webm','image/png',12,'imagem',v_proprio);
    raise exception 'aceitou_mime_falso';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.consultor_anexos(id,mensagem_id,dono,nome,tipo_mime,tamanho_bytes,categoria,caminho_storage,transcricao)
    values(v_id,v_mensagem,v_dono,'audio.webm','audio/webm',12,'audio',v_proprio,'conteudo forjado');
    raise exception 'aceitou_transcricao_do_cliente';
  exception when insufficient_privilege then null; end;

  -- O caminho normal de confirmação e sua repetição equivalente continuam válidos.
  v_anexos := jsonb_build_array(jsonb_build_object('id',v_id,'nome','audio.webm','tipo_mime','audio/webm',
    'tamanho_bytes',12,'categoria','audio','caminho_storage',v_proprio));
  assert public.sobral_confirmar_anexos('30303030-7777-4777-8777-303030303030',
    '80808080-7777-4777-8777-808080808080','QA A','Ouça este áudio',v_anexos)='80808080-7777-4777-8777-808080808080';
  perform public.sobral_confirmar_anexos('30303030-7777-4777-8777-303030303030',
    '80808080-7777-4777-8777-808080808080','QA A','Ouça este áudio',v_anexos);
  assert (select count(*)=1 from public.consultor_anexos), 'duplicou_anexos';
  perform set_config('request.jwt.claims','{"sub":"20202020-7777-4777-8777-202020202020","role":"authenticated"}',true);
  assert not exists(select 1 from public.consultor_anexos), 'anexo_de_outra_conta_visivel';
end;
$$;
select 'OK: proprietário, conversa, caminhos, MIME, bytes, transcrição e confirmação idempotente' as resultado;
rollback;
