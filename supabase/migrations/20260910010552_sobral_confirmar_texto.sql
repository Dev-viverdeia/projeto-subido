-- Conversa e primeira pergunta são uma transação. A mesma tentativa retorna
-- o mesmo recibo; conflito de conteúdo falha fechado. Nunca inicia IA/cobrança.
create function public.sobral_confirmar_texto(
  p_thread uuid, p_mensagem uuid, p_conteudo text, p_nova boolean
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_dono uuid := auth.uid();
begin
  if v_dono is null then
    raise exception using errcode='42501', message='Autenticação necessária';
  end if;
  if p_thread is null or p_mensagem is null or p_nova is null
    or p_conteudo is null or char_length(p_conteudo) not between 1 and 8000
    or btrim(p_conteudo) = '' then
    raise exception using errcode='22023', message='Envio inválido';
  end if;
  -- Mesma ordem do protocolo de anexos: tentativa, depois conversa.
  perform pg_advisory_xact_lock(hashtextextended(p_mensagem::text, 0));
  if exists (select 1 from public.consultor_mensagens where id=p_mensagem) then
    if not exists (
      select 1 from public.consultor_mensagens m
      join public.consultor_threads t on t.id=m.thread_id
      where m.id=p_mensagem and m.thread_id=p_thread and m.conteudo=p_conteudo
        and m.papel='usuario' and t.dono=v_dono
    ) or exists (select 1 from public.consultor_anexos where mensagem_id=p_mensagem) then
      raise exception using errcode='PT409', message='Tentativa incompatível';
    end if;
    return p_mensagem;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_thread::text, 0));
  if p_nova then
    insert into public.consultor_threads(id,dono,titulo)
      values(p_thread,v_dono,left(regexp_replace(btrim(p_conteudo),'\s+',' ','g'),80));
  end if;
  if not exists (select 1 from public.consultor_threads where id=p_thread and dono=v_dono) then
    raise exception using errcode='42501', message='Conversa indisponível';
  end if;
  insert into public.consultor_mensagens(id,thread_id,papel,conteudo)
    values(p_mensagem,p_thread,'usuario',p_conteudo);
  return p_mensagem;
end;
$$;
revoke all on function public.sobral_confirmar_texto(uuid,uuid,text,boolean) from public,anon;
grant execute on function public.sobral_confirmar_texto(uuid,uuid,text,boolean) to authenticated;
