-- Uma repetição do mesmo pedido público não cria outro atendimento ou outro e-mail.
create or replace function public.suporte_publico_criar(p_id uuid,p_email text,p_assunto text,p_texto text,p_hash text,p_url text)
returns void language plpgsql security definer set search_path = '' as $$
declare existente public.suporte_atendimentos;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text,0));
  select * into existente from public.suporte_atendimentos where id=p_id;
  if found then
    if existente.dono is null and existente.email=lower(trim(p_email)) and existente.assunto=trim(p_assunto)
      and exists (select 1 from public.suporte_mensagens where atendimento=p_id and papel='usuario' and texto=trim(p_texto)) then return; end if;
    raise exception 'conflito';
  end if;
  insert into public.suporte_atendimentos(id,email,assunto,categoria,verificado,acesso_hash,acesso_expira_em)
  values(p_id,lower(trim(p_email)),trim(p_assunto),'conta',false,p_hash,now()+interval '14 days');
  insert into public.suporte_mensagens(atendimento,papel,texto) values(p_id,'usuario',trim(p_texto));
  insert into public.suporte_notificacoes(atendimento,evento,destinatario,tipo,acesso_url)
  values(p_id,'verificar:'||p_id::text,lower(trim(p_email)),'verificar',p_url);
end; $$;
revoke all on function public.suporte_publico_criar(uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.suporte_publico_criar(uuid,text,text,text,text,text) to service_role;
