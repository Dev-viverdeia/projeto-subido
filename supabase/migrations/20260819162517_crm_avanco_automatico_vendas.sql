-- =============================================================================
-- CRM · AVANCO AUTOMATICO PELOS FATOS DA VENDA
--
-- O pipeline segue o trabalho que realmente aconteceu. Abrir a sala nao conta:
-- a oportunidade so avanca quando a call comeca. Proposta so conta quando foi
-- apresentada. Aceite e recusa explicita registram o desfecho, sem permitir que
-- um evento antigo rebaixe uma oportunidade que ja avancou.
-- =============================================================================

begin;

-- Calls podem ser atualizadas pelo app autenticado ou pelos servicos da sala.
-- Manter a regra no trigger garante o mesmo comportamento nos dois caminhos.
create or replace function private.calls_registrar_fato()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titulo text;
begin
  if tg_op = 'INSERT' then
    insert into public.crm_eventos (
      dono, empresa_id, contato_id, oportunidade_id,
      tipo, titulo, dados, fonte, fonte_id, ocorrido_em
    ) values (
      new.dono, new.empresa_id, new.contato_id, new.oportunidade_id,
      'call_agendada', 'Call agendada',
      jsonb_build_object(
        'reuniao_id', new.id,
        'tipo', new.tipo,
        'agendada_para', new.agendada_para,
        'duracao_minutos', new.duracao_minutos,
        'live_coach_ativo', new.live_coach_ativo
      ),
      'calls', new.id::text, new.criada_em
    );

    update public.crm_oportunidades
    set
      proxima_acao = 'Realizar call: ' || new.titulo,
      proxima_acao_em = new.agendada_para
    where id = new.oportunidade_id and dono = new.dono;

    return new;
  end if;

  if old.status is not distinct from new.status then
    return new;
  end if;

  v_titulo := case new.status
    when 'aguardando' then 'Sala de call aberta'
    when 'ao_vivo' then 'Call iniciada'
    when 'processando' then 'Call encerrada, processamento iniciado'
    when 'concluida' then 'Call concluída'
    when 'cancelada' then 'Call cancelada'
    else 'Status da call alterado'
  end;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id,
    tipo, titulo, dados, fonte, fonte_id, ocorrido_em
  ) values (
    new.dono, new.empresa_id, new.contato_id, new.oportunidade_id,
    'call_status', v_titulo,
    jsonb_build_object('reuniao_id', new.id, 'de', old.status, 'para', new.status),
    'calls', new.id::text, now()
  );

  if new.status in ('ao_vivo', 'processando', 'concluida') then
    if new.tipo = 'proposta' then
      update public.crm_oportunidades
      set
        etapa = 'proposta',
        ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
      where id = new.oportunidade_id
        and dono = new.dono
        and etapa in ('novo_lead', 'qualificacao', 'descoberta');
    elsif new.tipo in ('descoberta', 'follow_up', 'outro') then
      update public.crm_oportunidades
      set
        etapa = 'descoberta',
        ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
      where id = new.oportunidade_id
        and dono = new.dono
        and etapa in ('novo_lead', 'qualificacao');
    end if;
  end if;

  if new.status = 'concluida' then
    update public.crm_oportunidades
    set
      proxima_acao = 'Revisar resumo e próximos passos da call',
      proxima_acao_em = null
    where id = new.oportunidade_id and dono = new.dono;
  elsif new.status = 'cancelada' then
    update public.crm_oportunidades
    set proxima_acao = null, proxima_acao_em = null
    where id = new.oportunidade_id
      and dono = new.dono
      and proxima_acao_em = new.agendada_para;
  end if;

  return new;
end;
$$;

comment on function private.calls_registrar_fato() is
  'Registra fatos da call e avanca o CRM quando uma conversa comercial realmente acontece.';

revoke execute on function private.calls_registrar_fato() from public;
revoke execute on function private.calls_registrar_fato() from anon;
revoke execute on function private.calls_registrar_fato() from authenticated;

-- O aceite e a recusa sao decisoes explicitas do cliente. Os campos de desfecho
-- sao gravados junto da etapa para respeitar a coerencia exigida pelo CRM.
create or replace function private.proposta_aceita_fechar_oportunidade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.crm_oportunidades
  set
    etapa = 'ganho',
    ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint,
    ganha_em = coalesce(ganha_em, new.aceita_em, now()),
    perdida_em = null,
    motivo_perda = null,
    proxima_acao = null,
    proxima_acao_em = null
  where id = new.oportunidade_id
    and dono = new.dono
    and etapa <> 'perdido';

  return new;
end;
$$;

comment on function private.proposta_aceita_fechar_oportunidade() is
  'Marca a oportunidade como ganha quando o cliente aceita a proposta.';

revoke execute on function private.proposta_aceita_fechar_oportunidade() from public;
revoke execute on function private.proposta_aceita_fechar_oportunidade() from anon;
revoke execute on function private.proposta_aceita_fechar_oportunidade() from authenticated;

create function private.proposta_recusada_fechar_oportunidade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.crm_oportunidades
  set
    etapa = 'perdido',
    ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint,
    ganha_em = null,
    perdida_em = coalesce(new.recusada_em, now()),
    motivo_perda = 'proposta_recusada',
    proxima_acao = null,
    proxima_acao_em = null
  where id = new.oportunidade_id
    and dono = new.dono
    and etapa not in ('ganho', 'perdido');

  return new;
end;
$$;

revoke execute on function private.proposta_recusada_fechar_oportunidade() from public;
revoke execute on function private.proposta_recusada_fechar_oportunidade() from anon;
revoke execute on function private.proposta_recusada_fechar_oportunidade() from authenticated;

create trigger propostas_recusada_fecha_oportunidade
  after update of status on public.propostas
  for each row
  when (old.status is distinct from new.status and new.status = 'recusada')
  execute function private.proposta_recusada_fechar_oportunidade();

-- Reconcilia apenas fatos inequivocos ja existentes. Nenhuma oportunidade
-- encerrada e reaberta automaticamente por um registro historico.
update public.crm_oportunidades oportunidade
set
  etapa = 'proposta',
  ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
where oportunidade.etapa in ('novo_lead', 'qualificacao', 'descoberta')
  and exists (
    select 1
    from public.calls_reunioes reuniao
    where reuniao.oportunidade_id = oportunidade.id
      and reuniao.dono = oportunidade.dono
      and reuniao.tipo = 'proposta'
      and reuniao.status in ('ao_vivo', 'processando', 'concluida')
  );

update public.crm_oportunidades oportunidade
set
  etapa = 'descoberta',
  ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
where oportunidade.etapa in ('novo_lead', 'qualificacao')
  and exists (
    select 1
    from public.calls_reunioes reuniao
    where reuniao.oportunidade_id = oportunidade.id
      and reuniao.dono = oportunidade.dono
      and reuniao.tipo in ('descoberta', 'follow_up', 'outro')
      and reuniao.status in ('ao_vivo', 'processando', 'concluida')
  );

update public.crm_oportunidades oportunidade
set
  etapa = 'perdido',
  ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint,
  ganha_em = null,
  perdida_em = coalesce(
    (
      select max(proposta_recusada.recusada_em)
      from public.propostas proposta_recusada
      where proposta_recusada.oportunidade_id = oportunidade.id
        and proposta_recusada.dono = oportunidade.dono
        and proposta_recusada.status = 'recusada'
    ),
    oportunidade.atualizado_em,
    now()
  ),
  motivo_perda = 'proposta_recusada',
  proxima_acao = null,
  proxima_acao_em = null
where oportunidade.etapa not in ('ganho', 'perdido')
  and exists (
    select 1
    from public.propostas proposta_recusada
    where proposta_recusada.oportunidade_id = oportunidade.id
      and proposta_recusada.dono = oportunidade.dono
      and proposta_recusada.status = 'recusada'
  );

commit;
