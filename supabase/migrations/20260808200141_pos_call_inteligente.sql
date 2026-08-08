-- O resultado da call entra na linha do tempo como fato imutável. A chave parcial
-- impede que um retry da geração publique a mesma análise duas vezes.
create unique index crm_eventos_call_analise_unica_idx
  on public.crm_eventos (dono, fonte, fonte_id, tipo)
  where fonte = 'calls'
    and tipo = 'call_analisada'
    and fonte_id is not null;

create function private.calls_publicar_analise()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_empresa uuid;
  v_contato uuid;
  v_oportunidade uuid;
begin
  if new.status <> 'concluida' or new.resumo is null then
    return new;
  end if;

  select empresa_id, contato_id, oportunidade_id
  into v_empresa, v_contato, v_oportunidade
  from public.calls_reunioes
  where id = new.reuniao_id and dono = new.dono;

  if not found then
    return new;
  end if;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id,
    tipo, titulo, descricao, dados, fonte, fonte_id, ocorrido_em
  ) values (
    new.dono,
    v_empresa,
    v_contato,
    v_oportunidade,
    'call_analisada',
    'Análise pós-call disponível',
    new.resumo,
    jsonb_build_object(
      'reuniao_id', new.reuniao_id,
      'dores', new.dores,
      'objecoes', new.objecoes,
      'compromissos', new.compromissos,
      'proximos_passos', new.proximos_passos,
      'oportunidades_projeto', new.oportunidades_projeto,
      'sentimento', new.sentimento,
      'nota_comercial', new.nota_comercial,
      'decisoes', coalesce(new.dados -> 'decisoes', '[]'::jsonb),
      'lacunas', coalesce(new.dados -> 'lacunas', '[]'::jsonb),
      'sinais_compra', coalesce(new.dados -> 'sinais_compra', '[]'::jsonb)
    ),
    'calls',
    new.reuniao_id::text,
    new.atualizada_em
  )
  on conflict do nothing;

  return new;
end;
$$;

revoke execute on function private.calls_publicar_analise() from public;
revoke execute on function private.calls_publicar_analise() from anon;
revoke execute on function private.calls_publicar_analise() from authenticated;

create trigger calls_analise_publicada_no_crm
  after insert or update of status on public.calls_analises
  for each row
  when (new.status = 'concluida')
  execute function private.calls_publicar_analise();

-- O profissional pode editar a recomendação antes de aplicá-la. A função roda
-- com os privilégios e RLS da própria sessão; o trigger existente do CRM grava a
-- mudança na linha do tempo sem abrir INSERT direto em crm_eventos.
create function public.calls_aplicar_proxima_acao(
  p_reuniao uuid,
  p_acao text,
  p_quando timestamptz default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_oportunidade uuid;
  v_acao text := btrim(coalesce(p_acao, ''));
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if char_length(v_acao) not between 3 and 500 then
    raise exception 'acao_invalida' using errcode = '22023';
  end if;
  if p_quando is not null and (
    p_quando < date_trunc('day', now())
    or p_quando > now() + interval '2 years'
  ) then
    raise exception 'data_invalida' using errcode = '22023';
  end if;

  select oportunidade_id
  into v_oportunidade
  from public.calls_reunioes
  where id = p_reuniao and dono = v_dono;

  if not found then
    return false;
  end if;

  update public.crm_oportunidades
  set
    proxima_acao = v_acao,
    proxima_acao_em = p_quando,
    ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
  where id = v_oportunidade
    and dono = v_dono
    and (
      proxima_acao is distinct from v_acao
      or proxima_acao_em is distinct from p_quando
    );

  return found;
end;
$$;

comment on function public.calls_aplicar_proxima_acao(uuid, text, timestamptz) is
  'Confirma uma próxima ação editável do pós-call no CRM da própria sessão.';

revoke execute on function public.calls_aplicar_proxima_acao(uuid, text, timestamptz) from public;
revoke execute on function public.calls_aplicar_proxima_acao(uuid, text, timestamptz) from anon;
grant execute on function public.calls_aplicar_proxima_acao(uuid, text, timestamptz) to authenticated;
