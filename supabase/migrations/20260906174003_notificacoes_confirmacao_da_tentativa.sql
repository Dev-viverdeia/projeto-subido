begin;

-- Uma confirmação atrasada de uma tentativa antiga não pertence ao novo envio.
create or replace function public.projeto_email_confirmar(
  p_evento uuid, p_fingerprint text, p_provider_id text,
  p_status text, p_ocorrido_em timestamptz
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  e public.projeto_portal_eventos%rowtype;
  estados text[] := array['nao_solicitado','enviando','enviado','atrasado','falhou',
    'entregue','devolvido','suprimido','reclamado'];
begin
  if p_status not in ('enviado','atrasado','falhou','entregue','devolvido','suprimido','reclamado')
    or p_provider_id is null or p_ocorrido_em is null then return false; end if;
  select * into e from public.projeto_portal_eventos
    where (p_evento is not null and id = p_evento)
      or (p_evento is null and email_provider_id = p_provider_id) for update;
  if not found then return false; end if;
  if e.email_primeira_tentativa_em is not null
    and p_ocorrido_em < date_trunc('second', e.email_primeira_tentativa_em)
    then return false; end if;
  if (p_fingerprint is not null and e.email_fingerprint is distinct from p_fingerprint)
    or (e.email_provider_id is not null and e.email_provider_id <> p_provider_id)
    or (p_fingerprint is null and e.email_provider_id is null) then return false; end if;

  -- Uma falha de transporte local é incerteza, não uma rejeição do provedor.
  if e.email_status = 'falhou' and e.email_erro = 'envio_incerto' then
    e.email_status := 'enviando';
  end if;
  if array_position(estados, p_status) < array_position(estados, e.email_status) then
    return true;
  end if;
  update public.projeto_portal_eventos set email_provider_id = p_provider_id,
    email_status = p_status,
    email_erro = case when p_status = 'falhou' then 'envio_recusado' else null end,
    email_enviado_em = coalesce(email_enviado_em, p_ocorrido_em),
    email_entregue_em = case when p_status = 'entregue'
      then coalesce(email_entregue_em, p_ocorrido_em) else email_entregue_em end,
    email_atualizado_em = greatest(coalesce(email_atualizado_em, p_ocorrido_em), p_ocorrido_em)
  where id = e.id;
  return true;
end;
$$;

commit;
