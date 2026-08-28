-- Quando o cliente pede correções, a entrega volta para execução. A tarefa já
-- era reaberta, mas o status do projeto podia continuar exibindo "Em validação".

begin;

create or replace function public.projeto_portal_decidir(
  p_codigo uuid,
  p_tarefa_id uuid,
  p_decisao public.projeto_cliente_status,
  p_comentario text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_atualizada uuid;
  v_projeto_id uuid;
begin
  if p_decisao not in ('aprovada', 'ajustes') then
    raise exception 'decisao_invalida';
  end if;

  update public.projeto_tarefas tarefa
  set
    cliente_status = p_decisao,
    cliente_comentario = nullif(btrim(coalesce(p_comentario, '')), '')
  from public.projetos_execucao projeto
  where tarefa.id = p_tarefa_id
    and tarefa.projeto_execucao_id = projeto.id
    and projeto.portal_codigo = p_codigo
    and projeto.portal_ativo
    and tarefa.cliente_status = 'aguardando'
  returning tarefa.id, tarefa.projeto_execucao_id
  into v_atualizada, v_projeto_id;

  if v_atualizada is null then
    return false;
  end if;

  if p_decisao = 'ajustes' then
    update public.projetos_execucao
    set status = 'em_execucao', concluido_em = null
    where id = v_projeto_id;
  else
    update public.projetos_execucao projeto
    set
      status = 'concluido',
      concluido_em = coalesce(projeto.concluido_em, now())
    where projeto.id = v_projeto_id
      and not exists (
        select 1
        from public.projeto_tarefas pendente
        where pendente.projeto_execucao_id = projeto.id
          and pendente.status <> 'concluida'
      )
      and p_tarefa_id = (
        select ultima.id
        from public.projeto_tarefas ultima
        where ultima.projeto_execucao_id = projeto.id
        order by ultima.ordem desc, ultima.id desc
        limit 1
      );
  end if;

  return true;
end;
$$;

revoke execute on function public.projeto_portal_decidir(uuid, uuid, public.projeto_cliente_status, text)
  from public, anon, authenticated;
grant execute on function public.projeto_portal_decidir(uuid, uuid, public.projeto_cliente_status, text)
  to service_role;

-- Repara somente o estado inconsistente já existente: tarefa em ajuste com o
-- projeto ainda preso em validação.
update public.projetos_execucao projeto
set status = 'em_execucao', concluido_em = null
where projeto.status = 'em_validacao'
  and exists (
    select 1
    from public.projeto_tarefas tarefa
    where tarefa.projeto_execucao_id = projeto.id
      and tarefa.cliente_status = 'ajustes'
      and tarefa.status <> 'concluida'
  );

commit;
