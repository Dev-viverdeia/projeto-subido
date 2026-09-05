-- O novo horário pertence à mesma reunião. Preserve ações manuais do usuário.
create function private.calls_registrar_reagendamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.agendada_para is not distinct from new.agendada_para
    and old.duracao_minutos is not distinct from new.duracao_minutos then
    return new;
  end if;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id,
    tipo, titulo, dados, fonte, fonte_id, ocorrido_em
  ) values (
    new.dono, new.empresa_id, new.contato_id, new.oportunidade_id,
    'call_status', 'Reunião reagendada',
    jsonb_build_object(
      'reuniao_id', new.id,
      'horario_anterior', old.agendada_para,
      'agendada_para', new.agendada_para,
      'duracao_minutos', new.duracao_minutos
    ),
    'calls', new.id::text, now()
  );

  update public.crm_oportunidades
  set proxima_acao_em = new.agendada_para
  where id = new.oportunidade_id
    and dono = new.dono
    and proxima_acao_em = old.agendada_para
    and proxima_acao = 'Realizar call: ' || old.titulo;
  return new;
end;
$$;

revoke all on function private.calls_registrar_reagendamento() from public, anon, authenticated;

create trigger calls_reuniao_fato_reagendada
after update of agendada_para, duracao_minutos on public.calls_reunioes
for each row execute function private.calls_registrar_reagendamento();
