-- Publica a mensagem e seus anexos juntos. Repetir a mesma tentativa não duplica
-- a conversa; reutilizar o ID com outro conteúdo falha sem sobrescrever dados.
create or replace function public.sobral_confirmar_anexos(
  p_thread uuid, p_mensagem uuid, p_titulo text, p_conteudo text, p_anexos jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_dono uuid := auth.uid();
  v_item jsonb;
  v_existente jsonb;
  v_recebido jsonb;
begin
  if v_dono is null then raise exception 'Autenticação necessária'; end if;
  if p_thread is null or p_mensagem is null or p_conteudo is null
    or char_length(p_conteudo) not between 1 and 8000
    or p_titulo is null or char_length(p_titulo) not between 1 and 100
    or p_anexos is null or jsonb_typeof(p_anexos) <> 'array'
  then raise exception 'Envio inválido'; end if;
  if jsonb_array_length(p_anexos) not between 1 and 4
    or (select sum((a->>'tamanho_bytes')::bigint) from jsonb_array_elements(p_anexos) a) > 31457280
  then raise exception 'Limite de anexos excedido'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_mensagem::text, 0));
  select jsonb_agg(jsonb_build_object(
    'id', a->>'id', 'nome', a->>'nome', 'tipo_mime', a->>'tipo_mime',
    'tamanho_bytes', (a->>'tamanho_bytes')::bigint, 'categoria', a->>'categoria',
    'caminho_storage', a->>'caminho_storage') order by a->>'id')
    into v_recebido from jsonb_array_elements(p_anexos) a;
  if exists (select 1 from public.consultor_mensagens where id = p_mensagem) then
    select jsonb_agg(jsonb_build_object(
      'id', id::text, 'nome', nome, 'tipo_mime', tipo_mime,
      'tamanho_bytes', tamanho_bytes, 'categoria', categoria,
      'caminho_storage', caminho_storage) order by id::text)
      into v_existente from public.consultor_anexos where mensagem_id = p_mensagem;
    if v_existente is distinct from v_recebido or not exists (
      select 1 from public.consultor_mensagens m join public.consultor_threads t on t.id = m.thread_id
      where m.id = p_mensagem and m.thread_id = p_thread and m.conteudo = p_conteudo
        and m.papel = 'usuario' and t.dono = v_dono
    ) then raise exception 'Tentativa diferente da mensagem já confirmada'; end if;
    return p_mensagem;
  end if;

  -- Storage também aplica RLS. Um cliente não pode confirmar um arquivo de outra
  -- conta nem declarar bytes/tipo diferentes do objeto realmente recebido.
  for v_item in select value from jsonb_array_elements(p_anexos) loop
    if not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'sobral-anexos' and o.name = v_item->>'caminho_storage'
        and split_part(o.name, '/', 1) = v_dono::text
        and split_part(o.name, '/', 2) = p_thread::text
        and (o.metadata->>'size')::bigint = (v_item->>'tamanho_bytes')::bigint
        and o.metadata->>'mimetype' = v_item->>'tipo_mime'
    ) then raise exception 'Arquivo ainda não confirmado'; end if;
  end loop;

  insert into public.consultor_threads(id, dono, titulo)
    values(p_thread, v_dono, p_titulo) on conflict (id) do nothing;
  if not exists (select 1 from public.consultor_threads where id = p_thread and dono = v_dono)
    then raise exception 'Conversa indisponível'; end if;
  insert into public.consultor_mensagens(id, thread_id, papel, conteudo)
    values(p_mensagem, p_thread, 'usuario', p_conteudo);
  insert into public.consultor_anexos(id, mensagem_id, dono, nome, tipo_mime, tamanho_bytes, categoria, caminho_storage)
    select (a->>'id')::uuid, p_mensagem, v_dono, a->>'nome', a->>'tipo_mime',
      (a->>'tamanho_bytes')::bigint, a->>'categoria', a->>'caminho_storage'
    from jsonb_array_elements(p_anexos) a;
  return p_mensagem;
end;
$$;
revoke all on function public.sobral_confirmar_anexos(uuid, uuid, text, text, jsonb) from public, anon;
grant execute on function public.sobral_confirmar_anexos(uuid, uuid, text, text, jsonb) to authenticated;
