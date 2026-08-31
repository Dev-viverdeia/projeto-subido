-- =============================================================================
-- CONTINUIDADE COMERCIAL POS-ENTREGA
--
-- Uma decisao de expansao confirmada na revisao de resultado pode voltar para
-- Vendas. A oportunidade nasce com o contexto da entrega, mas nunca cria uma
-- nova execucao: outro projeto continua dependendo de proposta aceita.
-- =============================================================================

begin;

alter table public.projeto_evolucoes
  add column oportunidade_continuidade_id uuid
    references public.crm_oportunidades (id)
    on delete set null;

comment on column public.projeto_evolucoes.oportunidade_continuidade_id is
  'Oportunidade comercial criada com confirmacao do profissional depois da revisao da entrega.';

create unique index projeto_evolucoes_continuidade_unica_idx
  on public.projeto_evolucoes (oportunidade_continuidade_id)
  where oportunidade_continuidade_id is not null;

create function public.projeto_evolucao_iniciar_continuidade(p_projeto_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
  v_projeto record;
  v_evolucao record;
  v_empresa_nome text;
  v_contato uuid;
  v_oportunidade uuid;
  v_titulo text;
  v_proxima_acao_em timestamptz;
begin
  if v_dono is null then
    raise exception 'sessao_obrigatoria' using errcode = '42501';
  end if;

  select
    projeto.id,
    projeto.empresa_id,
    projeto.oportunidade_id,
    projeto.titulo,
    projeto.status
  into v_projeto
  from public.projetos_execucao projeto
  where projeto.id = p_projeto_id
    and projeto.dono = v_dono
  for update;

  if not found or v_projeto.status <> 'concluido' then
    raise exception 'projeto_indisponivel';
  end if;

  select
    evolucao.id,
    evolucao.decisao,
    evolucao.resultado_observado,
    evolucao.evidencia_resultado_url,
    evolucao.proximo_passo,
    evolucao.proximo_passo_em,
    evolucao.oportunidade_continuidade_id
  into v_evolucao
  from public.projeto_evolucoes evolucao
  where evolucao.projeto_execucao_id = p_projeto_id
    and evolucao.dono = v_dono
    and evolucao.status = 'registrada'
    and evolucao.decisao in ('expandir', 'novo_projeto')
  for update;

  if not found then
    raise exception 'continuidade_indisponivel';
  end if;

  if v_evolucao.oportunidade_continuidade_id is not null then
    return v_evolucao.oportunidade_continuidade_id;
  end if;

  select oportunidade.contato_principal_id, empresa.nome
  into v_contato, v_empresa_nome
  from public.crm_oportunidades oportunidade
  join public.crm_empresas empresa
    on empresa.dono = oportunidade.dono
   and empresa.id = oportunidade.empresa_id
  where oportunidade.id = v_projeto.oportunidade_id
    and oportunidade.dono = v_dono
    and oportunidade.empresa_id = v_projeto.empresa_id;

  if not found then
    raise exception 'cliente_indisponivel';
  end if;

  v_titulo := case v_evolucao.decisao
    when 'expandir' then 'Expansao: ' || v_projeto.titulo
    else 'Novo projeto para ' || v_empresa_nome
  end;

  if v_evolucao.proximo_passo_em is not null then
    v_proxima_acao_em := (
      v_evolucao.proximo_passo_em + time '12:00'
    ) at time zone 'America/Sao_Paulo';
  end if;

  insert into public.crm_oportunidades (
    dono,
    empresa_id,
    contato_principal_id,
    titulo,
    etapa,
    origem,
    proxima_acao,
    proxima_acao_em
  ) values (
    v_dono,
    v_projeto.empresa_id,
    v_contato,
    left(v_titulo, 180),
    'novo_lead',
    'pos_entrega',
    left(v_evolucao.proximo_passo, 500),
    v_proxima_acao_em
  )
  returning id into v_oportunidade;

  insert into public.crm_eventos (
    dono,
    empresa_id,
    contato_id,
    oportunidade_id,
    tipo,
    titulo,
    descricao,
    dados,
    fonte,
    fonte_id
  ) values (
    v_dono,
    v_projeto.empresa_id,
    v_contato,
    v_oportunidade,
    'continuidade_pos_entrega',
    'Oportunidade criada depois da revisao da entrega',
    concat(
      'Resultado confirmado: ', v_evolucao.resultado_observado,
      E'\n\nProximo passo combinado: ', v_evolucao.proximo_passo
    ),
    jsonb_build_object(
      'projeto_execucao_id', v_projeto.id,
      'oportunidade_anterior_id', v_projeto.oportunidade_id,
      'evolucao_id', v_evolucao.id,
      'decisao', v_evolucao.decisao,
      'evidencia_resultado_url', v_evolucao.evidencia_resultado_url,
      'proximo_passo_em', v_evolucao.proximo_passo_em
    ),
    'entrega',
    v_projeto.id::text
  );

  update public.projeto_evolucoes
  set oportunidade_continuidade_id = v_oportunidade
  where id = v_evolucao.id
    and dono = v_dono;

  return v_oportunidade;
end;
$$;

comment on function public.projeto_evolucao_iniciar_continuidade(uuid) is
  'Cria, uma unica vez e com confirmacao, a oportunidade comercial derivada da revisao pos-entrega.';

revoke execute on function public.projeto_evolucao_iniciar_continuidade(uuid)
  from public, anon;
grant execute on function public.projeto_evolucao_iniciar_continuidade(uuid)
  to authenticated;

commit;
