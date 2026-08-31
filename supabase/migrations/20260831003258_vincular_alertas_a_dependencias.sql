-- Liga o retorno do cliente ao item exato da preparação. Isso permite que a
-- notificação seja idempotente e que o histórico não dependa de comparar texto.

begin;

alter table public.projeto_portal_eventos
  add column acao_id uuid references public.projeto_acoes(id) on delete set null;

create index projeto_portal_eventos_acao_id_idx
  on public.projeto_portal_eventos (acao_id)
  where acao_id is not null;

create or replace function public.projeto_portal_concluir_pendencia(
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
    acao_id,
    tipo,
    autor,
    comentario
  ) values (
    v_projeto.dono,
    v_projeto.id,
    v_acao.id,
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

comment on column public.projeto_portal_eventos.acao_id is
  'Item da preparação que originou o evento do portal, quando aplicável.';

commit;
