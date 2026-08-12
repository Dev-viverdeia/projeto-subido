-- A emissão do token acontece no servidor Next, mas o consentimento precisa
-- virar dado antes de a pessoa entrar. Esta RPC usa o mesmo código-capacidade do
-- convite, valida a janela da sala e grava apenas o participante daquela reunião.

create unique index calls_participantes_identidade_idx
  on public.calls_participantes (reuniao_id, identidade_provedor)
  where identidade_provedor is not null;

create function public.calls_registrar_entrada_publica(
  p_codigo uuid,
  p_nome text,
  p_identidade text,
  p_consentiu boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reuniao public.calls_reunioes%rowtype;
  v_participante uuid;
  v_nome text := btrim(coalesce(p_nome, ''));
  v_identidade text := btrim(coalesce(p_identidade, ''));
  v_anfitriao boolean;
begin
  select r.*
  into v_reuniao
  from public.calls_reunioes r
  where r.codigo_publico = p_codigo;

  if not found then
    raise exception 'convite_invalido' using errcode = 'P0002';
  end if;

  v_anfitriao := (select auth.uid()) = v_reuniao.dono;

  if v_reuniao.status not in ('agendada', 'aguardando', 'ao_vivo') then
    raise exception 'sala_encerrada' using errcode = '55000';
  end if;
  if not v_anfitriao and now() not between v_reuniao.agendada_para - interval '30 minutes'
    and v_reuniao.agendada_para
      + make_interval(mins => v_reuniao.duracao_minutos)
      + interval '60 minutes'
  then
    raise exception 'fora_da_janela' using errcode = '55000';
  end if;
  if not p_consentiu then
    raise exception 'consentimento_necessario' using errcode = '22023';
  end if;
  if char_length(v_nome) not between 1 and 160 then
    raise exception 'nome_invalido' using errcode = '22023';
  end if;
  if char_length(v_identidade) not between 1 and 180 then
    raise exception 'identidade_invalida' using errcode = '22023';
  end if;

  insert into public.calls_participantes (
    dono, reuniao_id, papel, nome, identidade_provedor, consentiu_gravacao_em
  ) values (
    v_reuniao.dono,
    v_reuniao.id,
    case when v_anfitriao then 'anfitriao' else 'convidado' end,
    v_nome,
    v_identidade,
    now()
  )
  returning id into v_participante;

  return v_participante;
end;
$$;

revoke execute on function public.calls_registrar_entrada_publica(uuid, text, text, boolean)
  from public;
grant execute on function public.calls_registrar_entrada_publica(uuid, text, text, boolean)
  to anon, authenticated;
