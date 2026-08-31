-- =============================================================================
-- DEPENDENCIAS DO CLIENTE E DA IMPLEMENTACAO
--
-- O acordo do kickoff passa a gerar uma lista unica de preparacao. Cada item
-- tem dono, pode ou nao aparecer no portal e continua usando o Plano Vivo que
-- ja conecta venda, reunioes e entrega.
-- =============================================================================

begin;

alter table public.projeto_acoes
  drop constraint projeto_acoes_origem_valida,
  drop constraint projeto_acoes_categoria_valida;

alter table public.projeto_acoes
  add column responsavel_tipo text not null default 'prestador',
  add column responsavel_nome text,
  add column visivel_cliente boolean not null default false,
  add constraint projeto_acoes_origem_valida
    check (origem in ('call', 'crm', 'manual', 'briefing')),
  add constraint projeto_acoes_categoria_valida
    check (categoria in ('proxima_acao', 'compromisso', 'acesso', 'dependencia')),
  add constraint projeto_acoes_responsavel_tipo_valido
    check (responsavel_tipo in ('cliente', 'prestador')),
  add constraint projeto_acoes_responsavel_nome_tamanho
    check (
      responsavel_nome is null
      or char_length(btrim(responsavel_nome)) between 2 and 160
    ),
  add constraint projeto_acoes_visibilidade_coerente
    check (not visivel_cliente or responsavel_tipo = 'cliente');

comment on column public.projeto_acoes.responsavel_tipo is
  'Indica se a pendencia depende do cliente ou de quem implementa o projeto.';
comment on column public.projeto_acoes.responsavel_nome is
  'Nome humano exibido na lista de preparacao; nao representa permissao de acesso.';
comment on column public.projeto_acoes.visivel_cliente is
  'Libera somente esta pendencia para o portal individual do cliente.';

create unique index projeto_acoes_briefing_chave_unica_idx
  on public.projeto_acoes (dono, projeto_execucao_id, chave_origem)
  where origem = 'briefing' and projeto_execucao_id is not null;

alter table public.projeto_portal_eventos
  drop constraint projeto_portal_eventos_tipo_valido,
  add constraint projeto_portal_eventos_tipo_valido
    check (tipo in (
      'portal_ativado',
      'portal_desativado',
      'link_rotacionado',
      'aprovacao_solicitada',
      'entrega_aprovada',
      'ajustes_solicitados',
      'arquivo_liberado',
      'arquivo_retirado',
      'pendencia_concluida'
    ));

create function public.projeto_portal_concluir_pendencia(
  p_codigo uuid,
  p_acao uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_projeto public.projetos_execucao%rowtype;
  v_acao public.projeto_acoes%rowtype;
begin
  select * into v_projeto
  from public.projetos_execucao
  where portal_codigo = p_codigo
    and portal_ativo = true;

  if not found then
    return false;
  end if;

  select * into v_acao
  from public.projeto_acoes
  where id = p_acao
    and dono = v_projeto.dono
    and projeto_execucao_id = v_projeto.id
    and responsavel_tipo = 'cliente'
    and visivel_cliente = true
    and status = 'pendente'
  for update;

  if not found then
    return false;
  end if;

  update public.projeto_acoes
  set status = 'concluida'
  where id = v_acao.id;

  insert into public.projeto_portal_eventos (
    dono,
    projeto_execucao_id,
    tipo,
    autor,
    comentario
  ) values (
    v_projeto.dono,
    v_projeto.id,
    'pendencia_concluida',
    'cliente',
    v_acao.titulo
  );

  return true;
end;
$$;

revoke all on function public.projeto_portal_concluir_pendencia(uuid, uuid) from public;
revoke all on function public.projeto_portal_concluir_pendencia(uuid, uuid) from anon;
revoke all on function public.projeto_portal_concluir_pendencia(uuid, uuid) from authenticated;
grant execute on function public.projeto_portal_concluir_pendencia(uuid, uuid) to service_role;

commit;
