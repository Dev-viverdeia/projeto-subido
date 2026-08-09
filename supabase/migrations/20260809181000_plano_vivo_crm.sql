-- Próximas ações já existentes e recomendações aceitas do enriquecimento também
-- pertencem ao Plano Vivo. A ação corrente do CRM é substituída, enquanto cada
-- call continua preservando seu próprio compromisso.

begin;

create unique index projeto_acoes_crm_corrente_idx
  on public.projeto_acoes (dono, oportunidade_id, origem)
  where origem = 'crm' and reuniao_id is null;

insert into public.projeto_acoes (
  dono, empresa_id, oportunidade_id, projeto_execucao_id,
  titulo, prazo_em, status, origem
)
select
  oportunidade.dono,
  oportunidade.empresa_id,
  oportunidade.id,
  execucao.id,
  btrim(oportunidade.proxima_acao),
  oportunidade.proxima_acao_em,
  'pendente',
  'crm'
from public.crm_oportunidades oportunidade
left join lateral (
  select projeto.id
  from public.projetos_execucao projeto
  where projeto.dono = oportunidade.dono
    and projeto.oportunidade_id = oportunidade.id
    and projeto.status <> 'concluido'
  order by projeto.atualizado_em desc
  limit 1
) execucao on true
where nullif(btrim(coalesce(oportunidade.proxima_acao, '')), '') is not null
on conflict (dono, oportunidade_id, origem)
  where origem = 'crm' and reuniao_id is null
do nothing;

create or replace function public.crm_aplicar_proxima_acao(
  p_oportunidade uuid,
  p_enriquecimento uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_acao text;
  v_empresa uuid;
  v_projeto uuid;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  select nullif(resultado #>> '{proximaAcao,acao}', '')
  into v_acao
  from public.crm_enriquecimentos
  where id = p_enriquecimento
    and oportunidade_id = p_oportunidade
    and dono = v_dono
    and status = 'concluido';

  if not found or v_acao is null then
    return false;
  end if;

  select empresa_id
  into v_empresa
  from public.crm_oportunidades
  where id = p_oportunidade and dono = v_dono;

  if not found then
    return false;
  end if;

  update public.crm_oportunidades
  set proxima_acao = left(v_acao, 500), proxima_acao_em = null
  where id = p_oportunidade and dono = v_dono;

  select id
  into v_projeto
  from public.projetos_execucao
  where dono = v_dono
    and oportunidade_id = p_oportunidade
    and status <> 'concluido'
  order by atualizado_em desc
  limit 1;

  insert into public.projeto_acoes (
    dono, empresa_id, oportunidade_id, projeto_execucao_id,
    reuniao_id, titulo, prazo_em, status, origem
  ) values (
    v_dono, v_empresa, p_oportunidade, v_projeto,
    null, left(v_acao, 500), null, 'pendente', 'crm'
  )
  on conflict (dono, oportunidade_id, origem)
    where origem = 'crm' and reuniao_id is null
  do update set
    titulo = excluded.titulo,
    prazo_em = excluded.prazo_em,
    status = 'pendente',
    projeto_execucao_id = coalesce(
      excluded.projeto_execucao_id,
      public.projeto_acoes.projeto_execucao_id
    );

  return true;
end;
$$;

comment on function public.crm_aplicar_proxima_acao(uuid, uuid) is
  'Aplica a recomendação validada do dossiê no CRM e no plano rastreável do cliente.';

revoke execute on function public.crm_aplicar_proxima_acao(uuid, uuid) from public;
revoke execute on function public.crm_aplicar_proxima_acao(uuid, uuid) from anon;
grant execute on function public.crm_aplicar_proxima_acao(uuid, uuid) to authenticated;

commit;
