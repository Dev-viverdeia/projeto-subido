begin;

-- Rejeição explícita permite uma nova tentativa; timeout mantém a chave anterior.
create or replace function public.projeto_email_reservar(
  p_evento uuid, p_destinatario text, p_assunto text, p_fingerprint text
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  e public.projeto_portal_eventos%rowtype;
  recusado boolean;
  inicio timestamptz;
begin
  select * into e from public.projeto_portal_eventos where id = p_evento for update;
  if not found then return jsonb_build_object('resultado', 'ausente'); end if;
  if p_fingerprint !~ '^[a-f0-9]{64}$' or length(p_destinatario) > 320
     or length(p_assunto) > 240 then raise exception 'Dados de envio invalidos'; end if;

  -- Um convite antigo não pode voltar a pedir uma decisão já registrada.
  if e.tipo in ('aprovacao_solicitada', 'lembrete_aprovacao') and (
    not exists (select 1 from public.projetos_execucao p
      where p.id = e.projeto_execucao_id and p.portal_ativo)
    or not exists (select 1 from public.projeto_tarefas t
      where t.id = e.tarefa_id and t.cliente_status = 'aguardando')
    or coalesce(e.email_origem_evento_id, e.id) is distinct from (
      select v.id from public.projeto_portal_eventos v
      where v.tarefa_id = e.tarefa_id and v.tipo = 'aprovacao_solicitada'
      order by v.criado_em desc, v.id desc limit 1)
  ) then return jsonb_build_object('resultado', 'obsoleto'); end if;

  if e.email_status in ('enviado', 'entregue', 'atrasado') then
    return jsonb_build_object('resultado', 'ja_enviada', 'destinatario', e.email_destinatario);
  end if;
  if e.email_status in ('reclamado', 'suprimido') then
    return jsonb_build_object('resultado', 'bloqueado');
  end if;
  if e.email_status = 'devolvido' and e.email_destinatario = p_destinatario then
    return jsonb_build_object('resultado', 'corrigir_endereco');
  end if;
  if e.email_status = 'enviando' and e.email_atualizado_em > now() - interval '2 minutes' then
    return jsonb_build_object('resultado', 'em_andamento');
  end if;

  recusado := e.email_erro in ('envio_recusado', 'configuracao_indisponivel', 'destinatario_ausente')
    or e.email_status = 'devolvido';
  recusado := coalesce(recusado, false);
  -- Registros legados sem chave não podem ser reenviados às cegas.
  if e.email_fingerprint is null and e.email_tentativas > 0 and not recusado then
    return jsonb_build_object('resultado', 'verificacao_necessaria');
  end if;
  if e.email_fingerprint is not null and not recusado then
    if e.email_fingerprint <> p_fingerprint then
      return jsonb_build_object('resultado', 'conteudo_alterado');
    end if;
    if e.email_primeira_tentativa_em < now() - interval '23 hours' then
      return jsonb_build_object('resultado', 'verificacao_necessaria');
    end if;
  end if;
  inicio := case when not recusado and e.email_fingerprint = p_fingerprint
    and e.email_primeira_tentativa_em > now() - interval '23 hours'
    then e.email_primeira_tentativa_em else now() end;
  update public.projeto_portal_eventos set
    email_destinatario = p_destinatario, email_assunto = p_assunto,
    email_status = 'enviando', email_erro = null, email_atualizado_em = now(),
    email_tentativas = email_tentativas + 1, email_fingerprint = p_fingerprint,
    email_primeira_tentativa_em = inicio, email_provider_id = null,
    email_enviado_em = null, email_entregue_em = null
  where id = p_evento;
  return jsonb_build_object('resultado', 'reservada', 'chave',
    'subido-' || p_evento || '-' || p_fingerprint || '-' || extract(epoch from inicio)::text,
    'inicio', inicio);
end;
$$;
drop function public.projeto_email_confirmar(uuid,text,text,text,timestamptz);
create function public.projeto_email_confirmar(
  p_evento uuid, p_fingerprint text, p_provider_id text,
  p_status text, p_ocorrido_em timestamptz, p_tentativa text default null
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
  -- MD5 identifica a tentativa, não é usado como assinatura de segurança.
  if p_tentativa is not null and p_tentativa is distinct from md5(
    'subido-' || e.id || '-' || e.email_fingerprint || '-' ||
    extract(epoch from e.email_primeira_tentativa_em)::text)
    then return false; end if;
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

revoke all on function public.projeto_email_confirmar(uuid,text,text,text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.projeto_email_confirmar(uuid,text,text,text,timestamptz,text) to service_role;
commit;
