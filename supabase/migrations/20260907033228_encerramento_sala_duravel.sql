begin;

alter table public.calls_reunioes add column encerramento_solicitado_em timestamptz;

-- A intenção explícita é permanente. Uma resposta atrasada de realtime ou do
-- pós-call não pode reabrir a reunião nem desfazer seu cancelamento.
create function private.calls_proteger_encerramento()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'cancelada' and new.status <> 'cancelada' then
    new.status := 'cancelada';
  end if;
  if (old.encerramento_solicitado_em is not null or old.status in ('cancelada', 'concluida', 'processando'))
    and new.status in ('agendada', 'aguardando', 'ao_vivo') then
    raise exception 'reuniao_encerrada' using errcode = 'P0001';
  end if;
  new.encerramento_solicitado_em := coalesce(old.encerramento_solicitado_em, new.encerramento_solicitado_em);
  if new.status = 'cancelada' then
    new.encerramento_solicitado_em := coalesce(new.encerramento_solicitado_em, now());
  end if;
  if new.encerramento_solicitado_em is not null and new.status in ('agendada', 'aguardando', 'ao_vivo') then
    new.status := 'processando';
  end if;
  return new;
end;
$$;

create function private.calls_enfileirar_encerramento()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.encerramento_solicitado_em is null and new.encerramento_solicitado_em is not null then
    insert into public.operacoes_jobs
      (dono, tipo, chave_idempotencia, referencia_tipo, referencia_id, payload, prioridade, max_tentativas)
    values (new.dono, 'encerramento_sala', 'encerrar_sala:' || new.id::text, 'call_reuniao', new.id,
      jsonb_build_object('reuniaoId', new.id), 100, 10)
    on conflict (dono, tipo, chave_idempotencia) do nothing;
  end if;
  return new;
end;
$$;

-- Serializa emissão/registro com a atualização que fecha a sala. Um token é
-- assinado antes deste registro; ao fechar, todas as identidades já são conhecidas.
create function private.calls_validar_entrada()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_reuniao public.calls_reunioes;
begin
  select * into v_reuniao from public.calls_reunioes
    where id = new.reuniao_id and dono = new.dono for share;
  if not found or v_reuniao.encerramento_solicitado_em is not null
    or v_reuniao.status not in ('agendada', 'aguardando', 'ao_vivo') then
    raise exception 'reuniao_encerrada' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.calls_proteger_encerramento() from public, anon, authenticated;
revoke all on function private.calls_enfileirar_encerramento() from public, anon, authenticated;
revoke all on function private.calls_validar_entrada() from public, anon, authenticated;
create trigger calls_proteger_encerramento before update on public.calls_reunioes
  for each row execute function private.calls_proteger_encerramento();
create trigger calls_enfileirar_encerramento after update on public.calls_reunioes
  for each row execute function private.calls_enfileirar_encerramento();
create trigger calls_validar_entrada before insert or update of entrou_em, identidade_provedor, reuniao_id, dono
  on public.calls_participantes for each row execute function private.calls_validar_entrada();

-- Um flush atrasado de pagehide/disconnected não rebaixa a transcrição que o
-- encerramento explícito já concluiu. A proteção deve ser atômica no banco.
create function private.calls_preservar_transcricao_concluida()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status = 'concluida' and new.status = 'processando' then
    new.status := 'concluida';
  end if;
  return new;
end;
$$;
revoke all on function private.calls_preservar_transcricao_concluida() from public, anon, authenticated;
create trigger calls_preservar_transcricao_concluida before update on public.calls_transcricoes
  for each row execute function private.calls_preservar_transcricao_concluida();

-- Mantém o algoritmo de reserva vigente e acrescenta capacidade independente
-- para fechamento; um backlog de análises não segura a revogação de uma sala.
do $$
declare v_def text;
begin
  select pg_get_functiondef('public.operacoes_sistema_reivindicar(integer,text,public.operacao_tipo[],uuid)'::regprocedure) into v_def;
  if position('capacidades (tipo, limite)' in v_def) = 0 then
    raise exception 'revisar_definicao_reivindicar';
  end if;
  v_def := replace(v_def,
    'select ''pos_call''::public.operacao_tipo, pos_calls_globais_processando',
    'select ''encerramento_sala''::public.operacao_tipo, 12 from configuracao union all select ''pos_call''::public.operacao_tipo, pos_calls_globais_processando');
  if position('''encerramento_sala''::public.operacao_tipo' in v_def) = 0 then
    raise exception 'capacidade_encerramento_nao_aplicada';
  end if;
  execute v_def;
end;
$$;

commit;
