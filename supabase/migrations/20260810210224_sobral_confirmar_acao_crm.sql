-- =============================================================================
-- SOBRAL AI -> CRM
--
-- Uma orientação do chat só vira estado operacional depois de revisão humana.
-- A mensagem guarda o alvo original da recomendação; esta função usa esse alvo
-- em vez do lead que estiver em foco no momento do clique. Assim uma conversa
-- antiga nunca atualiza silenciosamente outra oportunidade.
-- =============================================================================

begin;

create function public.sobral_confirmar_acao_crm(
  p_mensagem uuid,
  p_acao text,
  p_quando timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_oportunidade_texto text;
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

  select mensagem.direcao #>> '{contexto_acao,oportunidade_id}'
  into v_oportunidade_texto
  from public.consultor_mensagens mensagem
  join public.consultor_threads thread on thread.id = mensagem.thread_id
  where mensagem.id = p_mensagem
    and mensagem.papel = 'consultor'
    and thread.dono = v_dono
  for update of mensagem;

  if not found
    or v_oportunidade_texto is null
    or v_oportunidade_texto !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return false;
  end if;

  v_oportunidade := v_oportunidade_texto::uuid;

  select empresa_id
  into v_empresa
  from public.crm_oportunidades
  where id = v_oportunidade
    and dono = v_dono
    and etapa not in ('ganho', 'perdido');

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
    null, v_acao, p_quando, 'pendente', 'crm', 'proxima_acao', 'principal'
  )
  on conflict (dono, oportunidade_id, origem)
    where origem = 'crm' and reuniao_id is null
  do update set
    titulo = excluded.titulo,
    prazo_em = excluded.prazo_em,
    status = 'pendente',
    categoria = 'proxima_acao',
    chave_origem = 'principal',
    projeto_execucao_id = coalesce(
      excluded.projeto_execucao_id,
      public.projeto_acoes.projeto_execucao_id
    );

  update public.consultor_mensagens
  set direcao = jsonb_set(
    direcao,
    '{acao_confirmada}',
    jsonb_build_object(
      'acao', v_acao,
      'quando', p_quando,
      'confirmada_em', now()
    ),
    true
  )
  where id = p_mensagem;

  return true;
end;
$$;

comment on function public.sobral_confirmar_acao_crm(uuid, text, timestamptz) is
  'Confirma uma orientação revisada do Sobral AI no CRM e no Plano Vivo, usando o lead gravado na própria mensagem.';

revoke execute on function public.sobral_confirmar_acao_crm(uuid, text, timestamptz) from public;
revoke execute on function public.sobral_confirmar_acao_crm(uuid, text, timestamptz) from anon;
grant execute on function public.sobral_confirmar_acao_crm(uuid, text, timestamptz) to authenticated;

commit;
