-- =============================================================================
-- CALL -> CRM -> PROJETO
--
-- Uma unica confirmacao transforma o resultado revisado da reuniao em operacao:
-- atualiza a proxima acao, move o pipeline quando autorizado e leva os
-- compromissos selecionados para o Plano Vivo. A analise continua sendo um fato
-- imutavel no historico; as mudancas de estado continuam sob revisao humana.
-- =============================================================================

begin;

alter table public.projeto_acoes
  add column categoria text not null default 'proxima_acao',
  add column chave_origem text not null default 'principal';

alter table public.projeto_acoes
  add constraint projeto_acoes_categoria_valida
    check (categoria in ('proxima_acao', 'compromisso')),
  add constraint projeto_acoes_chave_origem_tamanho
    check (char_length(chave_origem) between 1 and 80);

comment on column public.projeto_acoes.categoria is
  'Distingue a proxima acao operacional dos compromissos confirmados na reuniao.';
comment on column public.projeto_acoes.chave_origem is
  'Chave estavel e idempotente dentro da origem, usada para sincronizar mais de um item por call.';

drop index public.projeto_acoes_reuniao_unica_idx;

create unique index projeto_acoes_reuniao_chave_unica_idx
  on public.projeto_acoes (dono, reuniao_id, chave_origem)
  where reuniao_id is not null;

-- Mantem compatibilidade com a confirmacao simples e passa a reservar uma chave
-- propria para a proxima acao principal da reuniao.
create or replace function public.calls_aplicar_proxima_acao(
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
  v_empresa uuid;
  v_projeto uuid;
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

  select oportunidade_id, empresa_id
  into v_oportunidade, v_empresa
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

  select id
  into v_projeto
  from public.projetos_execucao
  where dono = v_dono
    and oportunidade_id = v_oportunidade
    and status <> 'concluido'
  order by atualizado_em desc
  limit 1;

  insert into public.projeto_acoes (
    dono, empresa_id, oportunidade_id, projeto_execucao_id,
    reuniao_id, titulo, prazo_em, status, origem, categoria, chave_origem
  ) values (
    v_dono, v_empresa, v_oportunidade, v_projeto,
    p_reuniao, v_acao, p_quando, 'pendente', 'call', 'proxima_acao', 'principal'
  )
  on conflict (dono, reuniao_id, chave_origem) where reuniao_id is not null
  do update set
    titulo = excluded.titulo,
    prazo_em = excluded.prazo_em,
    status = 'pendente',
    categoria = 'proxima_acao',
    projeto_execucao_id = coalesce(
      excluded.projeto_execucao_id,
      public.projeto_acoes.projeto_execucao_id
    );

  return true;
end;
$$;

-- A operacao completa e atomica: se qualquer item for invalido, CRM, pipeline e
-- Plano Vivo permanecem como estavam. Compromissos aceitos precisam existir na
-- analise concluida da propria reuniao; um POST adulterado nao cria fatos novos.
create function public.calls_aplicar_plano(
  p_reuniao uuid,
  p_acao text,
  p_quando timestamptz default null,
  p_etapa public.crm_etapa default null,
  p_compromissos text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_oportunidade uuid;
  v_empresa uuid;
  v_etapa_anterior public.crm_etapa;
  v_projeto uuid;
  v_compromissos_analise jsonb := '[]'::jsonb;
  v_itens text[] := '{}'::text[];
  v_chaves text[] := '{}'::text[];
  v_item text;
  v_chave text;
  v_indice integer;
  v_aplicou boolean;
  v_moveu boolean := false;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if cardinality(coalesce(p_compromissos, '{}'::text[])) > 8 then
    raise exception 'compromissos_invalidos' using errcode = '22023';
  end if;

  select reuniao.oportunidade_id, reuniao.empresa_id, oportunidade.etapa
  into v_oportunidade, v_empresa, v_etapa_anterior
  from public.calls_reunioes reuniao
  join public.crm_oportunidades oportunidade
    on oportunidade.dono = reuniao.dono
   and oportunidade.id = reuniao.oportunidade_id
  where reuniao.id = p_reuniao
    and reuniao.dono = v_dono
  for update of oportunidade;

  if not found then
    return jsonb_build_object('aplicado', false);
  end if;

  select compromissos
  into v_compromissos_analise
  from public.calls_analises
  where reuniao_id = p_reuniao
    and dono = v_dono
    and status = 'concluida';

  v_compromissos_analise := coalesce(v_compromissos_analise, '[]'::jsonb);

  foreach v_item in array coalesce(p_compromissos, '{}'::text[]) loop
    v_item := btrim(v_item);
    if char_length(v_item) not between 3 and 500 then
      raise exception 'compromisso_invalido' using errcode = '22023';
    end if;
    if not exists (
      select 1
      from jsonb_array_elements_text(v_compromissos_analise) analisado(valor)
      where btrim(analisado.valor) = v_item
    ) then
      raise exception 'compromisso_nao_confirmado' using errcode = '22023';
    end if;

    v_chave := 'compromisso:' || md5(lower(v_item));
    if not (v_chave = any(v_chaves)) then
      v_itens := array_append(v_itens, v_item);
      v_chaves := array_append(v_chaves, v_chave);
    end if;
  end loop;

  v_aplicou := public.calls_aplicar_proxima_acao(p_reuniao, p_acao, p_quando);
  if not v_aplicou then
    return jsonb_build_object('aplicado', false);
  end if;

  if p_etapa is not null and p_etapa is distinct from v_etapa_anterior then
    v_moveu := public.crm_mover_oportunidade(v_oportunidade, p_etapa);
  end if;

  select id
  into v_projeto
  from public.projetos_execucao
  where dono = v_dono
    and oportunidade_id = v_oportunidade
    and status <> 'concluido'
  order by atualizado_em desc
  limit 1;

  delete from public.projeto_acoes
  where dono = v_dono
    and reuniao_id = p_reuniao
    and categoria = 'compromisso'
    and status = 'pendente'
    and not (chave_origem = any(v_chaves));

  if cardinality(v_itens) > 0 then
    for v_indice in 1..cardinality(v_itens) loop
      insert into public.projeto_acoes (
        dono, empresa_id, oportunidade_id, projeto_execucao_id,
        reuniao_id, titulo, status, origem, categoria, chave_origem
      ) values (
        v_dono, v_empresa, v_oportunidade, v_projeto,
        p_reuniao, v_itens[v_indice], 'pendente', 'call',
        'compromisso', v_chaves[v_indice]
      )
      on conflict (dono, reuniao_id, chave_origem) where reuniao_id is not null
      do update set
        titulo = excluded.titulo,
        projeto_execucao_id = coalesce(
          excluded.projeto_execucao_id,
          public.projeto_acoes.projeto_execucao_id
        );
    end loop;
  end if;

  return jsonb_build_object(
    'aplicado', true,
    'etapaAlterada', v_moveu,
    'compromissos', cardinality(v_itens),
    'projetoVinculado', v_projeto is not null
  );
end;
$$;

comment on function public.calls_aplicar_plano(uuid, text, timestamptz, public.crm_etapa, text[]) is
  'Aplica em uma unica transacao o proximo passo, a etapa revisada e os compromissos confirmados da call.';

revoke execute on function public.calls_aplicar_plano(uuid, text, timestamptz, public.crm_etapa, text[]) from public;
revoke execute on function public.calls_aplicar_plano(uuid, text, timestamptz, public.crm_etapa, text[]) from anon;
grant execute on function public.calls_aplicar_plano(uuid, text, timestamptz, public.crm_etapa, text[]) to authenticated;

commit;
