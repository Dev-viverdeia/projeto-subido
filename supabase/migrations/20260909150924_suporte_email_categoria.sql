-- Pedidos recebidos por e-mail não são necessariamente problemas de acesso.
create or replace function public.suporte_email_novo(p_email uuid,p_remetente text,p_assunto text,p_texto text,p_hash text,p_url text,p_message_id text,p_anexos jsonb default '[]') returns uuid language plpgsql security definer set search_path='' as $$
declare e public.suporte_email_recebidos; mid uuid; arquivo jsonb;
begin
  select * into e from public.suporte_email_recebidos where id=p_email for update;
  if not found then raise exception 'email_ausente'; end if;
  if e.estado='processado' then return e.atendimento; end if;
  if e.estado<>'processando' then raise exception 'estado_invalido'; end if;
  if jsonb_typeof(p_anexos)<>'array' or jsonb_array_length(p_anexos)>3 then raise exception 'anexos_invalidos'; end if;
  perform public.suporte_publico_criar(p_email,p_remetente,p_assunto,p_texto,p_hash,p_url);
  update public.suporte_atendimentos set categoria='outros' where id=p_email;
  update public.suporte_mensagens set canal='email' where atendimento=p_email returning id into mid;
  for arquivo in select * from jsonb_array_elements(p_anexos) loop
    if arquivo->>'caminho' not like 'email/'||p_email::text||'/%' then raise exception 'anexo_invalido'; end if;
    insert into public.suporte_arquivos(id,mensagem,nome,caminho,mime,bytes) values((arquivo->>'id')::uuid,mid,arquivo->>'nome',arquivo->>'caminho',arquivo->>'mime',(arquivo->>'bytes')::integer);
  end loop;
  update public.suporte_email_recebidos set estado='processado',atendimento=p_email,mensagem=mid,message_id=p_message_id,atualizado_em=now() where id=p_email;
  return p_email;
end; $$;
